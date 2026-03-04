import User from "../models/user.js";
import Patient from "../models/patient.js";
import Appointment from "../models/appointment.js";
import Prescription from "../models/prescription.js";

// @desc    Admin dashboard main stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getDashboardStats = async (req, res) => {
    try {
        // Date ranges calculate karo
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Saare counts REAL database se lo
        const [
            totalPatients,
            totalDoctors,
            totalReceptionists,
            totalAppointments,
            completedAppointments,
            todayAppointments,
            monthAppointments
        ] = await Promise.all([
            Patient.countDocuments(),
            User.countDocuments({ role: "doctor" }),
            User.countDocuments({ role: "receptionist" }),
            Appointment.countDocuments(),
            Appointment.countDocuments({ status: "completed" }),
            Appointment.countDocuments({ 
                date: { $gte: startOfToday } 
            }),
            Appointment.countDocuments({ 
                date: { $gte: startOfMonth } 
            })
        ]);

        // Completion rate calculate karo
        const completionRate = totalAppointments > 0 
            ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
            : 0;

        // Recent activities REAL database se
        const recentActivities = await getRecentActivities();

        // Revenue calculation (simulated but based on real counts)
        const revenue = {
            monthly: {
                subscription: totalDoctors * 5000, // 5000 per doctor
                consultation: monthAppointments * 800, // 800 per appointment
                total: (totalDoctors * 5000) + (monthAppointments * 800)
            }
        };

        res.json({
            success: true,
            data: {
                overview: {
                    totalPatients,
                    totalDoctors,
                    totalReceptionists,
                    totalAppointments,
                    completionRate: parseFloat(completionRate)
                },
                today: {
                    appointments: todayAppointments
                },
                monthly: {
                    appointments: monthAppointments
                },
                revenue,
                recentActivities
            }
        });

    } catch (error) {
        console.error("Get dashboard stats error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Stats nahi mil sakay"
        });
    }
};

// @desc    Doctor performance stats
// @route   GET /api/admin/doctor-performance
// @access  Private (Admin only)
export const getDoctorPerformance = async (req, res) => {
    try {
        // Saare doctors lo
        const doctors = await User.find({ role: "doctor" }).select("name email");

        // Har doctor ke stats calculate karo
        const performance = await Promise.all(
            doctors.map(async (doctor) => {
                const [
                    totalAppointments,
                    completedAppointments,
                    totalPrescriptions
                ] = await Promise.all([
                    Appointment.countDocuments({ doctorId: doctor._id }),
                    Appointment.countDocuments({ 
                        doctorId: doctor._id, 
                        status: "completed" 
                    }),
                    Prescription.countDocuments({ doctorId: doctor._id })
                ]);

                const completionRate = totalAppointments > 0
                    ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
                    : 0;

                return {
                    doctorId: doctor._id,
                    doctorName: doctor.name,
                    email: doctor.email,
                    stats: {
                        totalAppointments,
                        completedAppointments,
                        totalPrescriptions,
                        completionRate: parseFloat(completionRate)
                    }
                };
            })
        );

        // Sort by completion rate
        performance.sort((a, b) => b.stats.completionRate - a.stats.completionRate);

        res.json({
            success: true,
            data: performance
        });

    } catch (error) {
        console.error("Get doctor performance error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Doctor performance nahi mil sakti"
        });
    }
};

// @desc    Monthly trends for charts
// @route   GET /api/admin/charts/monthly
// @access  Private (Admin only)
export const getMonthlyTrends = async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        // Appointments per month
        const appointmentsData = await Appointment.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(year, 0, 1),
                        $lte: new Date(year, 11, 31)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // New patients per month
        const patientsData = await Patient.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(year, 0, 1),
                        $lte: new Date(year, 11, 31)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Format data for charts
        const appointments = months.map((_, index) => {
            const monthData = appointmentsData.find(d => d._id === index + 1);
            return monthData ? monthData.count : 0;
        });

        const newPatients = months.map((_, index) => {
            const monthData = patientsData.find(d => d._id === index + 1);
            return monthData ? monthData.count : 0;
        });

        res.json({
            success: true,
            data: {
                labels: months,
                appointments,
                newPatients
            }
        });

    } catch (error) {
        console.error("Get monthly trends error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Trends nahi mil sakay"
        });
    }
};

