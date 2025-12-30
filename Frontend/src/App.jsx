import { Routes, Route, Navigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import { checkAuth } from "./authSlice";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyOTP from "./pages/OTPVerification";

import Problems from "./pages/Problems";
import ProblemPage from "./pages/ProblemPage";
import MyProfile from "./pages/MyProfile";
import UpdateProfile from "./pages/UpdateProfile";
import Leaderboard from "./pages/Leaderboard";

import Admin from "./pages/Admin";
import AdminPanel from "./components/AdminPanel";
import AdminDelete from "./components/AdminDelete";

import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  const {
    isAuthenticated,
    user,
    authChecked,
    pendingVerificationUserId,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Logic: List of valid routes to determine Navbar visibility
  const validPaths = [
    "/", "/homePage", "/signup", "/login", "/verify-otp", 
    "/problems", "/MyProfile", "/update-profile", "/leaderboard", "/admin", "/admin/create", "/admin/delete"
  ];
  
  // Logic: Identifies if the current URL is invalid or not a dynamic problem page
  const is404 = !validPaths.includes(location.pathname) && !location.pathname.startsWith("/problem/");

  if (!authChecked) { 
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <>
      {/* Logic: Navbar is hidden if is404 is true */}
      {isAuthenticated && !is404 && <Navbar />}

      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/homePage" /> : <LandingPage />} />
        <Route path="/homePage" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/verify-otp" element={pendingVerificationUserId ? <VerifyOTP /> : <Navigate to="/signup" />} />

        <Route path="/problems" element={isAuthenticated ? <Problems /> : <Navigate to="/login" />} />
        <Route path="/problem/:problemId" element={isAuthenticated ? <ProblemPage /> : <Navigate to="/login" />} />
        <Route path="/MyProfile" element={isAuthenticated ? <MyProfile /> : <Navigate to="/login" />} />
        <Route path="/update-profile" element={isAuthenticated ? <UpdateProfile /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/" />} />

        <Route path="/admin" element={isAuthenticated && user?.role === "admin" ? <Admin /> : <Navigate to="/" />} />
        <Route path="/admin/create" element={isAuthenticated && user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
        <Route path="/admin/delete" element={isAuthenticated && user?.role === "admin" ? <AdminDelete /> : <Navigate to="/" />} />

        {/* --- CATCH-ALL 404 ERROR ROUTE --- */}
        {/* Logic: Only shows the error message; Return button has been removed */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 text-center">
              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <h1 className="text-9xl font-black text-primary/10 select-none">404</h1>
                  <div className="mt-[-3rem]">
                    <h2 className="text-4xl font-bold tracking-tight uppercase italic text-base-content">
                      Page Not Found
                    </h2>
                    <p className="mt-4 text-base-content/60 font-medium italic">
                      Error: The requested route is unavailable or does not exist in the VertexCode directory.
                    </p>
                  </div>
                </div>
              
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;