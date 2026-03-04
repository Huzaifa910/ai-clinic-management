import Prescription from "../models/prescription.js";
import Appointment from "../models/appointment.js";
import Patient from "../models/patient.js";
import User from "../models/user.js";
import PDFDocument from "pdfkit";

// @desc    Naya prescription likho
// @route   POST /api/prescriptions
// @access  Private (Doctor only)
export const createPrescription = async (req, res) => {
    try {
        const { appointmentId, patientId, medicines, diagnosis, notes, followUpDate } = req.body;

        // Validation
        if (!appointmentId || !patientId || !medicines || medicines.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Appointment, patient aur medicines zaroori hain"
            });
        }

        // Check karo appointment exists karta hai
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment nahi mila"
            });
        }

        // Check karo ke yeh appointment isi doctor ki hai
        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Aap sirf apne appointments ka prescription likh sakte hain"
            });
        }

        // Check karo patient exists karta hai
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient nahi mila"
            });
        }

        // Prescription create karo
        const prescription = await Prescription.create({
            appointmentId,
            patientId,
            doctorId: req.user.id,
            medicines,
            diagnosis,
            notes,
            followUpDate
        });

        // Appointment ka status "completed" karo
        appointment.status = "completed";
        await appointment.save();

        // Populate karo details ke saath
        const populatedPrescription = await Prescription.findById(prescription._id)
            .populate("patientId", "name age gender contact")
            .populate("doctorId", "name email")
            .populate("appointmentId", "date symptoms");

        res.status(201).json({
            success: true,
            message: "Prescription likh diya gaya ✅",
            prescription: populatedPrescription
        });

    } catch (error) {
        console.error("Create prescription error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Prescription nahi likh sakte"
        });
    }
};

// @desc    Saare prescriptions ki list
// @route   GET /api/prescriptions
// @access  Private (Doctor, Admin, Patient - apne apne)
export const getAllPrescriptions = async (req, res) => {
    try {
        const { patientId, doctorId, page = 1, limit = 10 } = req.query;
        
        // Filter object banao
        let filter = {};
        
        if (patientId) filter.patientId = patientId;
        if (doctorId) filter.doctorId = doctorId;

        // Role-based filtering
        if (req.user.role === "doctor") {
            // Doctor sirf apne likhe prescriptions dekh sakta hai
            filter.doctorId = req.user.id;
        } else if (req.user.role === "patient") {
            // Patient sirf apne prescriptions dekh sakta hai
            // Note: Patient ID alag hai User ID se - isko handle karna hoga
            // Abhi ke liye patientId query parameter se lega
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Prescriptions fetch karo
        const prescriptions = await Prescription.find(filter)
            .populate("patientId", "name age gender contact")
            .populate("doctorId", "name email")
            .populate("appointmentId", "date symptoms")
            .sort("-createdAt")
            .skip(skip)
            .limit(parseInt(limit));

        // Total count
        const total = await Prescription.countDocuments(filter);

        res.json({
            success: true,
            count: prescriptions.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            prescriptions
        });

    } catch (error) {
        console.error("Get all prescriptions error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Prescriptions nahi mil sakay"
        });
    }
};

// @desc    Ek particular prescription ki detail
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate("patientId", "name age gender contact address")
            .populate("doctorId", "name email")
            .populate("appointmentId", "date symptoms");

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription nahi mila"
            });
        }

        // Check access rights
        if (req.user.role === "doctor" && prescription.doctorId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Yeh prescription aapka nahi hai"
            });
        }

        res.json({
            success: true,
            prescription
        });

    } catch (error) {
        console.error("Get prescription by id error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Prescription update karo
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor only)
export const updatePrescription = async (req, res) => {
    try {
        const { medicines, diagnosis, notes, followUpDate } = req.body;

        let prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription nahi mila"
            });
        }

        // Check karo yeh prescription isi doctor ne likha hai
        if (prescription.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Aap sirf apne prescriptions update kar sakte hain"
            });
        }

        // Update karo
        prescription = await Prescription.findByIdAndUpdate(
            req.params.id,
            { medicines, diagnosis, notes, followUpDate },
            { new: true, runValidators: true }
        )
        .populate("patientId", "name age gender")
        .populate("doctorId", "name email");

        res.json({
            success: true,
            message: "Prescription update ho gaya ✅",
            prescription
        });

    } catch (error) {
        console.error("Update prescription error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Update nahi ho sakta"
        });
    }
};

