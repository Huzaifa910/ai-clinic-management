import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            toast.error("Email aur password dono likho");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/login", formData);
            const { token, user } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            toast.success("Login successful! 🎉");

            navigate(`/${user.role}/dashboard`);

        } catch (error) {
            const message = error.response?.data?.message || "Login failed";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                {/* Header */}
                <div className="login-header">
                    <h2>AI Clinic Management</h2>
                    <p>Apne account mein login karein</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your valid Email Address"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Sign In"}
                    </button>

                    <div className="register-link">
                        <p>
                            Naya account banana hai?{" "}
                            <Link to="/register">Register here</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;