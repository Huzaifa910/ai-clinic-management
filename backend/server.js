import app from "./app.js";
import { dbConnect } from "./config/mongodb.js";
import dotenv from "dotenv"

dotenv.config() 
dbConnect()

const PORT = process.env.PORT || 5000;

// ✅ SIMPLE HEALTHCHECK ROUTE - Sab se upar rakho
app.get('/health', (req, res) => {
  console.log('Health check hit!'); // Debug log
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// ✅ ROOT ROUTE - Railway ke liye
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'AI Clinic Management API',
    status: 'running'
  });
});

app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
  console.log(`Health check available at /health`);
});