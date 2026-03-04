import React, { useState, useEffect } from 'react';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './adminList.css';

const PatientsList = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPatients();
    }, [page, search]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/patients?page=${page}&limit=10&search=${search}`);
            setPatients(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Fetch patients error:', error);
            toast.error('Patients load nahi ho sakay');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (patientId) => {
        if (!window.confirm('Kya aap is patient ko delete karna chahte hain?')) {
            return;
        }

        try {
            await api.delete(`/admin/patients/${patientId}`);
            toast.success('Patient deleted successfully');
            fetchPatients(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <DashboardTemplate title="Patients Management" role="Admin">
            <div className="list-container">
                <div className="list-header">
                    <h2>All Patients</h2>
                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                {loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : (
                    <>
                        <table className="list-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Contact</th>
                                    <th>Created By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map(patient => (
                                    <tr key={patient._id}>
                                        <td>{patient.name}</td>
                                        <td>{patient.age}</td>
                                        <td>{patient.gender}</td>
                                        <td>{patient.contact}</td>
                                        <td>{patient.createdBy?.name || 'N/A'}</td>
                                        <td>
                                            <button 
                                                onClick={() => handleDelete(patient._id)}
                                                className="delete-btn"
                                            >
                                               🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

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

export default PatientsList;