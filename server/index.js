import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vitalview',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB Connection
pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL:', err);
  });

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Helper to call Hugging Face API
async function callHuggingFace(imageBase64, prompt) {
  const HF_API_KEY = process.env.HF_API_KEY;
  const MODEL = "meta-llama/Llama-3.2-11B-Vision-Instruct";

  if (!HF_API_KEY) {
    throw new Error('HF_API_KEY is not set');
  }

  // Remove header if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  // For Llama 3.2 Vision, we might need to use the chat template or specific input format
  // But for standard Inference API, we can often send inputs directly.
  // Let's try the standard image-text-to-text format.

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${MODEL}`,
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: {
          image: base64Data,
          prompt: prompt
        },
        parameters: {
          max_new_tokens: 500,
          temperature: 0.1
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} ${error}`);
  }

  const result = await response.json();
  // Result format depends on the model. Usually it's an array of generated text.
  // For Llama Vision, it might be [{ generated_text: "..." }]
  return result;
}

// API Routes

// Extract Vitals (AI)
app.post('/api/extract-vitals', async (req, res) => {
  try {
    const { imageBase64, rois } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const roiDescriptions = rois.map(roi =>
      `${roi.label}: located at coordinates (${(roi.x * 100).toFixed(0)}%, ${(roi.y * 100).toFixed(0)}%)`
    ).join('\n');

    const prompt = `You are analyzing a medical patient monitor display. Extract the exact numerical values for the following vital signs from their specific screen locations:

${roiDescriptions}

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, no explanations or markdown.
- Extract ONLY the numeric values you can clearly see.
- For blood pressure readings (ABP, PAP), return as "systolic/diastolic/mean" format (e.g., "120/80/93").
- If a value is not clearly visible, use null.

Return JSON format:
{
  "HR": number or null,
  "Pulse": number or null,
  "SpO2": number or null,
  "ABP": "sys/dia/mean" or null,
  "PAP": "sys/dia/mean" or null,
  "EtCO2": number or null,
  "awRR": number or null
}`;

    // Note: The specific prompt format might need adjustment for Llama 3.2 Vision
    // But we'll send the raw prompt for now.

    const result = await callHuggingFace(imageBase64, prompt);

    // Parse result
    let generatedText = '';
    if (Array.isArray(result) && result[0]?.generated_text) {
      generatedText = result[0].generated_text;
    } else if (typeof result === 'string') {
      generatedText = result;
    } else if (result.generated_text) {
      generatedText = result.generated_text;
    } else {
      // Fallback or error
      console.error("Unexpected HF response:", result);
      throw new Error("Failed to parse HF response");
    }

    // Clean up JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;

    let vitalsData;
    try {
      vitalsData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      // Attempt to fix common JSON issues if needed, or return empty
      vitalsData = {};
    }

    res.json({ vitals: vitalsData });

  } catch (error) {
    console.error('Error in extract-vitals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save Vitals (DB)
app.post('/api/vitals', async (req, res) => {
  try {
    const vitals = req.body; // Array or single object
    const vitalsArray = Array.isArray(vitals) ? vitals : [vitals];

    if (vitalsArray.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    // Prepare values for bulk insert
    // Assuming table 'vitals' has columns: hr, pulse, spo2, abp, pap, etco2, awrr, source, created_at
    const values = vitalsArray.map(v => [
      v.hr, v.pulse, v.spo2, v.abp, v.pap, v.etco2, v.awrr, v.source, v.created_at || new Date()
    ]);

    const query = `
      INSERT INTO vitals (hr, pulse, spo2, abp, pap, etco2, awrr, source, created_at)
      VALUES ?
    `;

    const [result] = await pool.query(query, [values]);

    // Emit realtime event
    vitalsArray.forEach(v => {
      io.emit('vital-update', v);
    });

    res.json({ success: true, count: result.affectedRows });

  } catch (error) {
    console.error('Error saving vitals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Vitals History
app.get('/api/vitals', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const [rows] = await pool.query('SELECT * FROM vitals ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
