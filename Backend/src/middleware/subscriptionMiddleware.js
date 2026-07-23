const User = require('../models/user');

const requireSubscription = async (req, res, next) => {
    try {
        // Admins can always access solutions
        if (req.result.role === 'admin') {
            return next();
        }

        const user = await User.findById(req.result._id).select('subscription');
        const subscription = user?.subscription;

        // Trust subscription.active if currentPeriodEnd is not yet available.
        // If currentPeriodEnd exists, also verify the subscription has not expired.
        const isActive =
            subscription?.active &&
            (!subscription?.currentPeriodEnd ||
                new Date() < new Date(subscription.currentPeriodEnd));

        if (!isActive) {
            return res.status(403).json({
                message: 'Pro subscription required to view solutions.',
            });
        }

        next();
    } catch (err) {
        console.error('Subscription middleware error:', err.message);
        res.status(500).json({ message: 'Server error while checking subscription' });
    }
};

module.exports = requireSubscription;
