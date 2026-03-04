import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './doctorDashboard.css'; 

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        overview: {
            todayAppointments: 0,
            upcomingAppointments: 0,
            monthlyAppointments: 0,
            totalPatients: 0,
            totalPrescriptions: 0,
            completionRate: 0
        },
        recentPatients: []
    });
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [recentPrescriptions, setRecentPrescriptions] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Parallel API calls - ab 3 calls
            const [statsRes, appointmentsRes, prescriptionsRes] = await Promise.all([
                api.get('/doctor/stats'),
                api.get('/doctor/appointments?status=pending,confirmed&limit=5'),
                api.get('/prescriptions?limit=3') // Recent 3 prescriptions
            ]);

            console.log('Stats:', statsRes.data);
            console.log('Appointments:', appointmentsRes.data);
            console.log('Prescriptions:', prescriptionsRes.data);

            setStats(statsRes.data.data);
            setTodayAppointments(appointmentsRes.data.data);
            setRecentPrescriptions(prescriptionsRes.data.prescriptions || []);
        } catch (error) {
            console.error('Dashboard data error:', error);
            toast.error('Dashboard data load nahi ho saka');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            await api.patch(`/doctor/appointments/${appointmentId}/status`, {
                status: newStatus
            });
            toast.success(`Appointment ${newStatus} kar diya gaya`);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            toast.error('Status change nahi ho saka');
        }
    };

    const handleDownloadPDF = async (prescriptionId) => {
        try {
            const response = await api.get(`/prescriptions/${prescriptionId}/pdf`, {
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
            console.error('Download PDF error:', error);
            toast.error('PDF download nahi ho saka');
        }
    };

    if (loading) {
        return (
            <DashboardTemplate title="Doctor Dashboard" role="Doctor">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading dashboard data...</p>
                </div>
            </DashboardTemplate>
        );
    }

    return (
        <DashboardTemplate title="Doctor Dashboard" role="Doctor">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h2>Welcome back, Doctor! 👨‍⚕️</h2>
                <p>Here's your practice overview for today.</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card blue" onClick={() => navigate('/doctor/appointments')} style={{cursor: 'pointer'}}>
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>Today's Appointments</h3>
                        <p className="stat-number">{stats.overview.todayAppointments}</p>
                        <p className="stat-trend">Click to view all →</p>
                    </div>
                </div>

                <div className="stat-card green" onClick={() => navigate('/doctor/appointments?status=upcoming')} style={{cursor: 'pointer'}}>
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>Upcoming</h3>
                        <p className="stat-number">{stats.overview.upcomingAppointments}</p>
                        <p className="stat-trend">Future appointments</p>
                    </div>
                </div>

                <div className="stat-card orange" onClick={() => navigate('/doctor/patients')} style={{cursor: 'pointer'}}>
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>Total Patients</h3>
                        <p className="stat-number">{stats.overview.totalPatients}</p>
                        <p className="stat-trend">Unique patients</p>
                    </div>
                </div>

                <div className="stat-card purple" onClick={() => navigate('/doctor/prescriptions')} style={{cursor: 'pointer'}}>
                    <div className="stat-icon">💊</div>
                    <div className="stat-content">
                        <h3>Prescriptions</h3>
                        <p className="stat-number">{stats.overview.totalPrescriptions}</p>
                        <p className="stat-trend">Total written</p>
                    </div>
                </div>
            </div>

            {/* Today's Appointments */}
            <div className="appointments-section">
                <div className="section-header">
                    <h3>Today's Appointments</h3>
                    <button 
                        className="view-all-btn"
                        onClick={() => navigate('/doctor/appointments')}
                    >
                        View All →
                    </button>
                </div>

                {todayAppointments.length === 0 ? (
                    <div className="no-appointments">
                        <p>No appointments for today</p>
                    </div>
                ) : (
                    <div className="appointments-list">
                        {todayAppointments.map(apt => (
                            <div key={apt._id} className="appointment-card">
                                <div className="appointment-time">
                                    {new Date(apt.date).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </div>
                                <div className="appointment-info">
                                    <h4>{apt.patientId?.name}</h4>
                                    <p>Age: {apt.patientId?.age} | {apt.patientId?.gender}</p>
                                    {apt.symptoms && (
                                        <p className="symptoms">Symptoms: {apt.symptoms}</p>
                                    )}
                                </div>
                                <div className="appointment-status">
                                    <span className={`status-badge ${apt.status}`}>
                                        {apt.status}
                                    </span>
                                </div>
                                <div className="appointment-actions">
                                    <button 
                                        className="action-btn view"
                                        onClick={() => navigate(`/doctor/appointments/${apt._id}`)}
                                    >
                                        View
                                    </button>
                                    {apt.status === 'pending' && (
                                        <button 
                                            className="action-btn confirm"
                                            onClick={() => handleStatusChange(apt._id, 'confirmed')}
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {apt.status === 'confirmed' && (
                                        <button 
                                            className="action-btn complete"
                                            onClick={() => navigate(`/doctor/prescription/new?appointment=${apt._id}&patient=${apt.patientId?._id}`)}
                                        >
                                            Write Rx
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Patients */}
            <div className="recent-patients-section">
                <h3>Recent Patients</h3>
                <div className="patients-grid">
                    {stats.recentPatients.map((patient, index) => (
                        <div 
                            key={index} 
                            className="patient-card"
                            onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                        >
                            <div className="patient-avatar">
                                {patient.name?.charAt(0)}
                            </div>
                            <div className="patient-info">
                                <h4>{patient.name}</h4>
                                <p>{patient.age} years • {patient.gender}</p>
                                <p className="patient-contact">{patient.contact}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Prescriptions - Naya Section */}
            <div className="recent-prescriptions-section">
                <div className="section-header">
                    <h3>Recent Prescriptions</h3>
                    <button 
                        className="view-all-btn"
                        onClick={() => navigate('/doctor/prescriptions')}
                    >
                        View All →
                    </button>
                </div>

                {recentPrescriptions.length === 0 ? (
                    <div className="no-prescriptions">
                        <p>No prescriptions yet</p>
                        <button 
                            className="write-first-btn"
                            onClick={() => navigate('/doctor/prescription/new')}
                        >
                            Write First Prescription
                        </button>
                    </div>
                ) : (
                    <div className="prescriptions-mini-list">
                        {recentPrescriptions.map(pres => (
                            <div key={pres._id} className="prescription-mini-card">
                                <div className="pres-mini-header">
                                    <span className="patient-name">{pres.patientId?.name}</span>
                                    <span className="pres-date">
                                        {new Date(pres.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="pres-diagnosis">{pres.diagnosis || 'No diagnosis'}</p>
                                <div className="pres-mini-actions">
                                    <button 
                                        className="mini-view-btn"
                                        onClick={() => navigate(`/doctor/prescriptions/${pres._id}`)}
                                    >
                                        View
                                    </button>
                                    <button 
                                        className="mini-pdf-btn"
                                        onClick={() => handleDownloadPDF(pres._id)}
                                    >
                                        PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions - Updated with all prescription features */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                    <button 
                        className="action-card"
                        onClick={() => navigate('/doctor/appointments/')}
                    >
                        <span className="action-icon">📋</span>
                        <span>All Appointments</span>
                    </button>
                    
                    <button 
                        className="action-card"
                        onClick={() => navigate('/doctor/patients/search')}
                    >
                        <span className="action-icon">🔍</span>
                        <span>Search Patient</span>
                    </button>
                    
                    {/* ✅ Updated Prescription Actions */}
                    <button 
                        className="action-card prescription"
                        onClick={() => navigate('/doctor/prescriptions')}
                    >
                        <span className="action-icon">📚</span>
                        <span>All Prescriptions</span>
                        <small>View history</small>
                    </button>
                    
                    <button 
                        className="action-card write-prescription"
                        onClick={() => navigate('/doctor/prescription/new')}
                    >
                        <span className="action-icon">✍️</span>
                        <span>Write New</span>
                        <small>Create prescription</small>
                    </button>
                    
                    {/* <button 
                        className="action-card ai"
                        onClick={() => navigate('/doctor/ai-symptom-checker')}
                    >
                        <span className="action-icon">🤖</span>
                        <span>AI Symptom Checker</span>
                    </button> */}
                </div>
            </div>
        </DashboardTemplate>
    );
};

export default DoctorDashboard;