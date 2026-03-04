import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  try {
    // 1. Token check karo header mein
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please Login First ! Token is not found...",
      });
    }

    // 2. Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. User info request mein attach karo
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token is not valid or expired.",
    });
  }
};
  