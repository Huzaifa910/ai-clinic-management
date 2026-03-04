import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './AdminList.css';

const ReceptionistsList = () => {
    const navigate = useNavigate();
    const [receptionists, setReceptionists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchReceptionists();
    }, [page, search]);

    const fetchReceptionists = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/receptionists?page=${page}&limit=10&search=${search}`);
            console.log('Receptionists data:', response.data);
            setReceptionists(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Fetch receptionists error:', error);
            toast.error('Receptionists load nahi ho sakay');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (receptionistId) => {
        if (!window.confirm('Kya aap is receptionist ko delete karna chahte hain?')) {
            return;
        }

        try {
            await api.delete(`/admin/receptionists/${receptionistId}`);
            toast.success('Receptionist deleted successfully');
            fetchReceptionists(); // Refresh list
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <DashboardTemplate title="Receptionists Management" role="Admin">
            <div className="list-container">
                <div className="list-header">
                    <div className="header-left">
                        <h2>All Receptionists</h2>
                        <button 
                            className="back-btn"
                            onClick={() => navigate('/admin/dashboard')}
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search receptionists..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading receptionists...</p>
                    </div>
                ) : (
                    <>
                        {receptionists.length === 0 ? (
                            <div className="no-data">
                                <p>No receptionists found</p>
                            </div>
                        ) : (
                            <table className="list-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Patients Registered</th>
                                        <th>Appointments Created</th>
                                        <th>Joined Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receptionists.map(rec => (
                                        <tr key={rec._id}>
                                            <td>
                                                <div className="user-info">
                                                    <span className="user-name">{rec.name}</span>
                                                </div>
                                            </td>
                                            <td>{rec.email}</td>
                                            <td>
                                                <span className="badge blue">
                                                    {rec.stats?.totalPatients || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge green">
                                                    {rec.stats?.totalAppointments || 0}
                                                </span>
                                            </td>
                                            <td>{new Date(rec.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button 
                                                    onClick={() => handleDelete(rec._id)}
                                                    className="delete-btn"
                                                    title="Delete receptionist"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination */}
                        {receptionists.length > 0 && (
                            <div className="pagination">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p-1))}
                                    disabled={page === 1}
                                >
                                    ← Previous
                                </button>
                                <span>Page {page} of {totalPages}</span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p+1))}
                                    disabled={page === totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardTemplate>
    );
};

export default ReceptionistsList;