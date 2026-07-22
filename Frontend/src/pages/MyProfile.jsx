import React, { useState } from "react";
import axiosClient from "../utils/axiosClient";
import { API_BASE_URL, getAvatarUrl } from "../utils/apiBase";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router";
import { setUser } from "../authSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Edit3, CheckCircle, TrendingUp, BookOpen, AlertCircle, Hash, Share2, Camera, X } from "lucide-react";

const loadStats = async () => {
  const [{ data: allProblems }, { data: solvedProblems }, { data: latest }] = await Promise.all([
    axiosClient.get("/problem/getAllProblem"),
    axiosClient.get("/problem/correctSubmission"),
    axiosClient.get("/problem/recentSolved")
  ]);

  const totalCount = { easy: 0, medium: 0, hard: 0 };
  allProblems.forEach(p => totalCount[p.difficulty.toLowerCase()]++);

  const solvedCount = { easy: 0, medium: 0, hard: 0 };
  solvedProblems.forEach(p => solvedCount[p.difficulty.toLowerCase()]++);

  return { recentSolved: latest, total: totalCount, solved: solvedCount };
};

const MyProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['profileStats'],
    queryFn: loadStats,
  });

  const recentSolved = stats?.recentSolved || [];
  const total = stats?.total || { easy: 0, medium: 0, hard: 0 };
  const solved = stats?.solved || { easy: 0, medium: 0, hard: 0 };

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    summary: user?.summary || "",
    age: user?.age || "",
  });

  const openEditModal = () => {
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      summary: user?.summary || "",
      age: user?.age || "",
    });
    setAvatarFile(null);
    setAvatarPreview(getAvatarUrl(user?.avatarUrl));
    setRemoveAvatar(false);
    setEditMode(true);
    setError("");
  };

  const closeEditModal = () => {
    setEditMode(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(false);
    setError("");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
    setError("");
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => {
      const formData = new FormData();
      formData.append("firstName", payload.firstName);
      formData.append("lastName", payload.lastName);
      formData.append("age", payload.age);
      formData.append("summary", payload.summary);
      if (payload.avatar) {
        formData.append("avatar", payload.avatar);
      }
      if (payload.removeAvatar) {
        formData.append("removeAvatar", "true");
      }
      return axiosClient.put("/user/updateProfile", formData);
    },
    onSuccess: ({ data }) => {
      dispatch(setUser(data.user));
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    },
    onError: (err) => {
      const backendError = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(backendError);
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: () => axiosClient.delete("/user/avatar"),
    onSuccess: ({ data }) => {
      dispatch(setUser(data.user));
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    },
    onError: (err) => {
      const backendError = err.response?.data?.message || "Failed to remove avatar.";
      setError(backendError);
    },
  });

  const handleUpdate = () => {
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

    setError("");
    updateProfileMutation.mutate({
      ...form,
      avatar: avatarFile,
      removeAvatar,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="loading loading-ring loading-lg text-primary"></span>
        <p className="text-sm font-medium animate-pulse">Loading your profile...</p>
      </div>
    );
  }

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
                <div className="avatar mb-4 relative group">
                  <div className={`w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden ${user?.avatarUrl ? '' : 'bg-primary text-primary-content flex items-center justify-center font-bold'}`}>
                    {user?.avatarUrl ? (
                      <img
                        src={getAvatarUrl(user.avatarUrl)}
                        alt={user?.lastName || "Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{user?.lastName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  {user?.avatarUrl && (
                    <button
                      onClick={() => deleteAvatarMutation.mutate()}
                      className="btn btn-circle btn-xs btn-error absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove avatar"
                      disabled={deleteAvatarMutation.isPending}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <h2 className="card-title text-2xl">{user?.lastName || "Coder"}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-primary font-bold">@{user?.firstName || "Coder"}</p>
                </div>
                <div className="divider my-2"></div>
                <p className="text-sm text-base-content/70 italic leading-relaxed">
                  {user?.summary || "No bio added yet. Tell the world about your coding journey!"}
                </p>
                <div className="card-actions w-full mt-6">
                  <button className="btn btn-outline btn-primary btn-block gap-2" onClick={openEditModal}>
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
          <p className="text-base-content/50 text-sm">
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

          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="avatar relative">
              <div className={`w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden ${avatarPreview || user?.avatarUrl ? '' : 'bg-primary text-primary-content flex items-center justify-center font-bold'}`}>
                {avatarPreview || user?.avatarUrl ? (
                  <img
                    src={avatarPreview || getAvatarUrl(user?.avatarUrl)}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{user?.lastName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <label className="btn btn-sm btn-outline btn-primary gap-1 cursor-pointer">
                <Camera size={14} /> Upload
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
              {(avatarPreview || user?.avatarUrl) && !removeAvatar && (
                <button
                  className="btn btn-sm btn-outline btn-error gap-1"
                  onClick={handleRemoveAvatar}
                >
                  <X size={14} /> Remove
                </button>
              )}
            </div>
          </div>

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
            <button className="btn btn-ghost border-base-300 font-bold uppercase text-xs" onClick={closeEditModal} disabled={updateProfileMutation.isPending}>Cancel</button>
            <button
              className={`btn btn-primary font-bold uppercase text-xs ${updateProfileMutation.isPending ? 'loading' : ''}`}
              onClick={handleUpdate}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DifficultyProgress = ({ label, color, s, t }) => {
  const percentage = t ? Math.round((s / t) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`radial-progress ${color} bg-base-200 border-4 border-base-200 shadow-inner`}
        style={{ "--value": percentage, "--size": "5rem", "--thickness": "6px" }}
        role="progressbar"
      >
        <span className="text-base-content font-bold text-sm">{percentage}%</span>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</p>
        <p className="text-sm font-mono">{s}/{t}</p>
      </div>
    </div>
  );
};

export default MyProfile;