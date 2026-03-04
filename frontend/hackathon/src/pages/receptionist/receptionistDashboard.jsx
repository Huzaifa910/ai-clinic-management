import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './receptionistDashboard.css';

const ReceptionistDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        newPatients: 0
    });
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [newPatient, setNewPatient] = useState({
        name: '',
        age: '',
        gender: 'Male',
        contact: '',
        address: ''
    });
    const [newAppointment, setNewAppointment] = useState({
        patientId: '',
        doctorId: '',
        date: '',
        symptoms: ''
    });

    useEffect(() => {
        fetchDashboardData();
        fetchDoctors();
        fetchPatients();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Get today's appointments
            const today = new Date().toISOString().split('T')[0];
            const appointmentsRes = await api.get(`/appointments/today`);
            setTodayAppointments(appointmentsRes.data.all || []);
            
            // Calculate stats
            const all = appointmentsRes.data.all || [];
            setStats({
                totalAppointments: all.length,
                completedAppointments: all.filter(a => a.status === 'completed').length,
                pendingAppointments: all.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
                newPatients: 0 // Will implement later
            });
        } catch (error) {
            console.error('Dashboard data error:', error);
            toast.error('Dashboard data load nahi ho saka');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/admin/doctors?limit=100');
            setDoctors(response.data.data || []);
        } catch (error) {
            console.error('Fetch doctors error:', error);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients?limit=100');
            setPatients(response.data.patients || []);
        } catch (error) {
            console.error('Fetch patients error:', error);
        }
    };

    const handleNewPatient = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/patients', newPatient);
            toast.success('Patient registered successfully!');
            setShowNewPatientForm(false);
            setNewPatient({ name: '', age: '', gender: 'Male', contact: '', address: '' });
            fetchPatients(); // Refresh patients list
            fetchDashboardData(); // Refresh stats
        } catch (error) {
            console.error('Register patient error:', error);
            toast.error(error.response?.data?.message || 'Patient register nahi ho saka');
        }
    };

    const handleNewAppointment = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/appointments', newAppointment);
            toast.success('Appointment booked successfully!');
            setShowNewAppointmentForm(false);
            setNewAppointment({ patientId: '', doctorId: '', date: '', symptoms: '' });
            fetchDashboardData(); // Refresh appointments
        } catch (error) {
            console.error('Book appointment error:', error);
            toast.error(error.response?.data?.message || 'Appointment book nahi ho saka');
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('Kya aap is appointment ko cancel karna chahte hain?')) return;
        
        try {
            await api.patch(`/appointments/${appointmentId}/cancel`);
            toast.success('Appointment cancelled');
            fetchDashboardData();
        } catch (error) {
            toast.error('Cancel nahi ho saka');
        }
    };

    const handleUpdatePatient = (patientId) => {
        navigate(`/receptionist/patients/${patientId}/edit`);
    };

    if (loading) {
        return (
            <DashboardTemplate title="Receptionist Dashboard" role="Receptionist">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </DashboardTemplate>
        );
    }

    return (
        <DashboardTemplate title="Receptionist Dashboard" role="Receptionist">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h2>Welcome, Receptionist! 👩‍💼</h2>
                <p>Manage today's schedule and patient registrations.</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>Today's Appointments</h3>
                        <p className="stat-number">{stats.totalAppointments}</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>Completed</h3>
                        <p className="stat-number">{stats.completedAppointments}</p>
                    </div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>Pending</h3>
                        <p className="stat-number">{stats.pendingAppointments}</p>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon">👤</div>
                    <div className="stat-content">
                        <h3>New Patients</h3>
                        <p className="stat-number">{stats.newPatients}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                    <button 
                        className="action-card primary"
                        onClick={() => setShowNewPatientForm(true)}
                    >
                        <span className="action-icon">👤+</span>
                        <span>Register Patient</span>
                    </button>
                    <button 
                        className="action-card success"
                        onClick={() => setShowNewAppointmentForm(true)}
                    >
                        <span className="action-icon">📅+</span>
                        <span>Book Appointment</span>
                    </button>
                    <button 
                        className="action-card info"
                        onClick={() => navigate('/receptionist/patients')}
                    >
                        <span className="action-icon">📋</span>
                        <span>All Patients</span>
                    </button>
                    <button 
                        className="action-card warning"
                        onClick={() => navigate('/receptionist/schedule')}
                    >
                        <span className="action-icon">🗓️</span>
                        <span>Full Schedule</span>
                    </button>
                </div>
            </div>

            {/* Today's Appointments */}
            <div className="appointments-section">
                <h3>Today's Appointments</h3>
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
                                    <p>Dr. {apt.doctorId?.name}</p>
                                    {apt.symptoms && <p className="symptoms">"{apt.symptoms}"</p>}
                                </div>
                                <div className="appointment-status">
                                    <span className={`status-badge ${apt.status}`}>
                                        {apt.status}
                                    </span>
                                </div>
                                <div className="appointment-actions">
                                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                        <button 
                                            className="action-btn cancel"
                                            onClick={() => handleCancelAppointment(apt._id)}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Patient Modal */}
            {showNewPatientForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Register New Patient</h2>
                        <form onSubmit={handleNewPatient}>
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={newPatient.name}
                                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Age *</label>
                                    <input
                                        type="number"
                                        value={newPatient.age}
                                        onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Gender *</label>
                                    <select
                                        value={newPatient.gender}
                                        onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contact Number *</label>
                                <input
                                    type="tel"
                                    value={newPatient.contact}
                                    onChange={(e) => setNewPatient({...newPatient, contact: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    value={newPatient.address}
                                    onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                                    rows="2"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowNewPatientForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary">
                                    Register Patient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Appointment Modal */}
            {showNewAppointmentForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Book New Appointment</h2>
                        <form onSubmit={handleNewAppointment}>
                            <div className="form-group">
                                <label>Select Patient *</label>
                                <select
                                    value={newAppointment.patientId}
                                    onChange={(e) => setNewAppointment({...newAppointment, patientId: e.target.value})}
                                    required
                                >
                                    <option value="">Choose patient...</option>
                                    {patients.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} - {p.contact}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Select Doctor *</label>
                                <select
                                    value={newAppointment.doctorId}
                                    onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value})}
                                    required
                                >
                                    <option value="">Choose doctor...</option>
                                    {doctors.map(d => (
                                        <option key={d._id} value={d._id}>
                                            Dr. {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={newAppointment.date}
                                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Symptoms</label>
                                <textarea
                                    value={newAppointment.symptoms}
                                    onChange={(e) => setNewAppointment({...newAppointment, symptoms: e.target.value})}
                                    rows="2"
                                    placeholder="e.g., Fever, cough, headache..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowNewAppointmentForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary">
                                    Book Appointment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardTemplate>
    );
};

export default ReceptionistDashboard;