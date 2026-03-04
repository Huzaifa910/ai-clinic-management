import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './PrescriptionsList.css';

const PrescriptionsList = () => {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPrescriptions();
    }, [page, search]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/prescriptions?page=${page}&limit=10&search=${search}`);
            setPrescriptions(response.data.prescriptions);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Fetch prescriptions error:', error);
            toast.error('Prescriptions load nahi ho sakay');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardTemplate title="My Prescriptions" role="Doctor">
            <div className="prescriptions-list-container">
                <div className="list-header">
                    <h2>All Prescriptions</h2>
                    <input
                        type="text"
                        placeholder="Search by patient name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading prescriptions...</p>
                    </div>
                ) : (
                    <>
                        <div className="prescriptions-grid">
                            {prescriptions.map((pres) => (
                                <div 
                                    key={pres._id} 
                                    className="prescription-card"
                                    onClick={() => navigate(`/doctor/prescriptions/${pres._id}`)}
                                >
                                    <div className="prescription-card-header">
                                        <span className="patient-name">{pres.patientId?.name}</span>
                                        <span className="prescription-date">
                                            {new Date(pres.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="prescription-card-body">
                                        <p className="diagnosis">{pres.diagnosis || 'No diagnosis'}</p>
                                        <div className="medicines-count">
                                            💊 {pres.medicines?.length || 0} medicines
                                        </div>
                                    </div>
                                    <div className="prescription-card-footer">
                                        <button className="view-btn">View Details →</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p-1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </DashboardTemplate>
    );
};

export default PrescriptionsList;