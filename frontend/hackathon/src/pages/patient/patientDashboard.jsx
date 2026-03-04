import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './patientDashboard.css';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [pastAppointments, setPastAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        fetchPatientData();
    }, []);

    const fetchPatientData = async () => {
        setLoading(true);
        try {
            // Parallel API calls
            const [profileRes, appointmentsRes, prescriptionsRes, timelineRes] = await Promise.all([
                api.get('/patients/my-profile'),
                api.get('/patients/my-appointments'),
                api.get('/patients/my-prescriptions'),
                api.get('/patients/my-timeline')
            ]);

            console.log('Profile:', profileRes.data);
            console.log('Appointments:', appointmentsRes.data);
            console.log('Prescriptions:', prescriptionsRes.data);
            console.log('Timeline:', timelineRes.data);

            setProfile(profileRes.data.patient);
            
            // Separate upcoming and past appointments
            const now = new Date();
            const allAppointments = appointmentsRes.data.appointments || [];
            
            const upcoming = allAppointments.filter(apt => 
                new Date(apt.date) > now && apt.status !== 'cancelled' && apt.status !== 'completed'
            );
            
            const past = allAppointments.filter(apt => 
                new Date(apt.date) <= now || apt.status === 'completed' || apt.status === 'cancelled'
            );

            setUpcomingAppointments(upcoming);
            setPastAppointments(past);
            setPrescriptions(prescriptionsRes.data.prescriptions || []);
            setTimeline(timelineRes.data.timeline || []);

        } catch (error) {
            console.error('Fetch patient data error:', error);
            toast.error('Data load nahi ho saka');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (prescriptionId) => {
        try {
            const response = await api.get(`/patients/my-prescriptions/${prescriptionId}/download`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `prescription_${prescriptionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('PDF download ho raha hai');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('PDF download nahi ho saka');
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('Kya aap is appointment ko cancel karna chahte hain?')) return;

        try {
            await api.patch(`/appointments/${appointmentId}/cancel`);
            toast.success('Appointment cancelled');
            fetchPatientData(); // Refresh data
        } catch (error) {
            toast.error('Cancel nahi ho saka');
        }
    };

    if (loading) {
        return (
            <DashboardTemplate title="Patient Dashboard" role="Patient">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your health data...</p>
                </div>
            </DashboardTemplate>
        );
    }

    return (
        <DashboardTemplate title="My Health Dashboard" role="Patient">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h2>Welcome back, {profile?.name?.split(' ')[0]}! 👋</h2>
                <p>Here's your complete health overview.</p>
            </div>

            {/* Profile Summary Card */}
            <div className="profile-summary-card">
                <div className="profile-avatar-large">
                    {profile?.name?.charAt(0)}
                </div>
                <div className="profile-details">
                    <h2>{profile?.name}</h2>
                    <div className="profile-meta">
                        <span className="meta-item">🎂 {profile?.age} years</span>
                        <span className="meta-item">⚥ {profile?.gender}</span>
                        <span className="meta-item">📞 {profile?.contact}</span>
                    </div>
                    {profile?.address && (
                        <p className="profile-address">📍 {profile.address}</p>
                    )}
                </div>
                <button 
                    className="edit-profile-btn"
                    onClick={() => navigate('/patient/profile/edit')}
                >
                    ✏️ Edit Profile
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>Total Appointments</h3>
                        <p className="stat-number">{profile?.totalAppointments || 0}</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon">💊</div>
                    <div className="stat-content">
                        <h3>Prescriptions</h3>
                        <p className="stat-number">{profile?.totalPrescriptions || 0}</p>
                    </div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>Upcoming</h3>
                        <p className="stat-number">{upcomingAppointments.length}</p>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <h3>Medical History</h3>
                        <p className="stat-number">{profile?.medicalHistory?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                    <button 
                        className="action-card"
                        onClick={() => navigate('/patient/appointments')}
                    >
                        <span className="action-icon">📅</span>
                        <span>All Appointments</span>
                    </button>
                    <button 
                        className="action-card"
                        onClick={() => navigate('/patient/prescriptions')}
                    >
                        <span className="action-icon">💊</span>
                        <span>My Prescriptions</span>
                    </button>
                    <button 
                        className="action-card"
                        onClick={() => navigate('/patient/timeline')}
                    >
                        <span className="action-icon">📊</span>
                        <span>Health Timeline</span>
                    </button>
                    <button 
                        className="action-card ai"
                        onClick={() => navigate('/patient/ai-explain')}
                    >
                        <span className="action-icon">🤖</span>
                        <span>AI Health Guide</span>
                    </button>
                </div>
            </div>

            {/* Tabs for Appointments */}
            <div className="appointments-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Upcoming ({upcomingAppointments.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                    onClick={() => setActiveTab('past')}
                >
                    Past ({pastAppointments.length})
                </button>
            </div>

            {/* Appointments List */}
            <div className="appointments-section">
                {activeTab === 'upcoming' ? (
                    upcomingAppointments.length === 0 ? (
                        <div className="empty-state">
                            <p>No upcoming appointments</p>
                            <button 
                                className="book-btn"
                                onClick={() => navigate('/patient/book-appointment')}
                            >
                                Book Appointment
                            </button>
                        </div>
                    ) : (
                        <div className="appointments-list">
                            {upcomingAppointments.map(apt => (
                                <div key={apt._id} className="appointment-card upcoming">
                                    <div className="appointment-date-badge">
                                        <span className="day">
                                            {new Date(apt.date).toLocaleDateString('en-US', { day: 'numeric' })}
                                        </span>
                                        <span className="month">
                                            {new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="appointment-info">
                                        <h4>Dr. {apt.doctorId?.name}</h4>
                                        <p className="appointment-time">
                                            🕒 {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {apt.symptoms && (
                                            <p className="symptoms">Symptoms: {apt.symptoms}</p>
                                        )}
                                        <span className={`status-badge ${apt.status}`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                    <div className="appointment-actions">
                                        <button 
                                            className="reschedule-btn"
                                            onClick={() => navigate(`/patient/appointments/${apt._id}/reschedule`)}
                                        >
                                            Reschedule
                                        </button>
                                        <button 
                                            className="cancel-btn"
                                            onClick={() => handleCancelAppointment(apt._id)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    pastAppointments.length === 0 ? (
                        <div className="empty-state">
                            <p>No past appointments</p>
                        </div>
                    ) : (
                        <div className="appointments-list">
                            {pastAppointments.map(apt => (
                                <div key={apt._id} className="appointment-card past">
                                    <div className="appointment-date-badge past">
                                        <span className="day">
                                            {new Date(apt.date).toLocaleDateString('en-US', { day: 'numeric' })}
                                        </span>
                                        <span className="month">
                                            {new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="appointment-info">
                                        <h4>Dr. {apt.doctorId?.name}</h4>
                                        <p className="appointment-time">
                                            🕒 {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <span className={`status-badge ${apt.status}`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                    <div className="appointment-actions">
                                        <button 
                                            className="view-details-btn"
                                            onClick={() => navigate(`/patient/appointments/${apt._id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Recent Prescriptions */}
            <div className="prescriptions-section">
                <div className="section-header">
                    <h3>Recent Prescriptions</h3>
                    <button 
                        className="view-all-btn"
                        onClick={() => navigate('/patient/prescriptions')}
                    >
                        View All →
                    </button>
                </div>
                
                {prescriptions.length === 0 ? (
                    <div className="empty-state">
                        <p>No prescriptions yet</p>
                    </div>
                ) : (
                    <div className="prescriptions-grid">
                        {prescriptions.slice(0, 3).map(pres => (
                            <div key={pres._id} className="prescription-card">
                                <div className="prescription-header">
                                    <span className="pres-date">
                                        {new Date(pres.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="doctor-name">Dr. {pres.doctorId?.name}</span>
                                </div>
                                <p className="diagnosis">{pres.diagnosis || 'General Checkup'}</p>
                                <div className="medicines-count">
                                    💊 {pres.medicines?.length || 0} medicines
                                </div>
                                <div className="prescription-actions">
                                    <button 
                                        className="view-btn"
                                        onClick={() => navigate(`/patient/prescriptions/${pres._id}`)}
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        className="pdf-btn"
                                        onClick={() => handleDownloadPDF(pres._id)}
                                    >
                                        📥 PDF
                                    </button>
                                    <button 
                                        className="ai-explain-btn"
                                        onClick={() => navigate(`/patient/prescriptions/${pres._id}/explain`)}
                                    >
                                        🤖 Explain
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Health Timeline Preview */}
            <div className="timeline-preview">
                <div className="section-header">
                    <h3>Recent Health Activity</h3>
                    <button 
                        className="view-all-btn"
                        onClick={() => navigate('/patient/timeline')}
                    >
                        View Full Timeline →
                    </button>
                </div>
                
                <div className="timeline-list">
                    {timeline.slice(0, 5).map((item, index) => (
                        <div key={index} className="timeline-item">
                            <div className="timeline-icon">
                                {item.type === 'appointment' && '📅'}
                                {item.type === 'prescription' && '💊'}
                                {item.type === 'medical_history' && '📋'}
                            </div>
                            <div className="timeline-content">
                                <p className="timeline-title">{item.title}</p>
                                <p className="timeline-date">
                                    {new Date(item.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Health Assistant Card */}
            <div className="ai-assistant-card">
                <div className="ai-icon">🤖</div>
                <div className="ai-content">
                    <h3>AI Health Assistant</h3>
                    <p>Get simple explanations for your prescriptions and health advice</p>
                </div>
                <button 
                    className="ai-chat-btn"
                    onClick={() => navigate('/patient/ai-assistant')}
                >
                    Ask AI →
                </button>
            </div>
        </DashboardTemplate>
    );
};

export default PatientDashboard;