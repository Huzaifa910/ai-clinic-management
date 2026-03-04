import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./LogoutButton.css";

const LogoutButton = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.success("Logout successful!");
        navigate("/login");
    };

    return (
        <button onClick={handleLogout} className="logout-btn">
            Logout
        </button>
    );
};

export default LogoutButton;