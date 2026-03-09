import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./routes/privateRoute";
import AuthRoute from "./routes/authRoute";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import AdminDashboard from "./pages/admin/adminDashboard";
import PatientsList from "./pages/admin/patientsList";
import DoctorsList from "./pages/admin/doctorsList";
import ReceptionistsList from "./pages/admin/receptionistsList";
import DoctorDashboard from "./pages/doctor/doctorDashboard";
import AppointmentDetail from "./pages/doctor/appointmentDetail";
import WritePrescription from "./pages/doctor/writePrescription";
import PrescriptionsList from "./pages/doctor/prescriptionsList";
import PrescriptionView from "./pages/doctor/prescriptionView";
import ReceptionistDashboard from "./pages/receptionist/receptionistDashboard";
import PatientDashboard from "./pages/patient/patientDashboard";
import NotFound from "./pages/notFound/notFound";

// deployed link https://ai-clinic-management.netlify.app/ 
const App = () => {
  return (
    <Routes>
      {/* Auth Routes - Sirf non-logged in users ke liye */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Private Routes - Sirf logged in users ke liye */}
      <Route element={<PrivateRoute />}>
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/patients" element={<PatientsList />} />
        <Route path="/admin/doctors" element={<DoctorsList />} />
        <Route path="/admin/receptionists" element={<ReceptionistsList />} />

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route
          path="/doctor/appointments/:id"
          element={<AppointmentDetail />}
        />
        <Route
          path="/doctor/prescription/new"
          element={<WritePrescription />}
        />
        <Route path="/doctor/prescriptions" element={<PrescriptionsList />} />
        <Route
          path="/doctor/prescriptions/:id"
          element={<PrescriptionView />}
        />

        {/* Receptionist Routes */}
        <Route
          path="/receptionist/dashboard"
          element={<ReceptionistDashboard />}
        />

        {/* Patient Routes */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
      </Route>

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
