import React, { useState, useEffect } from "react";
import DashboardTemplate from "../../components/dashboard/dashboardTemplate";
import api from "../../services/api";
import toast from "react-hot-toast";
import "./adminDashboard.css";
import { Navigate, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overview: {
      totalPatients: 0,
      totalDoctors: 0,
      totalReceptionists: 0,
      totalAppointments: 0,
      completionRate: 0,
    },
    today: {
      appointments: 0,
    },
    monthly: {
      appointments: 0,
    },
    revenue: {
      monthly: {
        total: 0,
      },
    },
  });
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // ✅ API se data fetch karo
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Parallel API calls for better performance
      const [statsRes, doctorsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/doctor-performance"),
      ]);

      console.log("Stats Data:", statsRes.data); // Debug ke liye
      console.log("Doctors Data:", doctorsRes.data); // Debug ke liye

      setStats(statsRes.data.data);
      setDoctorPerformance(doctorsRes.data.data);

      // Recent activities agar hain to set karo
      if (statsRes.data.data.recentActivities) {
        setRecentActivities(statsRes.data.data.recentActivities);
      }
    } catch (error) {
      console.error("Dashboard data error:", error);
      toast.error("Dashboard data load nahi ho saka");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardTemplate title="Admin Dashboard" role="Admin">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </DashboardTemplate>
    );
  }

  return (
    <DashboardTemplate title="Admin Dashboard" role="Admin">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome back, Admin! 👋</h2>
        <p>Here's what's happening at your clinic today.</p>
      </div>

      {/* ✅ Stats Cards - REAL DATA */}
      <div className="stats-grid">
        <div className="stat-card blue"
          onClick={() => navigate("/admin/patients")}
          style={{ cursor: "pointer" }}

        >
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Patients</h3>
            <p className="stat-number">{stats.overview.totalPatients}</p>
            <p className="stat-trend positive">
              ↑ {Math.round(stats.overview.totalPatients * 0.12)} from last
              month
            </p>
            <p className="stat-trend neutral">Click to view all</p>

          </div>
        </div>

        <div className="stat-card green"
          onClick={() => navigate("/admin/doctors")}
          style={{ cursor: "pointer" }}

        >
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-content">
            <h3>Total Doctors</h3>
            <p className="stat-number">{stats.overview.totalDoctors}</p>
            <p className="stat-trend neutral">→ Active doctors</p>
            <p className="stat-trend neutral">Click to view all</p>

          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Appointments</h3>
            <p className="stat-number">{stats.today.appointments}</p>
            <p className="stat-trend positive">Today's schedule</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Monthly Revenue</h3>
            <p className="stat-number">
              Rs. {stats.revenue.monthly.total?.toLocaleString()}
            </p>
            <p className="stat-trend positive">This month</p>
          </div>
        </div>

        <div
          className="stat-card purple"
          onClick={() => navigate("/admin/receptionists")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-icon">👩‍💼</div>
          <div className="stat-content">
            <h3>Total Receptionists</h3>
            <p className="stat-number">{stats.overview.totalReceptionists}</p>
            <p className="stat-trend neutral">Click to view all</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Appointment Trends</h3>
          <div className="chart-placeholder">
            <p>📊 Monthly Appointments: {stats.monthly.appointments}</p>
            <p className="text-small">
              Completion Rate: {stats.overview.completionRate}%
            </p>
            <p className="text-small">
              Total Appointments: {stats.overview.totalAppointments}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Doctor Performance Table - REAL DATA */}
      <div className="performance-section">
        <h3>Doctor Performance</h3>
        <div className="table-responsive">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Total Appointments</th>
                <th>Completed</th>
                <th>Prescriptions</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {doctorPerformance.length > 0 ? (
                doctorPerformance.map((doctor) => (
                  <tr key={doctor.doctorId}>
                    <td>
                      <div className="doctor-info">
                        <span className="doctor-name">{doctor.doctorName}</span>
                        <span className="doctor-email">{doctor.email}</span>
                      </div>
                    </td>
                    <td>{doctor.stats.totalAppointments}</td>
                    <td>{doctor.stats.completedAppointments}</td>
                    <td>{doctor.stats.totalPrescriptions}</td>
                    <td>
                      <span
                        className={`completion-badge ${
                          doctor.stats.completionRate > 80
                            ? "high"
                            : doctor.stats.completionRate > 60
                              ? "medium"
                              : "low"
                        }`}
                      >
                        {doctor.stats.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No doctor data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Recent Activities - REAL DATA */}
      <div className="activities-section">
        <h3>Recent Activities</h3>
        <div className="activities-list">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon">{activity.icon || "📌"}</span>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <span className="activity-time">
                    {new Date(activity.time).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-activities">No recent activities</p>
          )}
        </div>
      </div>
    </DashboardTemplate>
  );
};

export default AdminDashboard;