// @desc    Most common diagnoses
// @route   GET /api/admin/charts/diagnosis
// @access  Private (Admin only)
export const getCommonDiagnosis = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const diagnosis = await Prescription.aggregate([
            {
                $match: {
                    diagnosis: { $ne: null, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$diagnosis",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({
            success: true,
            data: {
                labels: diagnosis.map(d => d._id),
                counts: diagnosis.map(d => d.count)
            }
        });

    } catch (error) {
        console.error("Get common diagnosis error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Diagnosis stats nahi mil sakay"
        });
    }
};

// @desc    Revenue stats
// @route   GET /api/admin/revenue
// @access  Private (Admin only)
export const getRevenueStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [
            totalDoctors,
            monthlyAppointments,
            yearlyAppointments
        ] = await Promise.all([
            User.countDocuments({ role: "doctor" }),
            Appointment.countDocuments({ 
                date: { $gte: startOfMonth },
                status: "completed"
            }),
            Appointment.countDocuments({ 
                date: { $gte: startOfYear },
                status: "completed"
            })
        ]);

        const SUBSCRIPTION_PRICE = 5000;
        const CONSULTATION_PRICE = 800;

        const monthlyRevenue = {
            subscription: totalDoctors * SUBSCRIPTION_PRICE,
            consultation: monthlyAppointments * CONSULTATION_PRICE,
            total: (totalDoctors * SUBSCRIPTION_PRICE) + (monthlyAppointments * CONSULTATION_PRICE)
        };

        const yearlyRevenue = {
            subscription: totalDoctors * SUBSCRIPTION_PRICE * 12,
            consultation: yearlyAppointments * CONSULTATION_PRICE,
            total: (totalDoctors * SUBSCRIPTION_PRICE * 12) + (yearlyAppointments * CONSULTATION_PRICE)
        };

        res.json({
            success: true,
            data: {
                currentMonth: monthlyRevenue,
                currentYear: yearlyRevenue,
                currency: "Rs"
            }
        });

    } catch (error) {
        console.error("Get revenue stats error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Revenue stats nahi mil sakay"
        });
    }
};

// Helper function: Recent activities
async function getRecentActivities(limit = 5) {
    try {
        // Recent patients
        const recentPatients = await Patient.find()
            .sort("-createdAt")
            .limit(2)
            .select("name createdAt");

        // Recent appointments
        const recentAppointments = await Appointment.find()
            .populate("patientId", "name")
            .populate("doctorId", "name")
            .sort("-createdAt")
            .limit(2)
            .select("status createdAt");

        // Recent prescriptions
        const recentPrescriptions = await Prescription.find()
            .populate("patientId", "name")
            .populate("doctorId", "name")
            .sort("-createdAt")
            .limit(1)
            .select("createdAt");

        const activities = [];

        recentPatients.forEach(p => {
            activities.push({
                type: "patient",
                description: `New patient registered: ${p.name}`,
                time: p.createdAt,
                icon: "👤"
            });
        });

        recentAppointments.forEach(a => {
            activities.push({
                type: "appointment",
                description: `Appointment ${a.status}: ${a.patientId?.name || 'Patient'} with Dr. ${a.doctorId?.name || 'Doctor'}`,
                time: a.createdAt,
                icon: "📅"
            });
        });

        recentPrescriptions.forEach(p => {
            activities.push({
                type: "prescription",
                description: `Prescription issued for ${p.patientId?.name || 'Patient'}`,
                time: p.createdAt,
                icon: "💊"
            });
        });

        // Sort by time
        activities.sort((a, b) => b.time - a.time);
        return activities.slice(0, limit);

    } catch (error) {
        console.error("Get recent activities error:", error);
        return [];
    }
}


// @desc    Get all patients with details
// @route   GET /api/admin/patients
// @access  Private (Admin only)
export const getAllPatients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        
        const searchQuery = search 
            ? { name: { $regex: search, $options: "i" } } 
            : {};

        const patients = await Patient.find(searchQuery)
            .populate("createdBy", "name role")
            .sort("-createdAt")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Patient.countDocuments(searchQuery);

        res.json({
            success: true,
            data: patients,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error("Get all patients error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Patients nahi mil sakay"
        });
    }
};

