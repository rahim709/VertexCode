import axios from "axios"

const axiosClient =  axios.create({
    baseURL: import.meta.env.BACKEND_URL, //means our backend is hosted in this url
    withCredentials: true,      // means browser ko bata raha hu iske saath cookies ko attach kr dena
    headers: {
        'Content-Type': 'application/json'  // jo bhi data vej raha hu oo json format me h
    }
});

//axiosClient.post('/user/register', data);

export default axiosClient;