import express from "express";
import {
    createPrescription,
    getAllPrescriptions,
    getPrescriptionById,
    updatePrescription,
    deletePrescription,
    getPatientPrescriptions,
    downloadPrescriptionPDF
} from "../controllers/prescriptionController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const prescriptionRoutes = express.Router();

// Sabhi routes protected hain
prescriptionRoutes.use(protect);

// Special routes
prescriptionRoutes.get("/patient/:patientId", 
    authorize("doctor", "patient", "admin"), 
    getPatientPrescriptions
);

prescriptionRoutes.get("/:id/pdf", 
    authorize("patient", "doctor", "admin"), 
    downloadPrescriptionPDF
);

// CRUD routes
prescriptionRoutes.route("/")
    .get(
        authorize("doctor", "admin", "patient"), 
        getAllPrescriptions
    )
    .post(
        authorize("doctor"),  // Sirf doctor hi prescription likh sakta hai
        createPrescription
    );

prescriptionRoutes.route("/:id")
    .get(
        authorize("doctor", "patient", "admin"), 
        getPrescriptionById
    )
    .put(
        authorize("doctor"),  // Sirf doctor update kar sakta hai
        updatePrescription
    )
    .delete(
        authorize("admin"),  // Sirf admin delete kar sakta hai
        deletePrescription
    );

export default prescriptionRoutes;