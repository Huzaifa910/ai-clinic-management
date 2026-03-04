import express from "express";
import {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    addMedicalHistory,
    // Naye functions import karo
    getMyProfile,
    getMyAppointments,
    getMyPrescriptions,
    downloadMyPrescription,
    getMyTimeline
} from "../controllers/patientController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const patientRoutes = express.Router();

// Sabhi routes protected hain
patientRoutes.use(protect);

// 👤 PATIENT-SPECIFIC ROUTES (Pehle yeh define karo)
patientRoutes.get("/my-profile", 
    authorize("patient"), 
    getMyProfile
);

patientRoutes.get("/my-appointments", 
    authorize("patient"), 
    getMyAppointments
);

patientRoutes.get("/my-prescriptions", 
    authorize("patient"), 
    getMyPrescriptions
);

patientRoutes.get("/my-timeline", 
    authorize("patient"), 
    getMyTimeline
);

patientRoutes.get("/my-prescriptions/:id/download", 
    authorize("patient"), 
    downloadMyPrescription
);

// 📋 REGULAR PATIENT CRUD ROUTES
patientRoutes.route("/")
    .get(
        authorize("receptionist", "doctor", "admin"), 
        getAllPatients
    )
    .post(
        authorize("receptionist", "doctor", "admin"),
        createPatient
    );

patientRoutes.route("/:id")
    .get(
        authorize("receptionist", "doctor", "admin", "patient"), 
        getPatientById
    )
    .put(
        authorize("receptionist", "doctor", "admin"),
        updatePatient
    )
    .delete(
        authorize("admin"),
        deletePatient
    );

patientRoutes.post("/:id/medical-history",
    authorize("doctor", "admin"),
    addMedicalHistory
);

export default patientRoutes;