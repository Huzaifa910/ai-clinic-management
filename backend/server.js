import app from "./app.js";
import { dbConnect } from "./config/mongodb.js";
import dotenv from "dotenv"

dotenv.config() 
dbConnect()

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.listen(PORT, () => console.log(`Server is Running on PORT ${PORT}`));
