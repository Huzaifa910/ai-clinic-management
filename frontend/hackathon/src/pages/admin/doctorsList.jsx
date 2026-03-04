import React, { useState, useEffect } from 'react';
import DashboardTemplate from '../../components/dashboard/dashboardTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './adminList.css';

const DoctorsList = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchDoctors();
    }, [page, search]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/doctors?page=${page}&limit=10&search=${search}`);
            setDoctors(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Fetch doctors error:', error);
            toast.error('Doctors load nahi ho sakay');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (doctorId) => {
        if (!window.confirm('Kya aap is doctor ko delete karna chahte hain?')) {
            return;
        }

        try {
            await api.delete(`/admin/users/${doctorId}`);
            toast.success('Doctor deleted successfully');
            fetchDoctors();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <DashboardTemplate title="Doctors Management" role="Admin">
            <div className="list-container">
                <div className="list-header">
                    <h2>All Doctors</h2>
                    <input
                        type="text"
                        placeholder="Search doctors..."
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
                                    <th>Email</th>
                                    <th>Appointments</th>
                                    <th>Prescriptions</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map(doctor => (
                                    <tr key={doctor._id}>
                                        <td>{doctor.name}</td>
                                        <td>{doctor.email}</td>
                                        <td>{doctor.stats?.totalAppointments || 0}</td>
                                        <td>{doctor.stats?.totalPrescriptions || 0}</td>
                                        <td>{new Date(doctor.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                onClick={() => handleDelete(doctor._id)}
                                                className="delete-btn"
                                            >
                                               🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pagination">
                            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </DashboardTemplate>
    );
};

export default DoctorsList;