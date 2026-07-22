import axios from "axios"

const baseURL = import.meta.env.VITE_BACKEND_URL;

if (!baseURL) {
    console.error('Missing VITE_BACKEND_URL environment variable');
}

const axiosClient =  axios.create({
    // baseURL: "http://localhost:3000",
    baseURL,
    //means our backend is hosted in this url
    withCredentials: true,      // means browser ko bata raha hu iske saath cookies ko attach kr dena
    headers: {
        'Content-Type': 'application/json'  // jo bhi data vej raha hu oo json format me h
    }
});

//axiosClient.post('/user/register', data);

export default axiosClient;