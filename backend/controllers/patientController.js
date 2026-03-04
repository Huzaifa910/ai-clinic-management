import Patient from "../models/patient.js";
import User from "../models/user.js";
import PDFDocument from "pdfkit";


// @desc    Naya patient register karo
// @route   POST /api/patients
// @access  Private (Receptionist, Doctor, Admin)
export const createPatient = async (req, res) => {
    try {
        const { name, age, gender, contact, address, medicalHistory } = req.body;

        // Validation - required fields
        if (!name || !age || !gender || !contact) {
            return res.status(400).json({
                success: false,
                message: "Name, age, gender and contact are required!"
            });
        }

        // Naya patient create karo
        const patient = await Patient.create({
            name,
            age,
            gender,
            contact,
            address,
            medicalHistory: medicalHistory || [],
            createdBy: req.user.id  // Currently logged in user (receptionist/doctor)
        });

        res.status(201).json({
            success: true,
            message: "Patient registered ✅",
            patient
        });

    } catch (error) {
        console.error("Create patient error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Patient not created!"
        });
    }
};

// @desc    Saare patients ki list le ao
// @route   GET /api/patients
// @access  Private (Sabhi roles)
export const getAllPatients = async (req, res) => {
    try {
        // Pagination (optional)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Search filter (agar name se search karna ho)
        const search = req.query.search || "";
        const searchQuery = search 
            ? { name: { $regex: search, $options: "i" } } 
            : {};

        // Total patients count
        const totalPatients = await Patient.countDocuments(searchQuery);

        // Patients fetch karo
        const patients = await Patient.find(searchQuery)
            .populate("createdBy", "name email role")  // Kis ne banaya yeh info
            .sort("-createdAt")
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: patients.length,
            total: totalPatients,
            page,
            totalPages: Math.ceil(totalPatients / limit),
            patients
        });

    } catch (error) {
        console.error("Get all patients error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Patients nahi mil sakay"
        });
    }
};

// @desc    Ek particular patient ki detail
// @route   GET /api/patients/:id
// @access  Private
export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate("createdBy", "name email role")
            .populate({
                path: "appointments",
                select: "date status symptoms",
                options: { sort: { date: -1 }, limit: 5 }
            });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        res.json({
            success: true,
            patient
        });

    } catch (error) {
        console.error("Get patient by id error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Patient ki info update karo
// @route   PUT /api/patients/:id
// @access  Private (Receptionist, Doctor, Admin)
export const updatePatient = async (req, res) => {
    try {
        const { name, age, gender, contact, address, medicalHistory } = req.body;

        // Pehle check karo patient exists karta hai
        let patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found!"
            });
        }

        // Update karo
        patient = await Patient.findByIdAndUpdate(
            req.params.id,
            {
                name,
                age,
                gender,
                contact,
                address,
                medicalHistory
            },
            { new: true, runValidators: true }  // new: true means updated document return karo
        );

        res.json({
            success: true,
            message: "Patient updated ✅",
            patient
        });

    } catch (error) {
        console.error("Update patient error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Update nahi ho sakta"
        });
    }
};

// @desc    Patient delete karo
// @route   DELETE /api/patients/:id
// @access  Private (Admin only - important!)
export const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient nahi mila"
            });
        }

        // Check karo ke patient ke appointments hain ya nahi
        // Agar hain to delete na karo (data integrity)
        const Appointment = (await import("../models/appointment.js")).default;
        const appointments = await Appointment.find({ patientId: req.params.id });
        
        if (appointments.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Is patient ke appointments hain. Pehle appointments handle karo"
            });
        }

        await patient.deleteOne();

        res.json({
            success: true,
            message: "Patient deleted ✅"
        });

    } catch (error) {
        console.error("Delete patient error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Delete nahi ho sakta"
        });
    }
};

// @desc    Patient ki medical history mein naya entry add karo
// @route   POST /api/patients/:id/medical-history
// @access  Private (Doctor, Admin)
export const addMedicalHistory = async (req, res) => {
    try {
        const { condition, diagnosedDate, notes } = req.body;

        if (!condition) {
            return res.status(400).json({
                success: false,
                message: "Condition zaroori hai"
            });
        }

        const patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient nahi mila"
            });
        }

        // Medical history mein naya entry push karo
        patient.medicalHistory.push({
            condition,
            diagnosedDate: diagnosedDate || Date.now(),
            notes
        });

        await patient.save();

        res.json({
            success: true,
            message: "Medical history update ho gayi ✅",
            medicalHistory: patient.medicalHistory
        });

    } catch (error) {
        console.error("Add medical history error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ***********************************************************
// Patient profile APi

// @desc    Patient ki apni profile dekho
// @route   GET /api/patients/my-profile
// @access  Private (Patient only)
export const getMyProfile = async (req, res) => {
    try {
        // Patient ne login kiya hai to req.user.id se patient find karo
        // Note: Patient model mein ek field chahiye userId jo User model se link ho
        // Agar nahi hai to hum email ya phone se match karenge
        
        const patient = await Patient.findOne({ 
            $or: [
                { email: req.user.email }, // Agar patient mein email ho
                { contact: req.user.phone } // Ya phone number se match
            ]
        }).populate("createdBy", "name role");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient record nahi mila. Receptionist se register karayein"
            });
        }

        // Patient ke appointments bhi le lo
        const Appointment = (await import("../models/appointment.js")).default;
        const appointments = await Appointment.find({ patientId: patient._id })
            .populate("doctorId", "name email")
            .sort("-date")
            .limit(5);

        // Patient ke prescriptions bhi le lo
        const Prescription = (await import("../models/prescription.js")).default;
        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate("doctorId", "name")
            .sort("-createdAt")
            .limit(5);

        res.json({
            success: true,
            patient,
            recentAppointments: appointments,
            recentPrescriptions: prescriptions
        });

    } catch (error) {
        console.error("Get my profile error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Profile nahi mil sakti"
        });
    }
};

