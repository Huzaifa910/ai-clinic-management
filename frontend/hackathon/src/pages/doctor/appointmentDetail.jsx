import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './AppointmentDetail.css';

const AppointmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState(null);
    const [previousPrescriptions, setPreviousPrescriptions] = useState([]);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

    useEffect(() => {
        fetchAppointmentDetail();
    }, [id]);

    const fetchAppointmentDetail = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/doctor/appointments/${id}`);
            console.log('Appointment detail:', response.data);
            setAppointment(response.data.data.appointment);
            setPreviousPrescriptions(response.data.data.previousPrescriptions);
        } catch (error) {
            console.error('Fetch appointment error:', error);
            toast.error('Appointment details load nahi ho sakay');
            navigate('/doctor/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.patch(`/doctor/appointments/${id}/status`, {
                status: newStatus
            });
            toast.success(`Appointment ${newStatus} kar diya gaya`);
            fetchAppointmentDetail();
        } catch (error) {
            toast.error('Status change nahi ho saka');
        }
    };

    if (loading) {
        return (
            <DashboardTemplate title="Appointment Details" role="Doctor">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading appointment details...</p>
                </div>
            </DashboardTemplate>
        );
    }

    if (!appointment) {
        return (
            <DashboardTemplate title="Appointment Details" role="Doctor">
                <div className="error-container">
                    <p>Appointment nahi mila</p>
                    <button onClick={() => navigate('/doctor/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </DashboardTemplate>
        );
    }

    return (
        <DashboardTemplate title="Appointment Details" role="Doctor">
            <div className="appointment-detail-container">
                {/* Header with back button */}
                <div className="detail-header">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/doctor/dashboard')}
                    >
                        ← Back to Dashboard
                    </button>
                    <h2>Appointment Details</h2>
                </div>

                {/* Appointment Info Card */}
                <div className="info-card">
                    <div className="card-header">
                        <h3>Appointment Information</h3>
                        <span className={`status-badge-large ${appointment.status}`}>
                            {appointment.status}
                        </span>
                    </div>
                    
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Date & Time</label>
                            <p>{new Date(appointment.date).toLocaleDateString()} at {new Date(appointment.date).toLocaleTimeString()}</p>
                        </div>
                        <div className="info-item">
                            <label>Patient Name</label>
                            <p>{appointment.patientId?.name}</p>
                        </div>
                        <div className="info-item">
                            <label>Age / Gender</label>
                            <p>{appointment.patientId?.age} years • {appointment.patientId?.gender}</p>
                        </div>
                        <div className="info-item">
                            <label>Contact</label>
                            <p>{appointment.patientId?.contact}</p>
                        </div>
                        {appointment.symptoms && (
                            <div className="info-item full-width">
                                <label>Symptoms</label>
                                <p className="symptoms-text">{appointment.symptoms}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {appointment.status === 'pending' && (
                            <button 
                                className="action-btn confirm"
                                onClick={() => handleStatusChange('confirmed')}
                            >
                                ✓ Confirm Appointment
                            </button>
                        )}
                        {appointment.status === 'confirmed' && (
                            <button 
                                className="action-btn primary"
                                onClick={() => {
                                    setShowPrescriptionForm(true);
                                    navigate(`/doctor/prescription/new?appointment=${id}&patient=${appointment.patientId?._id}`);
                                }}
                            >
                                💊 Write Prescription
                            </button>
                        )}
                        {appointment.status === 'completed' && (
                            <button 
                                className="action-btn secondary"
                                onClick={() => navigate(`/doctor/prescriptions/patient/${appointment.patientId?._id}`)}
                            >
                                📋 View All Prescriptions
                            </button>
                        )}
                        <button 
                            className="action-btn cancel"
                            onClick={() => handleStatusChange('cancelled')}
                        >
                            ✕ Cancel Appointment
                        </button>
                    </div>
                </div>

                {/* Patient Medical History */}
                <div className="medical-history-card">
                    <h3>Medical History</h3>
                    {appointment.patientId?.medicalHistory?.length > 0 ? (
                        <div className="history-timeline">
                            {appointment.patientId.medicalHistory.map((history, index) => (
                                <div key={index} className="history-item">
                                    <div className="history-date">
                                        {new Date(history.diagnosedDate).toLocaleDateString()}
                                    </div>
                                    <div className="history-content">
                                        <h4>{history.condition}</h4>
                                        {history.notes && <p>{history.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No medical history available</p>
                    )}
                </div>

                {/* Previous Prescriptions */}
                <div className="previous-prescriptions-card">
                    <h3>Previous Prescriptions</h3>
                    {previousPrescriptions.length > 0 ? (
                        <div className="prescriptions-list">
                            {previousPrescriptions.map((pres, index) => (
                                <div key={index} className="prescription-item">
                                    <div className="prescription-header">
                                        <span className="prescription-date">
                                            {new Date(pres.createdAt).toLocaleDateString()}
                                        </span>
                                        <button 
                                            className="view-btn"
                                            onClick={() => navigate(`/doctor/prescriptions/${pres._id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                    <p className="diagnosis">{pres.diagnosis || 'No diagnosis'}</p>
                                    <div className="medicines-list">
                                        {pres.medicines?.map((med, i) => (
                                            <span key={i} className="medicine-tag">
                                                {med.name} ({med.dosage})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No previous prescriptions</p>
                    )}
                </div>
            </div>
        </DashboardTemplate>
    );
};

export default AppointmentDetail;