import React, { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router";
import { setUser } from "../authSlice";
import { User, Edit3, CheckCircle, TrendingUp, BookOpen, AlertCircle, Hash, Share2 } from "lucide-react";

const MyProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  const [recentSolved, setRecentSolved] = useState([]);
  const [total, setTotal] = useState({ easy: 0, medium: 0, hard: 0 });
  const [solved, setSolved] = useState({ easy: 0, medium: 0, hard: 0 });

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    summary: user?.summary || "",
    age: user?.age || "",
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [{ data: allProblems }, { data: solvedProblems }, { data: latest }] = await Promise.all([
        axiosClient.get("/problem/getAllProblem"),
        axiosClient.get("/problem/correctSubmission"),
        axiosClient.get("/problem/recentSolved")
      ]);

      const totalCount = { easy: 0, medium: 0, hard: 0 };
      allProblems.forEach(p => totalCount[p.difficulty.toLowerCase()]++);

      const solvedCount = { easy: 0, medium: 0, hard: 0 };
      solvedProblems.forEach(p => solvedCount[p.difficulty.toLowerCase()]++);

      setRecentSolved(latest);
      setTotal(totalCount);
      setSolved(solvedCount);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const percentage = (s, t) => (t ? Math.round((s / t) * 100) : 0);

  const handleUpdate = async () => {
    if (form.firstName.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (form.lastName.trim().length < 3) {
      setError("Name must be at least 3 characters long.");
      return;
    }
    if (!form.age || form.age < 10 || form.age > 100) {
      setError("Please enter a valid age between 10 and 100.");
      return;
    }
    if (form.summary.trim().length < 3) {
      setError("Bio must be at least 3 characters long.");
      return;
    }

    try {
      setError(""); 
      const { data } = await axiosClient.put("/user/updateProfile", form);
      dispatch(setUser(data.user));
      setEditMode(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      const backendError = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(backendError);
    }
  };

  const closeEditModal = () => {
    setEditMode(false);
    setError(""); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="loading loading-ring loading-lg text-primary"></span>
        <p className="text-sm font-medium animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  const DifficultyProgress = ({ label, color, s, t }) => (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`radial-progress ${color} bg-base-200 border-4 border-base-200 shadow-inner`} 
        style={{ "--value": percentage(s, t), "--size": "5rem", "--thickness": "6px" }}
        role="progressbar"
      >
        <span className="text-base-content font-bold text-sm">{percentage(s, t)}%</span>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</p>
        <p className="text-sm font-mono">{s}/{t}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200/50 flex flex-col">
      {/* Content wrapper with flex-grow to push footer down */}
      <div className="grow pb-20 pt-28 px-4">
        <div className={`toast toast-top toast-center z-100 transition-all duration-300 ${showToast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="alert alert-success shadow-lg text-white font-bold">
            <CheckCircle size={20} />
            <span>Profile successfully updated!</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body items-center text-center">
                <div className="avatar placeholder mb-4">
                  <div className="bg-primary text-primary-content rounded-full w-24 ring ring-primary ring-offset-base-100 ring-offset-2 flex items-center justify-center font-bold">
                    <span className="text-4xl">{user?.firstName?.[0]?.toUpperCase()}</span>
                  </div>
                </div>
                <h2 className="card-title text-2xl">{user?.lastName || "Developer"}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-primary font-bold">@{user?.firstName}</p>
                </div>
                <div className="divider my-2"></div>
                <p className="text-sm text-base-content/70 italic leading-relaxed">
                  {user?.summary || "No bio added yet. Tell the world about your coding journey!"}
                </p>
                <div className="card-actions w-full mt-6">
                  <button className="btn btn-outline btn-primary btn-block gap-2" onClick={() => setEditMode(true)}>
                    <Edit3 size={16} /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-primary" />
                  <h3 className="text-xl font-bold">Preparation Progress</h3>
                </div>
                <div className="flex flex-wrap justify-around gap-6">
                  <DifficultyProgress label="Easy" color="text-success" s={solved.easy} t={total.easy} />
                  <DifficultyProgress label="Medium" color="text-warning" s={solved.medium} t={total.medium} />
                  <DifficultyProgress label="Hard" color="text-error" s={solved.hard} t={total.hard} />
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="text-primary" />
                  <h3 className="text-xl font-bold">Recent Submissions</h3>
                </div>
                <div className="overflow-x-auto">
                  {recentSolved.length === 0 ? (
                    <div className="py-10 text-center opacity-50 font-medium">
                      <p>No problems solved yet. Time to start coding!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recentSolved.map((p) => (
                        <NavLink to={`/problem/${p._id}`} key={p.submissionId} className="flex items-center p-4 rounded-xl border border-base-200 hover:border-primary hover:bg-primary/5 transition-all group">
                          <div className="bg-success/10 text-success p-2 rounded-lg mr-4">
                            <CheckCircle size={18} />
                          </div>
                          <span className="font-bold group-hover:text-primary transition-colors line-clamp-1 italic uppercase text-xs tracking-tight">{p.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Integrated directly to avoid gap */}
      <footer className="bg-base-100 py-10 border-t border-base-300 w-full mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-primary rotate-90" />
            <span className="font-bold text-lg tracking-tighter">Vertex<span className="text-primary">Code</span></span>
          </div>
          <p className="text-base-content/50 text-[10px] font-black uppercase tracking-[0.2em]">
            Copyright © 2025 VertexCode
          </p>
        </div>
      </footer>

      {/* Modal remains separate outside the flex-grow container */}
      <input type="checkbox" checked={editMode} readOnly className="modal-toggle" />
      <div className="modal modal-bottom sm:modal-middle backdrop-blur-sm">
        <div className="modal-box border border-base-300 shadow-2xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <User size={20} className="text-primary" /> Update Profile Information
          </h3>

          {error && (
            <div className="alert alert-error shadow-sm mb-4 py-3 text-white">
              <AlertCircle size={20} />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}
          
          <div className="form-control gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-[10px] font-black uppercase opacity-60">Username</label>
                <input
                  type="text"
                  className={`input input-bordered w-full focus:input-primary ${error && form.firstName.trim().length < 3 ? 'border-error' : ''}`}
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>

              <div>
                <label className="label text-[10px] font-black uppercase opacity-60">Name</label>
                <input
                  type="text"
                  className={`input input-bordered w-full focus:input-primary ${error && form.lastName.trim().length < 3 ? 'border-error' : ''}`}
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label text-[10px] font-black uppercase opacity-60">Age</label>
              <input
                type="number"
                placeholder="Enter your age"
                className={`input input-bordered w-full focus:input-primary ${error && (!form.age || form.age < 10) ? 'border-error' : ''}`}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>

            <div>
              <label className="label text-[10px] font-black uppercase opacity-60">Bio</label>
              <textarea
                className={`textarea textarea-bordered w-full h-24 focus:textarea-primary ${error && form.summary.trim().length < 3 ? 'border-error' : ''}`}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-action grid grid-cols-2 gap-3">
            <button className="btn btn-ghost border-base-300 font-bold uppercase text-xs" onClick={closeEditModal}>Cancel</button>
            <button className="btn btn-primary font-bold uppercase text-xs" onClick={handleUpdate}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;