import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { Check, Sparkles, ArrowRight, Loader2, Crown } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiBase';

function formatPrice(cents, currency) {
  if (!cents && cents !== 0) return '$0.00';
  const value = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(value);
}

function getPeriodLabel(interval) {
  if (interval === 'month') return '/month';
  if (interval === 'year') return '/year';
  return `/${interval || 'period'}`;
}

function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isPro = user?.subscription?.active;
  const userPlan = user?.subscription?.plan;

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      setPlansError('');
      try {
        const baseURL = (API_BASE_URL || '').replace(/\/+$/, '');
        const response = await fetch(`${baseURL}/api/payments/plans`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load plans');
        }

        let fetchedPlans = data.plans || [];

        // If user already has a monthly subscription, only offer yearly upgrade.
        if (isPro && userPlan === 'monthly') {
          fetchedPlans = fetchedPlans.filter((p) => p.plan === 'yearly');
        }

        setPlans(fetchedPlans);

        const defaultPlan =
          fetchedPlans.find((p) => p.plan === 'yearly') ||
          fetchedPlans.find((p) => p.plan === 'monthly') ||
          fetchedPlans[0];
        if (defaultPlan) {
          setSelectedPlan(defaultPlan.plan);
        }
      } catch (err) {
        console.error('Load plans error:', err);
        setPlansError(err.message || 'Could not load pricing plans');
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, [isPro, userPlan]);

  const currentPlan = plans.find((p) => p.plan === selectedPlan) || plans[0];

  const handleSubscribe = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate(`/login?callbackUrl=${encodeURIComponent('/pricing')}`);
      return;
    }

    // Yearly subscribers already see the Pro Member card, but guard just in case.
    if (isPro && userPlan === 'yearly') {
      navigate('/MyProfile');
      return;
    }

    if (!currentPlan?.priceId) return;

    setCheckoutLoading(true);
    try {
      const baseURL = (API_BASE_URL || '').replace(/\/+$/, '');
      const response = await fetch(`${baseURL}/api/payments/create-subscription-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId: currentPlan.priceId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL not received');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      alert(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-16 md:py-24 pt-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold text-xs uppercase tracking-widest">
              Unlock Solutions
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-base-content mb-6 tracking-tighter">
            Go <span className="text-primary">Pro</span>
          </h1>
          <p className="text-lg md:text-xl text-base-content/70 mb-10">
            Get instant access to reference solutions, editorial code, and optimal approaches for every problem.
          </p>

          {plansLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-base-content/60">Loading plans...</p>
            </div>
          ) : plansError ? (
            <div className="card bg-base-100 border border-red-200 max-w-md mx-auto p-6">
              <p className="text-red-600 font-medium">{plansError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-outline btn-sm mt-4"
              >
                Retry
              </button>
            </div>
          ) : isPro && userPlan === 'yearly' ? (
            <div className="card bg-base-100 shadow-xl border border-base-300 max-w-md mx-auto p-8 md:p-10">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-base-content mb-2">You are a Pro Member</h2>
              <p className="text-base-content/70 mb-6">
                Your yearly subscription is active. Enjoy unlimited access to reference solutions and editorial content.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/problems" className="btn btn-primary flex-1">
                  Start Solving
                </Link>
                <Link to="/MyProfile" className="btn btn-outline flex-1">
                  My Profile
                </Link>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="card bg-base-100 border border-base-300 max-w-md mx-auto p-6">
              <p className="text-base-content/70">No subscription plans available right now.</p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 p-1 bg-base-100 border border-base-300 rounded-full mb-10">
                {plans.map((plan) => (
                  <button
                    key={plan.plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan.plan)}
                    className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedPlan === plan.plan
                        ? 'bg-primary text-primary-content shadow-sm'
                        : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'
                    }`}
                  >
                    {plan.name}
                    {plan.plan === 'yearly' && selectedPlan === 'yearly' && (
                      <span className="absolute -top-2 -right-2 bg-success text-success-content text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Save more
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="card bg-base-100 shadow-xl border border-base-300 max-w-md mx-auto">
                <div className="card-body items-center text-center p-8 md:p-10">
                  <h2 className="text-xl font-bold text-base-content/70 mb-2">Pro Membership</h2>
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className="text-5xl md:text-6xl font-black text-base-content">
                      {currentPlan ? formatPrice(currentPlan.price, currentPlan.currency) : ''}
                    </span>
                    <span className="text-base-content/60 font-medium">
                      {currentPlan ? getPeriodLabel(currentPlan.interval) : ''}
                    </span>
                  </div>

                  <ul className="text-left space-y-3 w-full mb-8">
                    {[
                      'Reference solutions in C++, Java, JavaScript',
                      'Clean, editorial-quality code',
                      'Optimal time & space complexity analysis',
                      'Cancel anytime',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        <span className="text-base-content/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={checkoutLoading || !currentPlan}
                    className="btn btn-primary btn-lg w-full group"
                  >
                    {checkoutLoading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : isPro && userPlan === 'monthly' ? (
                      <>
                        Upgrade to Yearly
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : isPro ? (
                      <>You are Pro</>
                    ) : (
                      <>
                        Subscribe Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-base-content/50 mt-4">
                    Secure payment powered by Stripe. No free trial — you will be charged immediately.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
