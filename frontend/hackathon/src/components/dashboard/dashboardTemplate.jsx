import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../common/LogoutButton";
import "./dashboardTemplate.css";

const DashboardTemplate = ({ title, role, children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    return (
        <div className="dashboard-container">
            {/* Navbar */}
            <nav className="dashboard-navbar">
                <div className="nav-content">
                    <div className="nav-left">
                        <h1>{title}</h1>
                    </div>
                    <div className="nav-right">
                        {user && (
                            <span className="user-info">
                                {user.name} ({role})
                            </span>
                        )}
                        <LogoutButton />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="main-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardTemplate;