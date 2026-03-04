import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// route:   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation - required fields check
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: "Required fields are empty : name, email, password, role" 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Email Address already existed!" 
            });
        }

        // Password hash karo (encrypt)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Naya user create karo
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        // JWT token banao (user ko login rakhne ke liye)
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" } 
        );

        // Password ko response se hatao
        user.password = undefined;

        res.status(201).json({
            success: true,
            message: "You are Resgistered! Welcome 🎉",
            token,
            user
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error. Thodi der baad try karo" 
        });
    }
};

// @desc    Login karo existing user
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Required fields are missing!" 
            });
        }

        // User find karo email se
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid Email or Password!" 
            });
        }

        // Password compare karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid Email or Password!" 
            });
        }

        // Token banao
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Password ko response se hatao
        user.password = undefined;

        res.json({
            success: true,
            message: "Login successful! 🎉",
            token,
            user
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error. Thodi der baad try karo" 
        });
    }
};

// @desc    Current logged in user ki info
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        // req.user.id middleware ne attach kiya tha
        const user = await User.findById(req.user.id).select("-password");
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found!" 
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get me error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};