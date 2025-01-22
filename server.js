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

const MAX_RETRIES = 10; // Maximum number of retries
const RETRY_DELAY = 2000; // Delay between retries in milliseconds
const MAX_TIMEOUT = 60000; // Maximum timeout (60 seconds)

async function retryAxios(requestFn) {
    const startTime = Date.now();
    let attempt = 0;

    while (Date.now() - startTime < MAX_TIMEOUT) {
        attempt++;
        try {
            return await requestFn();
        } catch (error) {
            console.error(Attempt ${attempt} failed:, error.response?.data || error.message);
            if (Date.now() - startTime >= MAX_TIMEOUT) {
                throw new Error('Maximum timeout reached while trying to generate the logo.');
            }
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
    }
    throw new Error('Failed to generate logo within the maximum timeout.');
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
                        Authorization: Bearer ${process.env.HUGGINGFACE_API_KEY},
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer', // Return as binary data
                }
            )
        );

        res.set('Content-Type', 'image/png');
        res.send(response.data); // Send the image blob
    } catch (error) {
        console.error('Error generating logo after retries:', error.message);
        res.status(500).json({ error: 'Failed to generate logo after multiple attempts. Please try again later.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(Server is running on http://0.0.0.0:${PORT});
});
