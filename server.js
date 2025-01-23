require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 49153;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function retryAxios(requestFn, retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(Attempt ${attempt}...);
            return await requestFn();
        } catch (error) {
            console.error(Attempt ${attempt} failed:, error.response?.data || error.message);
            if (attempt === retries) {
                throw error;
            }
            console.log(Retrying in ${RETRY_DELAY * attempt}ms...);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
        }
    }
}

app.post('/generate-logo', async (req, res) => {
    const { inputs } = req.body;

    if (!inputs) {
        console.error('Missing required inputs.');
        return res.status(400).json({ error: 'Missing required input.' });
    }

    try {
        console.log('API Key:', process.env.HUGGINGFACE_API_KEY1);
        console.log('Inputs:', inputs);

        const response = await retryAxios(() =>
            axios.post(
                'https://api-inference.huggingface.co/models/strangerzonehf/Flux-Midjourney-Mix-LoRA',
                { inputs },
                {
                    headers: {
                        Authorization: Bearer ${process.env.HUGGINGFACE_API_KEY1},
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                    responseType: 'arraybuffer',
                }
            ),
            MAX_RETRIES
        );

        console.log('HuggingFace API response received.');
        res.set('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error) {
        console.error('Error generating logo:', error.response?.data || error.message);
        if (error.response?.headers['content-type']?.includes('text/html')) {
            console.error('HTML error response received:', error.response.data);
            return res.status(500).json({ error: 'Unexpected HTML response from HuggingFace.' });
        }
        res.status(500).json({
            error: `Failed to generate logo after multiple attempts. Details: ${
                error.response?.data?.error || error.message
            }`,
        });
    }
});

app.get('/check-env', (req, res) => {
    res.send(HUGGINGFACE_API_KEY1: ${process.env.HUGGINGFACE_API_KEY1});
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(Server is running on port ${PORT});
});
