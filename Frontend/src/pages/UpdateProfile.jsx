import { useState } from "react";
import axiosClient from "../utils/axiosClient";
import { API_BASE_URL, getAvatarUrl } from "../utils/apiBase";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../authSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, X } from "lucide-react";

const UpdateProfile = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    age: user?.age || "",
    summary: user?.summary || "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(user?.avatarUrl));

  const updateMutation = useMutation({
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
      alert("Profile Updated!");
    },
    onError: (err) => {
      alert("Update Failed");
      console.log(err);
    },
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const [removeAvatar, setRemoveAvatar] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ ...form, avatar: avatarFile, removeAvatar });
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-base-200">
      <form className="bg-base-100 p-6 rounded-xl shadow-md w-96" onSubmit={handleSubmit}>

        <h2 className="text-xl font-semibold mb-4">Update Profile</h2>

        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="avatar">
            <div className={`w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden ${avatarPreview || user?.avatarUrl ? '' : 'bg-primary text-primary-content flex items-center justify-center font-bold'}`}>
              {avatarPreview || user?.avatarUrl ? (
                <img
                  src={avatarPreview || getAvatarUrl(user?.avatarUrl)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">{user?.lastName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase()}</span>
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
            {(avatarPreview || user?.avatarUrl) && (
              <button
                type="button"
                className="btn btn-sm btn-outline btn-error gap-1"
                onClick={handleRemoveAvatar}
              >
                <X size={14} /> Remove
              </button>
            )}
          </div>
        </div>

        <label>Username</label>
        <input
          type="text"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          className="input input-bordered w-full mb-3"
          required
        />

        <label>Full Name</label>
        <input
          type="text"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          className="input input-bordered w-full mb-3"
        />

        <label>Age</label>
        <input
          type="number"
          name="age"
          value={form.age}
          onChange={handleChange}
          className="input input-bordered w-full mb-3"
        />

        <label>Bio / Summary</label>
        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          className="textarea textarea-bordered w-full mb-3"
        />

        <button className={`btn btn-primary w-full ${updateMutation.isPending ? 'loading' : ''}`} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;
