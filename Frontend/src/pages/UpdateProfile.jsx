import { useState } from "react";
import axiosClient from "../utils/axiosClient";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../authSlice";

const UpdateProfile = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    age: user?.age || "",
    summary: user?.summary || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosClient.put("/user/updateProfile", form);
      dispatch(setUser(data.user)); // update redux auth store
      alert("Profile Updated!");
    } catch (err) {
      alert("Update Failed");
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-base-200">
      <form className="bg-base-100 p-6 rounded-xl shadow-md w-96" onSubmit={handleSubmit}>
        
        <h2 className="text-xl font-semibold mb-4">Update Profile</h2>

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

        <button className="btn btn-primary w-full">Save Changes</button>
      </form>
    </div>
  );
};

export default UpdateProfile;
