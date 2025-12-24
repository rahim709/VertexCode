import { Routes, Route, Navigate } from "react-router";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Problems from "./pages/Problems";
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage";
import Admin from "./pages/Admin";
import AdminDelete from "./components/AdminDelete";
import Navbar from "./components/Navbar";
import MyProfile from "./pages/MyProfile";
import UpdateProfile from "./pages/UpdateProfile"; // adjust path
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Leaderboard from "./pages/Leaderboard";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user, authChecked } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Navbar />}

      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/homePage" /> : <LandingPage></LandingPage>}/>
        <Route path="/homePage" element={isAuthenticated ? <HomePage></HomePage> : <Navigate to="/login" />}/>
        <Route path="/problems" element={isAuthenticated ? <Problems /> : <Navigate to="/login" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />

        <Route path="/admin" element={isAuthenticated && user?.role === "admin" ? <Admin /> : <Navigate to="/" />} />
        <Route path="/admin/create" element={isAuthenticated && user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
        <Route path="/admin/delete" element={isAuthenticated && user?.role === "admin" ? <AdminDelete /> : <Navigate to="/" />} />

        <Route path="/MyProfile" element={isAuthenticated ? <MyProfile /> : <Navigate to="/login" />} />

        <Route path="/problem/:problemId" element={isAuthenticated ? <ProblemPage /> : <Navigate to="/login" />} />
        <Route path="/update-profile" element={isAuthenticated ? <UpdateProfile /> : <Navigate to="/login" /> } />
        {/* <Route path="/landingPage" element={<LandingPage></LandingPage>} /> */}
        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard></Leaderboard> : <Navigate to="/"></Navigate>} />
      </Routes>
    </>
  );
}

export default App;
