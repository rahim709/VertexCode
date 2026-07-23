import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser, resetError } from '../authSlice';
import { Share2, Eye, EyeOff, Mail, Lock, UserCircle, UserPlus, Info } from 'lucide-react';

const signupSchema = z.object({
  firstName: z.string().min(3, "Username must be at least 3 characters"),
  emailId: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (val) =>
        /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        /[@$!%*?&]/.test(val),
      {
        message: "Password must include uppercase, lowercase, number, and special character",
      }
    ),
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, pendingVerificationEmail } = useSelector((state) => state.auth);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onChange"
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const passwordValue = watch("password", "");

  useEffect(() => {
    if (pendingVerificationEmail) {
      navigate("/verify-otp");
    }
  }, [pendingVerificationEmail, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(resetError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      {error && (
        <div className="toast toast-top toast-center z-100">
          <div className="alert alert-error shadow-lg bg-red-50 border-red-200">
            <span className="font-semibold text-red-600">{error}</span>
          </div>
        </div>
      )}

      <div className="card w-full max-w-md bg-base-100 shadow-2xl overflow-hidden">
        <div className="card-body p-8">
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Share2 className="w-10 h-10 text-primary rotate-90" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Join <span className="text-primary">VertexCode</span>
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> Username
                </span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full bg-base-200/50 ${errors.firstName ? 'input-error' : ''}`}
                {...register('firstName')}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </span>
              </label>
              <input
                type="email"
                className={`input input-bordered w-full bg-base-200/50 ${errors.emailId ? 'input-error' : ''}`}
                {...register('emailId')}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pr-10 bg-base-200/50 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="mt-3 p-3 bg-base-200/50 rounded-lg border border-base-300">
                <p className="text-[10px] uppercase font-bold tracking-widest text-base-content/40 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Password Requirements
                </p>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <li className={passwordValue.length >= 8 ? "text-success" : "text-base-content/50"}>
                    • Min. 8 characters
                  </li>
                  <li className={/[A-Z]/.test(passwordValue) ? "text-success" : "text-base-content/50"}>
                    • One Uppercase
                  </li>
                  <li className={/[a-z]/.test(passwordValue) ? "text-success" : "text-base-content/50"}>
                    • One Lowercase
                  </li>
                  <li className={/[0-9]/.test(passwordValue) ? "text-success" : "text-base-content/50"}>
                    • One Number
                  </li>
                  <li className={/[@$!%*?&]/.test(passwordValue) ? "text-success" : "text-base-content/50"}>
                    • Special Char (@$!%*?&)
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block h-12 shadow-lg shadow-primary/20 mt-4"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : <span className="flex items-center gap-2 uppercase font-bold tracking-wider">Create Profile <UserPlus className="w-4 h-4" /></span>}
            </button>
          </form>

          <div className="divider text-xs uppercase font-bold tracking-widest mt-8">Already a member?</div>
          <NavLink to="/login" className="btn btn-outline btn-block uppercase font-bold tracking-wider">Log In</NavLink>
        </div>
      </div>
    </div>
  );
}

export default Signup;