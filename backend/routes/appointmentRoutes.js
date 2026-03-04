import express from "express";
import {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    cancelAppointment,
    getDoctorSchedule,
    getTodayAppointments
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

    const appointmentRoute = express.Router();

// Sabhi routes protected hain
appointmentRoute.use(protect);

// Special routes pehle
appointmentRoute.get("/today", getTodayAppointments);
appointmentRoute.get("/doctor/schedule", authorize("doctor", "receptionist", "admin"), getDoctorSchedule);

// CRUD routes
appointmentRoute.route("/")
    .get(getAllAppointments)
    .post(
        authorize("receptionist", "doctor", "admin"), // Patient bhi add karna hai?
        createAppointment
    );

appointmentRoute.route("/:id")
    .get(getAppointmentById)
    .put(
        authorize("receptionist", "doctor", "admin"),
        updateAppointment
    );

// Cancel appointment
appointmentRoute.patch("/:id/cancel", cancelAppointment);

export default appointmentRoute;