import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const authRoutes = express.Router();

// Public routes
authRoutes.post("/register", register);
authRoutes.post("/login", login);

// Protected route
authRoutes.get("/me", protect, getMe);

export default authRoutes;