const axios = require('axios');

const getLanguageById = (lang)=>{

    const language = {
        "c++":105,
        "java":91,
        "javascript":102
    }

    return language[lang.toLowerCase()];
}



const submitBatch = async (submissions)=>{
    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            base64_encoded: 'false'
        },
        headers: {
            'x-rapidapi-key': process.env.X_RAPID_API_KEY,
            'x-rapidapi-host': process.env.X_RAPID_HOST_KEY,
            'Content-Type': 'application/json'
        },
        data: {
            submissions
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    return await fetchData();

}

//waiting function
const waiting = async(timer)=>{

    setTimeout(()=>{
        console.log("Waiting 2 sec");
    },timer);
}

const submitToken = async(resultToken)=>{

    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultToken.join(","),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.X_RAPID_API_KEY,
            'x-rapidapi-host': process.env.X_RAPID_HOST_KEY, 
        }
        };

        async function fetchData() {
            try {
                const response = await axios.request(options);
                return response.data;
            } catch (error) {
                console.error(error);
            }
        }

        while(true){

            const result = await fetchData();

            const IsResultObtained = result.submissions.every((r)=> r.status_id > 2);

            if(IsResultObtained)
                return result.submissions;

            waiting(2000);
        }

}


module.exports = {getLanguageById, submitBatch, submitToken};


// Latest ID for each language
// C++       → 105
// JavaScript→ 102
// Java      → 91