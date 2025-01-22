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

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // in milliseconds

async function retryAxios(requestFn, retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.response?.data || error.message);
            if (attempt === retries) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt)); // Exponential backoff
        }
    }
}

app.post('/generate-logo', async (req, res) => {
    const { inputs } = req.body;

    if (!inputs) {
        return res.status(400).json({ error: 'Missing required input.' });
    }

    try {
        const response = await retryAxios(() =>
            axios.post(
                'https://api-inference.huggingface.co/models/strangerzonehf/Flux-Midjourney-Mix-LoRA',
                { inputs },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer', // Return as binary data
                }
            ),
            MAX_RETRIES
        );

        res.set('Content-Type', 'image/png');
        res.send(response.data); // Directly send the image blob
    } catch (error) {
        console.error('Error generating logo after retries:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate logo after multiple attempts. Please try again later.' });
    }
});

app.listen(49153, '0.0.0.0', () => { 
    console.log('Server is running on port 49153');
});
