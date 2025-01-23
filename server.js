require('dotenv').config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 49153;

// Hugging Face API URL and headers
const API_URL = "https://api-inference.huggingface.co/models/strangerzonehf/Flux-Midjourney-Mix-LoRA";
const headers = {
    "Authorization": Bearer ${process.env.HUGGINGFACE_API_KEY1}
};

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Endpoint to generate logo
app.get("/generate-logo", async (req, res) => {
    const userPrompt = req.query.prompt;

    if (!userPrompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    const retryDelay = 3000; // Retry every 3 seconds
    const maxRetries = 10; // Retry up to 10 times
    let retries = 0;

    try {
        while (retries < maxRetries) {
            try {
                // Make the API request to Hugging Face
                const response = await axios.post(
                    API_URL,
                    { inputs: userPrompt },
                    {
                        headers: headers,
                        responseType: 'arraybuffer' // Return as binary data
                    }
                );

                // If the response contains image data
                if (response.headers["content-type"].startsWith("image")) {
                    // Ensure public directory exists
                    const publicDir = path.join(__dirname, "public");
                    if (!fs.existsSync(publicDir)) {
                        fs.mkdirSync(publicDir);
                    }

                    // Save the image to the file system
                    const imagePath = path.join(publicDir, "generated_logo.png");
                    fs.writeFileSync(imagePath, response.data);

                    // Send the image back to the client
                    return res.sendFile(imagePath);
                } else if (response.status === 503) {
                    // If the service is unavailable, wait and retry
                    console.log(Retry attempt ${retries + 1} of ${maxRetries}...);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    return res.status(500).json({ error: "Failed to generate logo, invalid response" });
                }
            } catch (error) {
                if (error.response && error.response.status === 503) {
                    console.log(Retry attempt ${retries + 1} of ${maxRetries}...);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    throw error;
                }
            }
        }

        // If max retries reached, return error
        return res.status(503).json({ error: "Service is still unavailable after multiple attempts" });

    } catch (error) {
        console.error("Error generating logo:", error.message);
        return res.status(500).json({ 
            error: "Error generating logo",
            details: error.message 
        });
    }
});


// Catch-all route for serving the frontend
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => { 
  console.log(Server is running on port ${PORT});
});
