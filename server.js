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
    
    console.log('Request received:', {
        inputs,
        hasApiKey: !!process.env.HUGGINGFACE_API_KEY
    });

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
                    validateStatus: false
                }
            ),
            MAX_RETRIES
        );

        if (response.status !== 200) {
            throw new Error(`API Error: ${response.data.toString()}`);
        }

        res.set('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data?.toString(),
            stack: error.stack
        });
        
        res.status(500).json({
            error: 'Failed to generate logo',
            details: error.message,
            status: error.response?.status
        });
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
    console.log(`Server is running on port ${PORT}`);
});
