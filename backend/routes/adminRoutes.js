import express from "express";
import {
    getDashboardStats,
    getDoctorPerformance,
    getMonthlyTrends,
    getCommonDiagnosis,
    getRevenueStats,
    getAllPatients,
    getAllDoctors,
    getAllReceptionists,
    deleteUser,
    deletePatient,
    deleteReceptionist
} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const adminRoutes = express.Router();

// Sabhi routes protected hain aur admin ke liye specific
adminRoutes.use(protect);
adminRoutes.use(authorize("admin"));

// Dashboard routes
adminRoutes.get("/stats", getDashboardStats);
adminRoutes.get("/doctor-performance", getDoctorPerformance);
adminRoutes.get("/charts/monthly", getMonthlyTrends);
adminRoutes.get("/charts/diagnosis", getCommonDiagnosis);
adminRoutes.get("/revenue", getRevenueStats);

adminRoutes.get("/patients" , getAllPatients)
adminRoutes.get("/doctors" , getAllDoctors)
adminRoutes.get("/receptionists", getAllReceptionists)

adminRoutes.delete("/users/:id" , deleteUser)
adminRoutes.delete("/patients/:id" , deletePatient)
adminRoutes.delete("/receptionists/:id" , deleteReceptionist)

export default adminRoutes;