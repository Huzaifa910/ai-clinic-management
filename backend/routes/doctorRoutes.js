import express from "express";
import {
    getDoctorStats,
    getDoctorAppointments,
    getAppointmentDetail,
    updateAppointmentStatus,
    searchPatients,
    getPatientDetails
} from "../controllers/doctorController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const doctorRoutes = express.Router();

// Sabhi routes protected hain aur doctor ke liye specific
doctorRoutes.use(protect);
doctorRoutes.use(authorize("doctor"));

// Dashboard stats
doctorRoutes.get("/stats", getDoctorStats);

// Appointments routes
doctorRoutes.get("/appointments", getDoctorAppointments);
doctorRoutes.get("/appointments/:id", getAppointmentDetail);
doctorRoutes.patch("/appointments/:id/status", updateAppointmentStatus);

// Patient routes
doctorRoutes.get("/patients/search", searchPatients);
doctorRoutes.get("/patients/:id", getPatientDetails);

export default doctorRoutes;