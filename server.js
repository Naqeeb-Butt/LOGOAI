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
        // Validate API key exists
        if (!process.env.HUGGINGFACE_API_KEY) {
            throw new Error('API key not configured');
        }

        const response = await retryAxios(() => 
            axios({
                method: 'post',
                url: 'https://api-inference.huggingface.co/models/strangerzonehf/Flux-Midjourney-Mix-LoRA',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                data: { inputs },
                responseType: 'arraybuffer',
                validateStatus: (status) => status === 200
            }),
            MAX_RETRIES
        );

        // Send the image response
        res.set('Content-Type', 'image/png');
        res.send(response.data);

    } catch (error) {
        console.error('API Error:', {
            message: error.message,
            response: error.response?.data?.toString(),
            status: error.response?.status
        });
        
        // Send more specific error messages
        const errorMessage = error.response?.status === 401 
            ? 'Authentication failed - please check API key'
            : 'Failed to generate logo';
            
        res.status(error.response?.status || 500).json({
            error: errorMessage,
            details: error.message
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
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Key exists:', !!process.env.HUGGINGFACE_API_KEY);
});
