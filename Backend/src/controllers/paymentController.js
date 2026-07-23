const Stripe = require('stripe');
const User = require('../models/user');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')[0]
    .trim();

// Helper: cancel a previous Stripe subscription when the user upgrades.
async function cancelPreviousSubscription(userId, newSubscriptionId) {
    if (!stripe) return;
    try {
        const user = await User.findById(userId).select('subscription');
        const previousSubscriptionId = user?.subscription?.stripeSubscriptionId;
        if (previousSubscriptionId && previousSubscriptionId !== newSubscriptionId) {
            await stripe.subscriptions.cancel(previousSubscriptionId);
        }
    } catch (err) {
        console.error('Cancel previous subscription error:', err.message);
    }
}

// Pod-gear style: price IDs live in backend config only.
// Add both test and live IDs here so the same code works in dev and production.
const SUBSCRIPTION_PRICES = {
    price_1Tw8e0PRboCDIyhCqHZhoh9e: {
        plan: 'monthly',
        name: 'Monthly',
        price: 499,
        currency: 'usd',
        interval: 'month',
    },
    price_1Tw8e1PRboCDIyhC34soPqLO: {
        plan: 'yearly',
        name: 'Yearly',
        price: 1990,
        currency: 'usd',
        interval: 'year',
    },
};

function getPlans() {
    return Object.entries(SUBSCRIPTION_PRICES)
        .map(([priceId, details]) => ({
            priceId,
            ...details,
        }))
        .sort((a, b) => (a.plan === 'monthly' ? -1 : 1));
}

exports.getPlans = async (req, res) => {
    try {
        const plans = getPlans();
        return res.json({ plans });
    } catch (err) {
        console.error('Fetch plans error:', err.message);
        return res.status(500).json({ message: err.message || 'Failed to load plans' });
    }
};

exports.createSubscriptionSession = async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
    }

    try {
        const userId = req.result._id.toString();
        const priceId = String(req.body.priceId || '').trim();

        const planDetails = SUBSCRIPTION_PRICES[priceId];
        if (!priceId || !planDetails) {
            return res.status(400).json({ message: 'Invalid subscription plan' });
        }

        const user = await User.findById(userId);
        const existingCustomerId = user?.subscription?.stripeCustomerId;

        const sessionConfig = {
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/subscription/cancel`,
            metadata: {
                userId,
                priceId,
                plan: planDetails.plan,
            },
            subscription_data: {
                metadata: { userId, priceId },
            },
        };

        // Use existing Stripe customer for upgrades so the new subscription is
        // linked to the same customer record.
        if (existingCustomerId) {
            sessionConfig.customer = existingCustomerId;
        } else {
            sessionConfig.customer_email = user.emailId;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        // Persist checkout session id so success page can resolve it before webhook fires.
        await User.findByIdAndUpdate(userId, {
            $set: {
                'subscription.stripeSessionId': session.id,
                'subscription.priceId': priceId,
                'subscription.plan': planDetails.plan,
                'subscription.active': false,
            },
        });

        return res.json({ url: session.url });
    } catch (err) {
        console.error('Create subscription session error:', err.message);
        return res.status(500).json({
            message: err.message || 'Error creating subscription session',
        });
    }
};

exports.createPortalSession = async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
    }

    try {
        const user = await User.findById(req.result._id).select('subscription');
        const customerId = user?.subscription?.stripeCustomerId;

        if (!customerId) {
            return res.status(400).json({ message: 'No active subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${FRONTEND_URL}/MyProfile`,
        });

        return res.json({ url: session.url });
    } catch (err) {
        console.error('Create portal session error:', err.message);
        return res.status(500).json({
            message: err.message || 'Error creating portal session',
        });
    }
};

exports.fulfillSubscription = async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
    }

    try {
        const userId = req.result._id.toString();
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: 'Missing session id' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
        });

        if (session.metadata?.userId !== userId) {
            return res.status(403).json({ message: 'Session does not belong to user' });
        }

        if (session.mode !== 'subscription' || !session.subscription) {
            return res.status(400).json({ message: 'Invalid session' });
        }

        const sub =
            session.subscription && typeof session.subscription === 'object'
                ? session.subscription
                : await stripe.subscriptions.retrieve(session.subscription);

        const isActive = ['active', 'trialing'].includes(sub.status);
        const currentPeriodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : undefined;

        // Cancel any previous subscription so the user isn't double-billed.
        await cancelPreviousSubscription(userId, sub.id);

        await User.findByIdAndUpdate(userId, {
            $set: {
                'subscription.active': isActive,
                'subscription.status': sub.status,
                'subscription.stripeSubscriptionId': sub.id,
                'subscription.stripeCustomerId': session.customer,
                'subscription.priceId': session.metadata?.priceId,
                'subscription.plan': session.metadata?.plan,
                ...(currentPeriodEnd && { 'subscription.currentPeriodEnd': currentPeriodEnd }),
            },
        });

        return res.json({
            active: isActive,
            status: sub.status,
            plan: session.metadata?.plan,
            currentPeriodEnd: sub.current_period_end || null,
        });
    } catch (err) {
        console.error('Fulfill subscription error:', err.message);
        return res.status(500).json({
            message: err.message || 'Error fulfilling subscription',
        });
    }
};

exports.stripeWebhook = async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.mode !== 'subscription') {
            return res.json({ received: true });
        }

        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (!userId || !subscriptionId) {
            return res.json({ received: true });
        }

        try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const isActive = ['active', 'trialing'].includes(sub.status);
            const currentPeriodEnd = sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : undefined;

            // Cancel any previous subscription so the user isn't double-billed.
            await cancelPreviousSubscription(userId, subscriptionId);

            await User.findByIdAndUpdate(userId, {
                $set: {
                    'subscription.active': isActive,
                    'subscription.status': sub.status,
                    'subscription.stripeSubscriptionId': subscriptionId,
                    'subscription.stripeCustomerId': customerId,
                    'subscription.priceId': priceId,
                    'subscription.plan': plan,
                    ...(currentPeriodEnd && { 'subscription.currentPeriodEnd': currentPeriodEnd }),
                },
            });
        } catch (err) {
            console.error('Subscription fulfillment failed, will retry:', err);
            return res.status(500).json({ received: false });
        }
    }

    if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        const sub = event.data.object;
        const isActive =
            event.type === 'customer.subscription.deleted'
                ? false
                : ['active', 'trialing'].includes(sub.status);

        try {
            await User.updateOne(
                { 'subscription.stripeSubscriptionId': sub.id },
                {
                    $set: {
                        'subscription.active': isActive,
                        'subscription.status': sub.status,
                        'subscription.currentPeriodEnd': sub.current_period_end
                            ? new Date(sub.current_period_end * 1000)
                            : undefined,
                    },
                }
            );
        } catch (err) {
            console.error('Error syncing subscription lifecycle:', err);
            return res.status(500).json({ received: false });
        }
    }

    return res.json({ received: true });
};
