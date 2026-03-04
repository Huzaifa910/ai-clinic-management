import Appointment from "../models/appointment.js";
import Patient from "../models/patient.js";
import User from "../models/user.js";

// @desc    Naya appointment book karo
// @route   POST /api/appointments
// @access  Private (Receptionist, Patient, Doctor, Admin)
export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, symptoms } = req.body;

    // Validation
    if (!patientId || !doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "Patient, doctor aur date zaroori hain",
      });
    }

    // Check karo patient exists karta hai
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient nahi mila",
      });
    }

    // Check karo doctor exists karta hai aur uski role doctor hai
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor nahi mila",
      });
    }

    // Check karo ke doctor us time already busy hai ya nahi
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Doctor is time par already booked hai",
      });
    }

    // Appointment create karo
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      symptoms,
      status: "pending",
      createdBy: req.user.id,
    });

    // Populate karo details ke saath
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email")
      .populate("createdBy", "name role");

    res.status(201).json({
      success: true,
      message: "Appointment book ho gaya ✅",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Appointment book nahi ho sakta",
    });
  }
};

// @desc    Saare appointments ki list (with filters)
// @route   GET /api/appointments
// @access  Private
export const getAllAppointments = async (req, res) => {
  try {
    const {
      status,
      doctorId,
      patientId,
      date,
      page = 1,
      limit = 10,
    } = req.query;

    // Filter object banao
    let filter = {};

    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (date) {
      // Specific date ke appointments
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.date = { $gte: startDate, $lte: endDate };
    }

    // Role-based filtering
    if (req.user.role === "doctor") {
      // Doctor sirf apne appointments dekh sakta hai
      filter.doctorId = req.user.id;
    } else if (req.user.role === "patient") {
      // Patient sirf apne appointments dekh sakta hai
      filter.patientId = req.user.id; // Note: Patient ID user ID nahi hai
      // Isko handle karne ka tareeqa alag hai - baad mein dekhenge
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Appointments fetch karo
    const appointments = await Appointment.find(filter)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email")
      .populate("createdBy", "name role")
      .sort("-date")
      .skip(skip)
      .limit(parseInt(limit));

    // Total count for pagination
    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      appointments,
    });
  } catch (error) {
    console.error("Get all appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Appointments nahi mil sakay",
    });
  }
};

// @desc    Ek particular appointment ki detail
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name age gender contact address medicalHistory")
      .populate("doctorId", "name email")
      .populate("createdBy", "name role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment nahi mila",
      });
    }

    // Check access rights
    if (
      req.user.role === "doctor" &&
      appointment.doctorId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Yeh appointment aapka nahi hai",
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Get appointment by id error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Appointment update karo (status, date, etc)
// @route   PUT /api/appointments/:id
// @access  Private (Receptionist, Doctor, Admin)
export const updateAppointment = async (req, res) => {
  try {
    const { date, status, symptoms } = req.body;

    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment nahi mila",
      });
    }

    // Check access rights
    if (
      req.user.role === "doctor" &&
      appointment.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Aap sirf apne appointments update kar sakte hain",
      });
    }

    // Agar date change ho rahi hai to check karo doctor free hai ya nahi
    if (date && date !== appointment.date.toISOString()) {
      const existingAppointment = await Appointment.findOne({
        doctorId: appointment.doctorId,
        date: new Date(date),
        status: { $in: ["pending", "confirmed"] },
        _id: { $ne: req.params.id }, // Current appointment ko exclude karo
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: "Doctor is time par already booked hai",
        });
      }
    }

    // Update karo
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { date, status, symptoms },
      { new: true, runValidators: true },
    )
      .populate("patientId", "name age gender")
      .populate("doctorId", "name email");

    res.json({
      success: true,
      message: "Appointment update ho gaya ✅",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Update nahi ho sakta",
    });
  }
};

// @desc    Appointment cancel karo (delete nahi, sirf status change)
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (Receptionist, Patient, Doctor, Admin)
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment nahi mila",
      });
    }

    // Already cancelled ya completed hai?
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment already cancelled hai",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed appointment cancel nahi kar sakte",
      });
    }

    // Status update karo
    appointment.status = "cancelled";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancel ho gaya ❌",
      appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Cancel nahi ho sakta",
    });
  }
};

// @desc    Doctor ka schedule dekho (specific date ke liye)
// @route   GET /api/appointments/doctor/schedule
// @access  Private (Doctor, Receptionist, Admin)
export const getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID aur date zaroori hai",
      });
    }

    // Date range banao
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Appointments fetch karo
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" },
    })
      .populate("patientId", "name age gender contact")
      .sort("date");

    // Available slots calculate karo (optional)
    // Assumption: 9 AM to 5 PM, 30-min slots
    const workingHours = {
      start: 9, // 9 AM
      end: 17, // 5 PM
    };

    const bookedSlots = appointments.map((a) => {
      const d = new Date(a.date);
      return d.getHours() * 60 + d.getMinutes();
    });

    const availableSlots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = hour * 60 + minute;
        if (!bookedSlots.includes(slotTime)) {
          availableSlots.push(`${hour}:${minute === 0 ? "00" : minute}`);
        }
      }
    }

    res.json({
      success: true,
      date,
      doctorId,
      appointments,
      availableSlots,
      totalAppointments: appointments.length,
    });
  } catch (error) {
    console.error("Get doctor schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Schedule nahi mil sakta",
    });
  }
};

// @desc    Today's appointments (receptionist ke liye)
// @route   GET /api/appointments/today
// @access  Private (Receptionist, Doctor, Admin)
export const getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filter = {
      date: { $gte: today, $lt: tomorrow },
    };

    // Doctor ho to sirf apne appointments
    if (req.user.role === "doctor") {
      filter.doctorId = req.user.id;
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email")
      .sort("date");

    // Status-wise grouping
    const grouped = {
      pending: appointments.filter((a) => a.status === "pending"),
      confirmed: appointments.filter((a) => a.status === "confirmed"),
      completed: appointments.filter((a) => a.status === "completed"),
      cancelled: appointments.filter((a) => a.status === "cancelled"),
      total: appointments.length,
    };

    res.json({
      success: true,
      date: today.toDateString(),
      grouped,
      all: appointments,
    });
  } catch (error) {
    console.error("Get today appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
