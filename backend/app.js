import express from "express";
import cors from "cors";
import appointmentRoute from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import authRoutes from "./routes/authRoute.js";
import patientRoutes from "./routes/patientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoute);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/admin" , adminRoutes)
app.use("/api/doctor" , doctorRoutes)

export default app;
