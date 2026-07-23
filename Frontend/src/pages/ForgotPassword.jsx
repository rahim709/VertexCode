import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router";
import { requestPasswordReset, resetPassword, resetError } from "../authSlice";
import { KeyRound, ArrowLeft, RefreshCcw, Mail, Lock, Eye, EyeOff, ShieldCheck, Info } from "lucide-react";

const passwordRequirements = [
  { label: "Min. 8 characters", test: (val) => val.length >= 8 },
  { label: "One uppercase letter", test: (val) => /[A-Z]/.test(val) },
  { label: "One lowercase letter", test: (val) => /[a-z]/.test(val) },
  { label: "One number", test: (val) => /[0-9]/.test(val) },
  { label: "One special character (@$!%*?&)", test: (val) => /[@$!%*?&]/.test(val) },
];

const isPasswordValid = (password) =>
  passwordRequirements.every((req) => req.test(password));

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("email");
  const [timer, setTimer] = useState(60);
  const [successMessage, setSuccessMessage] = useState("");
  const canResend = timer === 0;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(resetError()), 4000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestReset = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    dispatch(requestPasswordReset(email)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setStep("verify");
        setTimer(60);
        setSuccessMessage("");
      }
    });
  };

  const handleResend = () => {
    dispatch(requestPasswordReset(email)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setTimer(60);
      }
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (otp.length !== 6 || !isPasswordValid(newPassword)) return;

    dispatch(resetPassword({ email, otp, newPassword })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setSuccessMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    });
  };

  const handleUpdateEmail = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    setTimer(60);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      {error && (
        <div className="toast toast-top toast-center z-[110]">
          <div className="alert alert-error shadow-lg bg-red-50 border-red-200">
            <span className="font-semibold text-sm text-red-600">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="toast toast-top toast-center z-[110]">
          <div className="alert alert-success shadow-lg">
            <span className="font-semibold text-sm text-white">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
        <div className="card-body p-8 items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            {step === "email" ? (
              <KeyRound className="w-12 h-12 text-primary" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-primary" />
            )}
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2 uppercase italic">
            {step === "email" ? "Forgot Password" : "Verify Identity"}
          </h2>

          {step === "email" ? (
            <>
              <p className="text-sm text-base-content/60 mb-8 font-medium">
                Enter your email address and we'll send you a code to reset your password.
              </p>

              <form onSubmit={handleRequestReset} className="w-full space-y-6">
                <div className="form-control">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@gmail.com"
                      className="input input-bordered w-full pl-10 bg-base-200/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn btn-primary btn-block h-14 shadow-lg shadow-primary/20"
                >
                  {loading ? "Sending Code..." : "Send Reset Code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm text-base-content/60 mb-6 font-medium">
                We've sent a 6-digit code to <span className="font-bold text-base-content">{email}</span>.
                Enter it below to reset your password.
              </p>

              <form onSubmit={handleResetPassword} className="w-full space-y-5">
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

                <div className="form-control">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="input input-bordered w-full pl-10 pr-10 bg-base-200/50 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-base-content/40 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="w-full text-left bg-base-200/50 rounded-lg p-3 border border-base-300/50">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
                    <Info className="w-4 h-4" /> Password Requirements
                  </div>
                  <ul className="space-y-1 text-xs">
                    {passwordRequirements.map((req, index) => (
                      <li
                        key={index}
                        className={req.test(newPassword) ? "text-success" : "text-base-content/50"}
                      >
                        {req.test(newPassword) ? "✓" : "•"} {req.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || !isPasswordValid(newPassword)}
                  className="btn btn-primary btn-block h-14 shadow-lg shadow-primary/20"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-4 w-full">
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={handleUpdateEmail}
                    className="btn btn-ghost btn-xs no-underline text-base-content/40 hover:text-base-content flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Update email
                  </button>

                  {canResend ? (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className={`btn btn-ghost btn-xs text-primary flex items-center gap-1 hover:bg-primary/5 ${loading ? 'loading' : ''}`}
                    >
                      <RefreshCcw className="w-3 h-3" />
                      {loading ? "Resending..." : "Resend Code"}
                    </button>
                  ) : (
                    <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest">
                      Resend in <span className="text-primary">{timer}s</span>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mt-6">
            <NavLink
              to="/login"
              className="btn btn-link btn-xs no-underline text-base-content/40 hover:text-base-content flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
