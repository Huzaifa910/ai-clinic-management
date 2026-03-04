// components/Layout/DoctorSidebar.jsx

const DoctorSidebar = () => {
    return (
        <div className="sidebar">
            <div className="menu-item" onClick={() => navigate('/doctor/dashboard')}>
                📊 Dashboard
            </div>
            <div className="menu-item" onClick={() => navigate('/doctor/appointments')}>
                📅 Appointments
            </div>
            
            {/* ✅ PRESCRIPTIONS SECTION */}
            <div className="menu-section">Prescriptions</div>
            <div className="menu-item" onClick={() => navigate('/doctor/prescriptions')}>
                📋 All Prescriptions
            </div>
            <div className="menu-item" onClick={() => navigate('/doctor/prescription/new')}>
                ✍️ Write New
            </div>
            
            <div className="menu-item" onClick={() => navigate('/doctor/patients')}>
                👥 Patients
            </div>
        </div>
    );
};