// @desc    Get all doctors with details
// @route   GET /api/admin/doctors
// @access  Private (Admin only)
export const getAllDoctors = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        
        const searchQuery = search 
            ? { name: { $regex: search, $options: "i" }, role: "doctor" } 
            : { role: "doctor" };

        const doctors = await User.find(searchQuery)
            .select("-password")
            .sort("-createdAt")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Har doctor ke stats bhi le lo
        const doctorsWithStats = await Promise.all(
            doctors.map(async (doctor) => {
                const appointments = await Appointment.countDocuments({ doctorId: doctor._id });
                const prescriptions = await Prescription.countDocuments({ doctorId: doctor._id });
                
                return {
                    ...doctor.toObject(),
                    stats: {
                        totalAppointments: appointments,
                        totalPrescriptions: prescriptions
                    }
                };
            })
        );

        const total = await User.countDocuments({ role: "doctor" });

        res.json({
            success: true,
            data: doctorsWithStats,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error("Get all doctors error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Doctors nahi mil sakay"
        });
    }
};

// @desc    Get all receptionists with details
// @route   GET /api/admin/receptionists
// @access  Private (Admin only)
export const getAllReceptionists = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        
        const searchQuery = search 
            ? { name: { $regex: search, $options: "i" }, role: "receptionist" } 
            : { role: "receptionist" };

        const receptionists = await User.find(searchQuery)
            .select("-password")
            .sort("-createdAt")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments({ role: "receptionist" });

        res.json({
            success: true,
            data: receptionists,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error("Get all receptionists error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Receptionists nahi mil sakay"
        });
    }
};

// @desc    Delete user (doctor/receptionist)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check karo user exists karta hai
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User nahi mila"
            });
        }

        // Admin khud ko delete nahi kar sakta
        if (user.role === "admin") {
            return res.status(400).json({
                success: false,
                message: "Admin ko delete nahi kar sakte"
            });
        }

        // Doctor hai to uski appointments aur prescriptions check karo
        if (user.role === "doctor") {
            const appointments = await Appointment.countDocuments({ doctorId: id });
            const prescriptions = await Prescription.countDocuments({ doctorId: id });
            
            if (appointments > 0 || prescriptions > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Doctor ke ${appointments} appointments aur ${prescriptions} prescriptions hain. Pehle unhe handle karo`
                });
            }
        }

        // Receptionist hai to uski created records check karo
        if (user.role === "receptionist") {
            const patients = await Patient.countDocuments({ createdBy: id });
            const appointments = await Appointment.countDocuments({ createdBy: id });
            
            if (patients > 0 || appointments > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Receptionist ne ${patients} patients aur ${appointments} appointments banaye hain. Pehle unhe handle karo`
                });
            }
        }

        // User delete karo
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: `${user.role} successfully delete ho gaya`
        });

    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. User delete nahi ho sakta"
        });
    }
};

// @desc    Delete patient
// @route   DELETE /api/admin/patients/:id
// @access  Private (Admin only)
export const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        // Check karo patient exists karta hai
        const patient = await Patient.findById(id);
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient nahi mila"
            });
        }

        // Patient ki appointments check karo
        const appointments = await Appointment.countDocuments({ patientId: id });
        const prescriptions = await Prescription.countDocuments({ patientId: id });
        
        if (appointments > 0 || prescriptions > 0) {
            return res.status(400).json({
                success: false,
                message: `Patient ke ${appointments} appointments aur ${prescriptions} prescriptions hain. Pehle unhe handle karo`
            });
        }

        // Patient delete karo
        await Patient.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Patient successfully delete ho gaya"
        });

    } catch (error) {
        console.error("Delete patient error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Patient delete nahi ho sakta"
        });
    }
};

// @desc    Delete receptionist
// @route   DELETE /api/admin/receptionists/:id
// @access  Private (Admin only)
export const deleteReceptionist = async (req, res) => {
    try {
        const { id } = req.params;

        // Check karo receptionist exists karta hai
        const receptionist = await User.findOne({ _id: id, role: "receptionist" });
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: "Receptionist nahi mila"
            });
        }

        // Receptionist ki created records check karo
        const patients = await Patient.countDocuments({ createdBy: id });
        const appointments = await Appointment.countDocuments({ createdBy: id });
        
        if (patients > 0 || appointments > 0) {
            return res.status(400).json({
                success: false,
                message: `Receptionist ne ${patients} patients aur ${appointments} appointments banaye hain. Pehle unhe handle karo`
            });
        }

        // Receptionist delete karo
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Receptionist successfully delete ho gaya"
        });

    } catch (error) {
        console.error("Delete receptionist error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Receptionist delete nahi ho sakta"
        });
    }
};