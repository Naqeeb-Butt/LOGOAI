require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 49153;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const MAX_RETRIES = 10;
const RETRY_DELAY = 2000; // in milliseconds

async function retryAxios(requestFn, retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(Attempt ${attempt} to call Hugging Face API...);
            const response = await requestFn();

            // Validate the response type
            if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
                throw new Error('Unexpected HTML response from the API.');
            }

            return response;
        } catch (error) {
            console.error(Attempt ${attempt} failed:, error.response?.data || error.message);

            // Log detailed error for debugging
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
                console.error('Response data:', error.response.data.toString());
            } else {
                console.error('Error message:', error.message);
            }

            if (attempt === retries) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt)); // Exponential backoff
        }
    }
}

const axiosInstance = axios.create({
    timeout: 60000, // 60 seconds timeout
});

app.post('/generate-logo', async (req, res) => {
    const { inputs } = req.body;

    if (!inputs) {
        console.error('Error: Missing required input.');
        return res.status(400).json({ error: 'Missing required input.' });
    }

    console.log('Received inputs:', inputs);

    try {
        const response = await retryAxios(() =>
            axiosInstance.post(
                'https://api-inference.huggingface.co/models/strangerzonehf/Flux-Midjourney-Mix-LoRA',
                { inputs },
                {
                    headers: {
                        Authorization: Bearer ${process.env.HUGGINGFACE_API_KEY},
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer',
                }
            ),
            MAX_RETRIES
        );

        console.log('Successfully generated logo.');
        res.set('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error) {
        console.error('Error generating logo after retries:', error.message);
        res.status(500).json({ error: 'Failed to generate logo after multiple attempts. Please try again later.' });
    }
});

app.listen(49153, '0.0.0.0', () => { 
    console.log('Server is running on port 49153');
});
