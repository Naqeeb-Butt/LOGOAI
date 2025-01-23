require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 49153;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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

    console.log('Received request:', {
        inputs,
        hasApiKey: !!process.env.HUGGINGFACE_API_KEY,
    });

    if (!process.env.HUGGINGFACE_API_KEY) {
        console.error('Error: API Key is missing or undefined');
        return res.status(500).json({
            error: 'Server configuration issue: API Key is missing',
        });
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
                    responseType: 'arraybuffer',
                }
            ),
            MAX_RETRIES
        );

        if (response.status !== 200) {
            console.error('Unexpected API Response:', response.status, response.data.toString());
            throw new Error(`API Error: ${response.statusText}`);
        }

        console.log('Successfully generated logo.');
        res.set('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data?.toString(),
        });

        if (error.response?.status === 401) {
            res.status(401).json({
                error: 'Unauthorized: Check your API key',
            });
        } else {
            res.status(500).json({
                error: 'Failed to generate logo',
                details: error.message,
            });
        }
    }
});


app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Key exists:', !!process.env.HUGGINGFACE_API_KEY);
});
