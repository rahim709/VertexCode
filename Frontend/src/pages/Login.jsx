import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink, useSearchParams } from 'react-router';
import { loginUser, resetError } from "../authSlice";
import { useEffect, useState } from 'react';
import { Share2, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(callbackUrl);
    }
  }, [isAuthenticated, navigate, callbackUrl]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(resetError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      {error && (
        <div className="toast toast-top toast-center z-[100]">
          <div className="alert alert-error shadow-lg bg-red-50 border-red-200">
            <span className="font-semibold text-red-600">{typeof error === "string" ? error : "Login Failed. Try Again"}</span>
          </div>
        </div>
      )}

      <div className="card w-full max-w-md bg-base-100 shadow-2xl overflow-hidden">
        <div className="card-body p-8">
          
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Share2 className="w-10 h-10 text-primary rotate-90" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Vertex<span className="text-primary">Code</span>
            </h2>
            <p className="text-sm text-base-content/60 font-medium">Continue your ascent to the peak</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </span>
              </label>
              <input
                type="email"
                placeholder="john@gmail.com"
                className={`input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-all ${errors.emailId ? 'input-error' : ''}`} 
                {...register('emailId')}
              />
              {errors.emailId && (
                <span className="text-error text-xs mt-1 font-medium">{errors.emailId.message}</span>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 bg-base-200/50 focus:bg-base-100 transition-all ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-base-content/40 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-xs mt-1 font-medium">{errors.password.message}</span>
              )}
            </div>

            <div className="flex justify-end -mt-3">
              <NavLink to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot your password?
              </NavLink>
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary btn-block text-lg h-12 shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  "Signing In..."
                ) : (
                  <span className="flex items-center gap-2 uppercase font-bold tracking-wider">
                    Sign In <LogIn className="w-5 h-5" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="divider text-xs text-base-content/40 uppercase font-bold tracking-widest mt-8">New to Vertex?</div>
          
          <div className="text-center">
            <NavLink to="/signup" className="btn btn-outline btn-block border-base-300 hover:border-primary hover:bg-transparent hover:text-primary uppercase font-bold tracking-wider">
              Create Vertex Profile
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;