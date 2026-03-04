import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import AdminDashboard from "./pages/admin/adminDashboard";
import PatientsList from "./pages/admin/patientslist";
import DoctorsList from "./pages/admin/doctorsList";
import ReceptionistsList from "./pages/admin/receptionistsList";
import DoctorDashboard from "./pages/doctor/doctorDashboard";
import AppointmentDetail from "./pages/doctor/appointmentDetail";
import WritePrescription from "./pages/doctor/writePrescription";
// ✅ Naye imports add karo
import PrescriptionsList from "./pages/doctor/prescriptionsList";
import PrescriptionView from "./pages/doctor/prescriptionView";
import ReceptionistDashboard from "./pages/receptionist/receptionistDashboard";
import PatientDashboard from "./pages/patient/patientDashboard";

const App = () => {
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token"); // ✅ Ye fix karo
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute>
            <PatientsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute>
            <DoctorsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/receptionists"
        element={
          <ProtectedRoute>
            <ReceptionistsList />
          </ProtectedRoute>
        }
      />

      {/* Doctor Routes */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute>
            <AppointmentDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/prescription/new"
        element={
          <ProtectedRoute>
            <WritePrescription />
          </ProtectedRoute>
        }
      />

      {/* ✅ NAYE PRESCRIPTION ROUTES */}
      <Route
        path="/doctor/prescriptions"
        element={
          <ProtectedRoute>
            <PrescriptionsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/prescriptions/:id"
        element={
          <ProtectedRoute>
            <PrescriptionView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/patients/:id"
        element={
          <ProtectedRoute>
            {/* Ye component abhi banana hai */}
            <div>Patient History - Coming Soon</div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/receptionist/dashboard"
        element={
          <ProtectedRoute>
            <ReceptionistDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
