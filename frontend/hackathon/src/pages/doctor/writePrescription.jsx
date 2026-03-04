import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './WritePrescription.css';

const WritePrescription = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const appointmentId = queryParams.get('appointment');
    const patientId = queryParams.get('patient');

    const [loading, setLoading] = useState(false);
    const [patient, setPatient] = useState(null);
    const [appointment, setAppointment] = useState(null);
    const [formData, setFormData] = useState({
        diagnosis: '',
        notes: '',
        followUpDate: '',
        medicines: [
            {
                name: '',
                dosage: '',
                frequency: '',
                duration: '',
                instructions: ''
            }
        ]
    });

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails();
        }
        if (appointmentId) {
            fetchAppointmentDetails();
        }
    }, [patientId, appointmentId]);

    const fetchPatientDetails = async () => {
        try {
            const response = await api.get(`/doctor/patients/${patientId}`);
            setPatient(response.data.data.patient);
        } catch (error) {
            console.error('Fetch patient error:', error);
            toast.error('Patient details load nahi ho sakay');
        }
    };

    const fetchAppointmentDetails = async () => {
        try {
            const response = await api.get(`/doctor/appointments/${appointmentId}`);
            setAppointment(response.data.data.appointment);
        } catch (error) {
            console.error('Fetch appointment error:', error);
        }
    };

    const handleMedicineChange = (index, field, value) => {
        const updatedMedicines = [...formData.medicines];
        updatedMedicines[index][field] = value;
        setFormData({ ...formData, medicines: updatedMedicines });
    };

    const addMedicine = () => {
        setFormData({
            ...formData,
            medicines: [
                ...formData.medicines,
                {
                    name: '',
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                }
            ]
        });
    };

    const removeMedicine = (index) => {
        if (formData.medicines.length === 1) {
            toast.error('Kam se kam ek medicine toh chahiye');
            return;
        }
        const updatedMedicines = formData.medicines.filter((_, i) => i !== index);
        setFormData({ ...formData, medicines: updatedMedicines });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.diagnosis) {
            toast.error('Diagnosis likhna zaroori hai');
            return;
        }

        const hasMedicine = formData.medicines.some(med => med.name && med.dosage);
        if (!hasMedicine) {
            toast.error('Kam se kam ek medicine to add karo');
            return;
        }

        setLoading(true);

        try {
            const prescriptionData = {
                appointmentId,
                patientId,
                diagnosis: formData.diagnosis,
                notes: formData.notes,
                followUpDate: formData.followUpDate || null,
                medicines: formData.medicines.filter(med => med.name && med.dosage)
            };

            const response = await api.post('/prescriptions', prescriptionData);
            
            toast.success('Prescription successfully likh diya gaya! 🎉');
            
            // Redirect to prescription view
            navigate(`/doctor/prescriptions/${response.data.prescription._id}`);

        } catch (error) {
            console.error('Save prescription error:', error);
            toast.error(error.response?.data?.message || 'Prescription save nahi ho saka');
        } finally {
            setLoading(false);
        }
    };

    if (!patient) {
        return (
            <DashboardTemplate title="Write Prescription" role="Doctor">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading patient data...</p>
                </div>
            </DashboardTemplate>
        );
    }

    return (
        <DashboardTemplate title="Write Prescription" role="Doctor">
            <div className="prescription-container">
                {/* Header */}
                <div className="prescription-header">
                    <button 
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                    <h2>Write Prescription</h2>
                </div>

                {/* Patient Info Card */}
                <div className="patient-info-card">
                    <h3>Patient Information</h3>
                    <div className="patient-details">
                        <div className="detail-row">
                            <span className="label">Name:</span>
                            <span className="value">{patient.name}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Age/Gender:</span>
                            <span className="value">{patient.age} years / {patient.gender}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Contact:</span>
                            <span className="value">{patient.contact}</span>
                        </div>
                        {appointment?.symptoms && (
                            <div className="detail-row">
                                <span className="label">Symptoms:</span>
                                <span className="value">{appointment.symptoms}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prescription Form */}
                <form onSubmit={handleSubmit} className="prescription-form">
                    {/* Diagnosis */}
                    <div className="form-section">
                        <label htmlFor="diagnosis">Diagnosis *</label>
                        <textarea
                            id="diagnosis"
                            rows="3"
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            placeholder="e.g., Viral Fever, Hypertension, Diabetes..."
                            required
                        />
                    </div>

                    {/* Medicines */}
                    <div className="form-section">
                        <div className="section-header">
                            <label>Medicines *</label>
                            <button 
                                type="button" 
                                className="add-btn"
                                onClick={addMedicine}
                            >
                                + Add Medicine
                            </button>
                        </div>

                        {formData.medicines.map((medicine, index) => (
                            <div key={index} className="medicine-card">
                                <div className="medicine-header">
                                    <h4>Medicine #{index + 1}</h4>
                                    <button 
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeMedicine(index)}
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                <div className="medicine-grid">
                                    <div className="form-group">
                                        <label>Name *</label>
                                        <input
                                            type="text"
                                            value={medicine.name}
                                            onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                            placeholder="e.g., Panadol"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Dosage *</label>
                                        <input
                                            type="text"
                                            value={medicine.dosage}
                                            onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                            placeholder="e.g., 500mg"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Frequency</label>
                                        <input
                                            type="text"
                                            value={medicine.frequency}
                                            onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                            placeholder="e.g., Twice daily"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Duration</label>
                                        <input
                                            type="text"
                                            value={medicine.duration}
                                            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                            placeholder="e.g., 5 days"
                                        />
                                    </div>
                                    
                                    <div className="form-group full-width">
                                        <label>Instructions</label>
                                        <input
                                            type="text"
                                            value={medicine.instructions}
                                            onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                            placeholder="e.g., After meals"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Notes */}
                    <div className="form-section">
                        <label htmlFor="notes">Additional Notes</label>
                        <textarea
                            id="notes"
                            rows="2"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any special instructions..."
                        />
                    </div>

                    {/* Follow-up Date */}
                    <div className="form-section">
                        <label htmlFor="followUpDate">Follow-up Date</label>
                        <input
                            type="date"
                            id="followUpDate"
                            value={formData.followUpDate}
                            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button 
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Prescription'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardTemplate>
    );
};

export default WritePrescription;