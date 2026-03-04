import Appointment from "../models/appointment.js";
import Patient from "../models/patient.js";
import Prescription from "../models/prescription.js";
import User from "../models/user.js";

// @desc    Get doctor dashboard stats
// @route   GET /api/doctor/stats
// @access  Private (Doctor only)
export const getDoctorStats = async (req, res) => {
    try {
        const doctorId = req.user.id;
        
        // Date ranges
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Saare counts
        const [
            todayAppointments,
            upcomingAppointments,
            monthlyAppointments,
            totalPatients,
            totalPrescriptions,
            completedAppointments,
            recentPatients
        ] = await Promise.all([
            // Today's appointments
            Appointment.countDocuments({ 
                doctorId, 
                date: { $gte: startOfToday },
                status: { $ne: "cancelled" }
            }),
            
            // Upcoming appointments (future)
            Appointment.countDocuments({ 
                doctorId, 
                date: { $gt: new Date() },
                status: { $in: ["pending", "confirmed"] }
            }),
            
            // This month's appointments
            Appointment.countDocuments({ 
                doctorId, 
                date: { $gte: startOfMonth },
                status: { $ne: "cancelled" }
            }),
            
            // Unique patients
            Appointment.distinct("patientId", { doctorId }).then(ids => ids.length),
            
            // Total prescriptions
            Prescription.countDocuments({ doctorId }),
            
            // Completed appointments
            Appointment.countDocuments({ doctorId, status: "completed" }),
            
            // Recent 5 patients
            Appointment.find({ doctorId })
                .populate("patientId", "name age gender contact")
                .sort("-date")
                .limit(5)
                .then(appointments => 
                    appointments.map(a => a.patientId).filter(p => p)
                )
        ]);

        // Completion rate
        const totalAppointments = await Appointment.countDocuments({ doctorId });
        const completionRate = totalAppointments > 0 
            ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                overview: {
                    todayAppointments,
                    upcomingAppointments,
                    monthlyAppointments,
                    totalPatients,
                    totalPrescriptions,
                    completionRate: parseFloat(completionRate)
                },
                recentPatients: [...new Set(recentPatients)] // Remove duplicates
            }
        });

    } catch (error) {
        console.error("Get doctor stats error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Stats nahi mil sakay"
        });
    }
};

// @desc    Get doctor's appointments with filters
// @route   GET /api/doctor/appointments
// @access  Private (Doctor only)
export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { status, date, page = 1, limit = 10 } = req.query;

        let filter = { doctorId };
        
        if (status) filter.status = status;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const appointments = await Appointment.find(filter)
            .populate("patientId", "name age gender contact medicalHistory")
            .sort("-date")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(filter);

        res.json({
            success: true,
            data: appointments,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error("Get doctor appointments error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Appointments nahi mil sakay"
        });
    }
};

// @desc    Get single appointment with patient details
// @route   GET /api/doctor/appointments/:id
// @access  Private (Doctor only)
export const getAppointmentDetail = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("patientId")
            .populate("doctorId", "name email");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment nahi mila"
            });
        }

        // Check if this appointment belongs to the doctor
        if (appointment.doctorId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Yeh appointment aapka nahi hai"
            });
        }

        // Get patient's previous prescriptions
        const previousPrescriptions = await Prescription.find({
            patientId: appointment.patientId._id,
            doctorId: req.user.id
        }).sort("-createdAt").limit(5);

        res.json({
            success: true,
            data: {
                appointment,
                previousPrescriptions
            }
        });

    } catch (error) {
        console.error("Get appointment detail error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Update appointment status
// @route   PATCH /api/doctor/appointments/:id/status
// @access  Private (Doctor only)
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment nahi mila"
            });
        }

        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Yeh appointment aapka nahi hai"
            });
        }

        appointment.status = status;
        await appointment.save();

        res.json({
            success: true,
            message: `Appointment ${status} kar diya gaya`,
            data: appointment
        });

    } catch (error) {
        console.error("Update appointment status error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Search patients
// @route   GET /api/doctor/patients/search
// @access  Private (Doctor only)
export const searchPatients = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.json({ data: [] });
        }

        const patients = await Patient.find({
            $or: [
                { name: { $regex: q, $options: "i" } },
                { contact: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } }
            ]
        }).limit(10);

        res.json({
            success: true,
            data: patients
        });

    } catch (error) {
        console.error("Search patients error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// @desc    Get patient details with history
// @route   GET /api/doctor/patients/:id
// @access  Private (Doctor only)
export const getPatientDetails = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient nahi mila"
            });
        }

        // Get patient's appointments with this doctor
        const appointments = await Appointment.find({
            patientId: patient._id,
            doctorId: req.user.id
        }).sort("-date");

        // Get patient's prescriptions from this doctor
        const prescriptions = await Prescription.find({
            patientId: patient._id,
            doctorId: req.user.id
        }).sort("-createdAt");

        res.json({
            success: true,
            data: {
                patient,
                appointments,
                prescriptions,
                totalVisits: appointments.length,
                lastVisit: appointments[0]?.date || null
            }
        });

    } catch (error) {
        console.error("Get patient details error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};