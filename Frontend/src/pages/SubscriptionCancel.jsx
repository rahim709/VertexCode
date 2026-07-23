import { Link } from 'react-router';
import { XCircle } from 'lucide-react';

function SubscriptionCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card bg-base-100 shadow-xl border border-base-300 max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-600" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold text-base-content mb-2">Checkout cancelled</h1>
        <p className="text-base-content/70 mb-6">
          No worries — you can subscribe anytime to unlock Pro solutions.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/pricing" className="btn btn-primary w-full">
            Back to Pricing
          </Link>
          <Link to="/" className="btn btn-ghost w-full">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionCancel;
