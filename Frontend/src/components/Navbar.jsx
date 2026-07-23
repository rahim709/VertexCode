import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";
import { API_BASE_URL, getAvatarUrl } from "../utils/apiBase";
import { Share2, User, LogOut, LayoutDashboard, Trophy, ShieldCheck, Sparkles, Crown, Calendar } from "lucide-react";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isPro = user?.subscription?.active;
  const isYearlyPro = isPro && user?.subscription?.plan === 'yearly';
  const isMonthlyPro = isPro && user?.subscription?.plan === 'monthly';

  const handleLogout = async () => {
    await dispatch(logoutUser());
    localStorage.removeItem("currentPage");
    localStorage.removeItem("filters");
    localStorage.removeItem("search");
    navigate("/");
  };

  const handleBackgroundClick = (e) => {
    if (e.target.tagName === 'NAV' || e.target.classList.contains('navbar-bg-clickable')) {
      navigate("/");
    }
  };

  return (
    <nav 
      onClick={handleBackgroundClick}
      className="navbar bg-base-100 fixed top-0 left-0 right-0 shadow-sm border-b border-base-200 z-50 px-4 md:px-8 cursor-pointer navbar-bg-clickable"
    >
      <div className="flex-1">
        <NavLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit cursor-pointer">
          <Share2 className="w-7 h-7 text-primary rotate-90" />
          <span className="text-xl font-bold tracking-tighter">
            Vertex<span className="text-primary">Code</span>
          </span>
        </NavLink>
      </div>

      <div className="flex-none hidden md:block mr-4" onClick={(e) => e.stopPropagation()}>
        <ul className="menu menu-horizontal px-1 gap-2 items-center">
          <li>
            <NavLink to="/problems" className={({isActive}) => isActive ? "text-primary font-bold" : "font-medium"}>
              Problems
            </NavLink>
          </li>
          <li>
            <NavLink to="/leaderboard" className={({isActive}) => isActive ? "text-primary font-bold" : "font-medium"}>
              Leaderboard
            </NavLink>
          </li>
          {isYearlyPro ? (
            <li>
              <span className="badge badge-primary gap-1 px-3 py-2.5">
                <Crown className="w-3 h-3" /> Pro Member
              </span>
            </li>
          ) : isMonthlyPro ? (
            <li>
              <span className="badge badge-info gap-1 px-3 py-2.5">
                <Calendar className="w-3 h-3" /> Monthly Pro
              </span>
            </li>
          ) : (
            <li>
              <NavLink to="/pricing" className={({isActive}) => isActive ? "text-primary font-bold flex items-center gap-1 bg-primary/10 px-3 py-2 rounded-lg" : "font-medium flex items-center gap-1 text-warning px-3 py-2 rounded-lg"}>
                <Sparkles className="w-4 h-4" /> Upgrade
              </NavLink>
            </li>
          )}
        </ul>
      </div>

      <div className="flex-none gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar border border-base-300">
            <div className={`rounded-full w-10 flex items-center justify-center overflow-hidden ${user?.avatarUrl ? '' : 'bg-neutral text-neutral-content'}`}>
              {user?.avatarUrl ? (
                <img
                  src={getAvatarUrl(user.avatarUrl)}
                  alt={user?.lastName || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : user ? (
                <span className="text-sm uppercase">{user.lastName?.charAt(0) || user.firstName?.charAt(0)}</span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 mt-3 p-2 shadow-xl rounded-box w-52 border border-base-200">
            <li className="menu-title px-4 py-2 text-xs font-bold uppercase opacity-50">
              {user ? `Hi, ${user.lastName || user.firstName}` : "Account"}
              {isPro && (
                <span className="ml-2 badge badge-primary badge-xs gap-1">
                  <Crown className="w-3 h-3" /> PRO
                </span>
              )}
            </li>

            {user ? (
              <>
                <li>
                  <NavLink to="/MyProfile" className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> My Profile
                  </NavLink>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <NavLink to="/admin" className="flex items-center gap-2 text-warning">
                      <ShieldCheck className="w-4 h-4" /> Admin Panel
                    </NavLink>
                  </li>
                )}
                {isYearlyPro ? (
                  <li>
                    <span className="flex items-center gap-2 text-primary cursor-default">
                      <Crown className="w-4 h-4" /> Pro Member
                    </span>
                  </li>
                ) : isMonthlyPro ? (
                  <li>
                    <NavLink to="/pricing" className="flex items-center gap-2 text-info">
                      <Calendar className="w-4 h-4" /> Upgrade to Yearly
                    </NavLink>
                  </li>
                ) : (
                  <li>
                    <NavLink to="/pricing" className="flex items-center gap-2 text-warning">
                      <Sparkles className="w-4 h-4" /> Upgrade to Pro
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink to="/problems" className="md:hidden flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Problems
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/leaderboard" className="md:hidden flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Leaderboard
                  </NavLink>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><NavLink to="/login">Login</NavLink></li>
                <li><NavLink to="/signup">Sign Up</NavLink></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}