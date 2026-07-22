const axios = require('axios');

const getLanguageById = (lang)=>{

    const language = {
        "c++":105,
        "java":91,
        "javascript":102
    }

    return language[lang.toLowerCase()];
}

// Pick the first available RapidAPI key from env
const getApiKey = () => {
    return process.env.X_RAPID_API_KEY ||
           process.env.X_RAPID_API_KEY_1 ||
           process.env.X_RAPID_API_KEY_2 ||
           process.env.X_RAPID_API_KEY_3 ||
           '';
};

const getHostKey = () => {
    return process.env.X_RAPID_HOST_KEY ||
           process.env.X_RAPID_HOST_KEY_1 ||
           process.env.X_RAPID_HOST_KEY_2 ||
           process.env.X_RAPID_HOST_KEY_3 ||
           'judge0-ce.p.rapidapi.com';
};


const submitBatch = async (submissions) => {
  try {
        const response = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions/batch",
        { submissions },
        {
            params: { base64_encoded: "false" },
            headers: {
            "x-rapidapi-key": getApiKey(),
            "x-rapidapi-host": getHostKey(),
            "Content-Type": "application/json"
            }
        }
        );

        return response.data;
    } catch (err) {
        const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Judge0 submission failed";

        throw new Error(msg);
    }
};


const submitToken = async (resultToken) => {
    const options = {
        method: "GET",
        url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
        params: {
        tokens: resultToken.join(","),
        base64_encoded: "false",
        fields: "*"
        },
        headers: {
        "x-rapidapi-key": getApiKey(),
        "x-rapidapi-host": getHostKey()
        }
    };

    while (true) {
        try {
        const response = await axios.request(options);
        const submissions = response.data.submissions;

        const done = submissions.every(r => r.status_id > 2);
        if (done) return submissions;

        await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
        const msg =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Judge0 execution failed";

        throw new Error(msg);
        }
    }
};


module.exports = {getLanguageById, submitBatch, submitToken};


// Latest ID for each language
// C++       → 105
// JavaScript→ 102
// Java      → 91