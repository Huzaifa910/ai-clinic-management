import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './PrescriptionView.css';

const PrescriptionView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [prescription, setPrescription] = useState(null);

    useEffect(() => {
        fetchPrescription();
    }, [id]);

    const fetchPrescription = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/prescriptions/${id}`);
            console.log('Prescription:', response.data);
            setPrescription(response.data.prescription);
        } catch (error) {
            console.error('Fetch prescription error:', error);
            toast.error('Prescription load nahi ho saka');
            navigate('/doctor/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await api.get(`/prescriptions/${id}/pdf`, {
                responseType: 'blob'
            });
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `prescription_${id}.pdf`);
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
            <DashboardTemplate title="Prescription Details" role="Doctor">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading prescription details...</p>
                </div>
            </DashboardTemplate>
        );
    }

    if (!prescription) {
        return (
            <DashboardTemplate title="Prescription Details" role="Doctor">
                <div className="error-container">
                    <p>Prescription nahi mila</p>
                    <button onClick={() => navigate('/doctor/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </DashboardTemplate>
        );
    }

    return (
        <DashboardTemplate title="Prescription Details" role="Doctor">
            <div className="prescription-view-container">
                {/* Header with actions */}
                <div className="view-header">
                    <button 
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                    <h2>Prescription Details</h2>
                    <div className="header-actions">
                        <button 
                            className="edit-btn"
                            onClick={() => navigate(`/doctor/prescription/edit/${id}`)}
                        >
                            ✏️ Edit
                        </button>
                        <button 
                            className="pdf-btn"
                            onClick={handleDownloadPDF}
                        >
                            📥 Download PDF
                        </button>
                    </div>
                </div>

                {/* Prescription Card */}
                <div className="prescription-card">
                    {/* Clinic Header */}
                    <div className="prescription-header">
                        <h1>AI Clinic Management</h1>
                        <p className="prescription-id">Prescription #{prescription._id.slice(-6)}</p>
                    </div>

                    {/* Date */}
                    <div className="prescription-date">
                        Date: {new Date(prescription.createdAt).toLocaleDateString()}
                    </div>

                    {/* Patient & Doctor Info */}
                    <div className="info-section">
                        <div className="info-row">
                            <div className="info-box">
                                <label>Patient Name</label>
                                <p>{prescription.patientId?.name}</p>
                            </div>
                            <div className="info-box">
                                <label>Age / Gender</label>
                                <p>{prescription.patientId?.age} years / {prescription.patientId?.gender}</p>
                            </div>
                        </div>
                        <div className="info-row">
                            <div className="info-box">
                                <label>Doctor</label>
                                <p>Dr. {prescription.doctorId?.name}</p>
                            </div>
                            <div className="info-box">
                                <label>Contact</label>
                                <p>{prescription.patientId?.contact}</p>
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="diagnosis-section">
                        <h3>Diagnosis</h3>
                        <p>{prescription.diagnosis || 'Not specified'}</p>
                    </div>

                    {/* Medicines */}
                    <div className="medicines-section">
                        <h3>Prescribed Medicines</h3>
                        <table className="medicines-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Medicine</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Instructions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescription.medicines?.map((medicine, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{medicine.name}</td>
                                        <td>{medicine.dosage}</td>
                                        <td>{medicine.frequency}</td>
                                        <td>{medicine.duration}</td>
                                        <td>{medicine.instructions || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Additional Notes */}
                    {prescription.notes && (
                        <div className="notes-section">
                            <h3>Additional Notes</h3>
                            <p>{prescription.notes}</p>
                        </div>
                    )}

                    {/* Follow-up Date */}
                    {prescription.followUpDate && (
                        <div className="followup-section">
                            <h3>Follow-up Date</h3>
                            <p>{new Date(prescription.followUpDate).toLocaleDateString()}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="prescription-footer">
                        <p>This is a computer generated prescription.</p>
                        <p>Valid only with doctor's signature.</p>
                    </div>
                </div>

                {/* Appointment Info */}
                {prescription.appointmentId && (
                    <div className="appointment-info-card">
                        <h3>Appointment Details</h3>
                        <p>Date: {new Date(prescription.appointmentId.date).toLocaleDateString()}</p>
                        <p>Symptoms: {prescription.appointmentId.symptoms || 'Not recorded'}</p>
                    </div>
                )}
            </div>
        </DashboardTemplate>
    );
};

export default PrescriptionView;