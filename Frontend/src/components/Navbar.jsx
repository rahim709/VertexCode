import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";
import { API_BASE_URL, getAvatarUrl } from "../utils/apiBase";
import { Share2, User, LogOut, LayoutDashboard, Trophy, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    localStorage.removeItem("currentPage");
    localStorage.removeItem("filters");
    localStorage.removeItem("search");
  };

  // Function to handle clicking on the navbar background
  const handleBackgroundClick = (e) => {
    // Only navigate if the user clicks the actual bar, not a button or dropdown
    if (e.target.tagName === 'NAV' || e.target.classList.contains('navbar-bg-clickable')) {
      navigate("/");
    }
  };

  return (
    <nav 
      onClick={handleBackgroundClick}
      className="navbar bg-base-100 fixed top-0 left-0 right-0 shadow-sm border-b border-base-200 z-50 px-4 md:px-8 cursor-pointer navbar-bg-clickable"
    >
      {/* Brand Logo - Clicking this goes home */}
      <div className="flex-1">
        <NavLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit cursor-pointer">
          <Share2 className="w-7 h-7 text-primary rotate-90" />
          <span className="text-xl font-bold tracking-tighter">
            Vertex<span className="text-primary">Code</span>
          </span>
        </NavLink>
      </div>

      {/* Center Navigation - StopPropagation prevents clicking background through these items */}
      <div className="flex-none hidden md:block mr-4" onClick={(e) => e.stopPropagation()}>
        <ul className="menu menu-horizontal px-1 gap-2">
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
        </ul>
      </div>

      {/* User Actions - StopPropagation prevents clicking background through the dropdown */}
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
                  <button onClick={handleLogout} className="flex items-center gap-2 text-error">
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