// @desc    Prescription delete karo
// @route   DELETE /api/prescriptions/:id
// @access  Private (Admin only)
export const deletePrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription nahi mila"
            });
        }

        await prescription.deleteOne();

        res.json({
            success: true,
            message: "Prescription delete ho gaya ✅"
        });

    } catch (error) {
        console.error("Delete prescription error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Delete nahi ho sakta"
        });
    }
};

// @desc    Patient ke saare prescriptions
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Doctor, Patient, Admin)
export const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check karo patient exists karta hai
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient nahi mila"
            });
        }

        const prescriptions = await Prescription.find({ patientId })
            .populate("doctorId", "name email")
            .populate("appointmentId", "date")
            .sort("-createdAt");

        res.json({
            success: true,
            count: prescriptions.length,
            patient: {
                name: patient.name,
                age: patient.age,
                gender: patient.gender
            },
            prescriptions
        });

    } catch (error) {
        console.error("Get patient prescriptions error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Prescription PDF download karo
// @route   GET /api/prescriptions/:id/pdf
// @access  Private (Patient, Doctor, Admin)
export const downloadPrescriptionPDF = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate("patientId", "name age gender contact address")
            .populate("doctorId", "name email")
            .populate("appointmentId", "date symptoms");

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription nahi mila"
            });
        }

        // PDF document create karo
        const doc = new PDFDocument();
        
        // Response headers set karo
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription_${prescription._id}.pdf`);

        // PDF ko response mein pipe karo
        doc.pipe(res);

        // Clinic header
        doc.fontSize(20).text('AI Clinic Management', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Medical Prescription', { align: 'center' });
        doc.moveDown();

        // Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Patient details
        doc.fontSize(12).text(`Patient Name: ${prescription.patientId.name}`);
        doc.text(`Age: ${prescription.patientId.age} | Gender: ${prescription.patientId.gender}`);
        doc.text(`Contact: ${prescription.patientId.contact}`);
        doc.moveDown();

        // Doctor details
        doc.text(`Doctor: Dr. ${prescription.doctorId.name}`);
        doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
        doc.moveDown();

        // Diagnosis
        doc.fontSize(14).text('Diagnosis:');
        doc.fontSize(12).text(prescription.diagnosis || 'Not specified');
        doc.moveDown();

        // Medicines
        doc.fontSize(14).text('Prescribed Medicines:');
        doc.moveDown();

        prescription.medicines.forEach((medicine, index) => {
            doc.fontSize(12).text(`${index + 1}. ${medicine.name}`);
            doc.fontSize(10).text(`   Dosage: ${medicine.dosage}`);
            doc.fontSize(10).text(`   Frequency: ${medicine.frequency}`);
            doc.fontSize(10).text(`   Duration: ${medicine.duration}`);
            if (medicine.instructions) {
                doc.fontSize(10).text(`   Instructions: ${medicine.instructions}`);
            }
            doc.moveDown();
        });

        // Notes
        if (prescription.notes) {
            doc.fontSize(14).text('Additional Notes:');
            doc.fontSize(12).text(prescription.notes);
            doc.moveDown();
        }

        // Follow up
        if (prescription.followUpDate) {
            doc.fontSize(12).text(`Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString()}`);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(10).text('This is a computer generated prescription.', { align: 'center' });
        doc.text('Valid only with doctor\'s signature.', { align: 'center' });

        // PDF end karo
        doc.end();

    } catch (error) {
        console.error("Download PDF error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. PDF download nahi ho sakta"
        });
    }
};