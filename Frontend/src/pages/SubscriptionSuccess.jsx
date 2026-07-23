import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { useDispatch } from 'react-redux';
import { Check, Loader2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { checkAuth } from '../authSlice';

function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setError('Missing session id.');
      return;
    }

    let attempts = 0;
    let pollTimer = null;

    const pollSubscription = async () => {
      try {
        const { data } = await axiosClient.get('/user/check');
        if (data.user?.subscription?.active) {
          setStatus('active');
          return;
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }

      attempts++;
      if (attempts < 5) {
        pollTimer = setTimeout(pollSubscription, 1000);
      } else {
        setStatus('pending');
      }
    };

    const fulfill = async () => {
      try {
        const { data } = await axiosClient.post('/api/payments/fulfill', {
          sessionId,
        });

        if (data.active) {
          setStatus('active');
          return;
        }
      } catch (err) {
        console.error('Fulfillment failed:', err);
      }

      // If immediate fulfillment didn't report active, poll a few times
      // in case the Stripe session is still being finalized.
      pollSubscription();
    };

    fulfill();

    return () => {
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [searchParams]);

  useEffect(() => {
    if (status === 'active') {
      dispatch(checkAuth());
    }
  }, [status, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card bg-base-100 shadow-xl border border-base-300 max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-base-content">Activating your Pro subscription...</h1>
            <p className="text-base-content/60 mt-2">This may take a few seconds.</p>
          </>
        )}

        {status === 'active' && (
          <>
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-success" strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-bold text-base-content mb-2">You're Pro!</h1>
            <p className="text-base-content/70 mb-6">
              Your subscription is active. You can now unlock every reference solution.
            </p>
            <div className="space-y-3">
              <Link to="/problems" className="btn btn-primary w-full">
                Start Solving
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/homePage" className="btn btn-outline btn-sm">
                  Go to Home
                </Link>
                <Link to="/MyProfile" className="btn btn-outline btn-sm">
                  My Profile
                </Link>
              </div>
            </div>
          </>
        )}

        {(status === 'pending' || status === 'error') && (
          <>
            <h1 className="text-2xl font-bold text-base-content mb-2">
              {status === 'error' ? 'Something went wrong' : 'Still activating...'}
            </h1>
            <p className="text-base-content/70 mb-6">
              {status === 'error'
                ? error || 'We could not verify your session.'
                : 'Your payment was received. It may take a moment for the subscription to activate. Refresh your profile to check status.'}
            </p>
            <div className="space-y-3">
              <Link to="/MyProfile" className="btn btn-primary w-full">
                Go to Profile
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/problems" className="btn btn-outline btn-sm">
                  Problems
                </Link>
                <Link to="/homePage" className="btn btn-outline btn-sm">
                  Home
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SubscriptionSuccess;