// @desc    Patient ke apne appointments dekho
// @route   GET /api/patients/my-appointments
// @access  Private (Patient only)
export const getMyAppointments = async (req, res) => {
    try {
        // Pehle patient find karo
        const patient = await Patient.findOne({ 
            $or: [
                { email: req.user.email },
                { contact: req.user.phone }
            ]
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient record nahi mila"
            });
        }

        const { status, page = 1, limit = 10 } = req.query;
        
        // Filter banao
        let filter = { patientId: patient._id };
        if (status) filter.status = status;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Appointments fetch karo
        const appointments = await Appointment.find(filter)
            .populate("doctorId", "name email")
            .populate("createdBy", "name role")
            .sort("-date")
            .skip(skip)
            .limit(parseInt(limit));

        // Total count
        const total = await Appointment.countDocuments(filter);

        res.json({
            success: true,
            count: appointments.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            appointments
        });

    } catch (error) {
        console.error("Get my appointments error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Appointments nahi mil sakay"
        });
    }
};

// @desc    Patient ke apne prescriptions dekho
// @route   GET /api/patients/my-prescriptions
// @access  Private (Patient only)
export const getMyPrescriptions = async (req, res) => {
    try {
        // Pehle patient find karo
        const patient = await Patient.findOne({ 
            $or: [
                { email: req.user.email },
                { contact: req.user.phone }
            ]
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient record nahi mila"
            });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Prescriptions fetch karo
        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate("doctorId", "name email")
            .populate("appointmentId", "date symptoms")
            .sort("-createdAt")
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Prescription.countDocuments({ patientId: patient._id });

        res.json({
            success: true,
            count: prescriptions.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            prescriptions
        });

    } catch (error) {
        console.error("Get my prescriptions error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Prescriptions nahi mil sakay"
        });
    }
};

// @desc    Patient ka apna prescription download karo (PDF)
// @route   GET /api/patients/my-prescriptions/:id/download
// @access  Private (Patient only)
export const downloadMyPrescription = async (req, res) => {
    try {
        // Pehle patient find karo
        const patient = await Patient.findOne({ 
            $or: [
                { email: req.user.email },
                { contact: req.user.phone }
            ]
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient record nahi mila"
            });
        }

        // Prescription find karo
        const prescription = await Prescription.findOne({
            _id: req.params.id,
            patientId: patient._id
        })
        .populate("patientId", "name age gender contact address")
        .populate("doctorId", "name email")
        .populate("appointmentId", "date symptoms");

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription nahi mila ya yeh aapka nahi hai"
            });
        }

        // PDF generate karo (same as before)
        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription_${prescription._id}.pdf`);

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

        doc.end();

    } catch (error) {
        console.error("Download prescription error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. PDF download nahi ho sakta"
        });
    }
};

// @desc    Patient ki complete medical history timeline
// @route   GET /api/patients/my-timeline
// @access  Private (Patient only)
export const getMyTimeline = async (req, res) => {
    try {
        // Pehle patient find karo
        const patient = await Patient.findOne({ 
            $or: [
                { email: req.user.email },
                { contact: req.user.phone }
            ]
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient record nahi mila"
            });
        }

        // Saari appointments
        const appointments = await Appointment.find({ patientId: patient._id })
            .populate("doctorId", "name")
            .select("date status symptoms createdAt");

        // Saare prescriptions
        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate("doctorId", "name")
            .select("diagnosis medicines createdAt followUpDate");

        // Timeline banao (chronological order)
        const timeline = [];

        // Appointments ko timeline mein daalo
        appointments.forEach(apt => {
            timeline.push({
                type: "appointment",
                date: apt.date,
                title: `Appointment with Dr. ${apt.doctorId?.name || 'Doctor'}`,
                description: apt.symptoms || "No symptoms recorded",
                status: apt.status,
                createdAt: apt.createdAt
            });
        });

        // Prescriptions ko timeline mein daalo
        prescriptions.forEach(pres => {
            timeline.push({
                type: "prescription",
                date: pres.createdAt,
                title: "Prescription",
                description: pres.diagnosis || "Prescription issued",
                medicines: pres.medicines,
                followUpDate: pres.followUpDate
            });
        });

        // Medical history (jo patient model mein hai)
        if (patient.medicalHistory && patient.medicalHistory.length > 0) {
            patient.medicalHistory.forEach(history => {
                timeline.push({
                    type: "medical_history",
                    date: history.diagnosedDate,
                    title: "Medical History Entry",
                    description: history.condition,
                    notes: history.notes
                });
            });
        }

        // Sort by date (latest first)
        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            patient: {
                name: patient.name,
                age: patient.age,
                gender: patient.gender
            },
            timeline,
            stats: {
                totalAppointments: appointments.length,
                totalPrescriptions: prescriptions.length,
                totalHistoryEntries: patient.medicalHistory?.length || 0
            }
        });

    } catch (error) {
        console.error("Get my timeline error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Timeline nahi mil sakti"
        });
    }
};