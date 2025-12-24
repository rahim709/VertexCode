import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser, resetError } from '../authSlice';
import { Share2, Eye, EyeOff, Mail, Lock, UserCircle } from 'lucide-react';

const signupSchema = z.object({
  firstName: z.string().min(3, "Username must be at least 3 characters"),
  emailId: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth); 

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(resetError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      {/* Toast Notification */}
      {error && (
        <div className="toast toast-top toast-center md:toast-end z-100">
          <div className="alert alert-error shadow-lg">
            <span className="font-semibold">
              {typeof error === "string" ? error : "Account creation failed. Try again."}
            </span>
          </div>
        </div>
      )}

      <div className="card w-full max-w-md bg-base-100 shadow-2xl overflow-hidden">
        <div className="card-body p-8">
          
          {/* Brand Identity */}
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Share2 className="w-10 h-10 text-primary rotate-90" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Join <span className="text-primary">VertexCode</span>
            </h2>
            <p className="text-sm text-base-content/60 font-medium">Start your journey to algorithmic mastery</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> Username
                </span>
              </label>
              <input
                type="text"
                placeholder="coding_ninja"
                className={`input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-all ${errors.firstName ? 'input-error' : ''}`} 
                {...register('firstName')}
              />
              {errors.firstName && (
                <span className="text-error text-xs mt-1 font-medium">{errors.firstName.message}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </span>
              </label>
              <input
                type="email"
                placeholder="dev@vertexcode.com"
                className={`input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-all ${errors.emailId ? 'input-error' : ''}`}
                {...register('emailId')}
              />
              {errors.emailId && (
                <span className="text-error text-xs mt-1 font-medium">{errors.emailId.message}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-control">
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-xs mt-1 font-medium">{errors.password.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-control mt-8"> 
              <button
                type="submit"
                className={`btn btn-primary btn-block text-lg h-12 shadow-lg shadow-primary/20 ${loading ? 'loading btn-disabled' : ''}`}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Profile'}
              </button>
            </div>
          </form>

          {/* Login Redirect */}
          <div className="divider text-xs text-base-content/40 uppercase font-bold tracking-widest mt-8">Already a member?</div>
          
          <div className="text-center">
            <NavLink to="/login" className="btn btn-outline btn-block border-base-300 hover:border-primary hover:bg-transparent hover:text-primary">
              Log In to Vertex
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;