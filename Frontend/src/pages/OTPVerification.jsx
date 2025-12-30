import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { verifyOTP, resendOTP, resetError, clearPendingUser } from "../authSlice";
import { ShieldCheck, ArrowLeft, RefreshCcw } from "lucide-react";

function OTPVerification() {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    pendingVerificationUserId,
    loading,
    resendLoading,
    error,
    isAuthenticated
  } = useSelector((state) => state.auth);

  // Security: Redirect to signup if no user is pending verification
  // Note: This now works on refresh because we initialize state from localStorage
  useEffect(() => {
    if (!pendingVerificationUserId) {
      navigate("/signup");
    }
  }, [pendingVerificationUserId, navigate]);

  // Navigate to home upon successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  // Automatic error reset after 4 seconds
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(resetError()), 4000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  // Cooldown timer logic for Resend OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    dispatch(
      verifyOTP({
        userId: pendingVerificationUserId,
        otp
      })
    );
  };

  const handleResend = () => {
    if (pendingVerificationUserId) {
      dispatch(resendOTP(pendingVerificationUserId));
      setTimer(60);
      setCanResend(false);
    }
  };

  const handleBackToSignup = () => {
    // Clears Redux state and LocalStorage to prevent redirect loops
    dispatch(clearPendingUser()); 
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      {error && (
        <div className="toast toast-top toast-center z-[110]">
          <div className="alert alert-error shadow-lg">
            <span className="font-semibold text-sm text-white">{error}</span>
          </div>
        </div>
      )}

      <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
        <div className="card-body p-8 items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2 uppercase italic">Verify Identity</h2>
          
          {/* Updated text as requested */}
          <p className="text-sm text-base-content/60 mb-8 font-medium">
            We've sent a 6-digit OTP to your email address. Please enter it below to verify your account.
          </p>

          <form onSubmit={submitHandler} className="w-full space-y-6">
            <div className="form-control">
              <input
                type="text"
                value={otp}
                maxLength={6}
                autoFocus
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="input input-bordered text-center text-3xl font-black tracking-[0.5em] h-16 bg-base-200/50 focus:border-primary transition-all"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              /* Big roll / loading spinner removed from className */
              className="btn btn-primary btn-block h-14 shadow-lg shadow-primary/20"
            >
              {/* Updated button text for verifying state */}
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            {canResend ? (
              <button 
                onClick={handleResend}
                disabled={resendLoading}
                className={`btn btn-ghost btn-sm text-primary flex items-center gap-2 hover:bg-primary/5 ${resendLoading ? 'loading' : ''}`}
              >
                <RefreshCcw className="w-4 h-4" /> 
                {resendLoading ? "Resending..." : "Resend OTP"}
              </button>
            ) : (
              <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest">
                Resend in <span className="text-primary">{timer}s</span>
              </p>
            )}

            <button 
              onClick={handleBackToSignup}
              className="btn btn-link btn-xs no-underline text-base-content/40 hover:text-base-content flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTPVerification;