export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check karo ke user ke paas sahi role hai ya nahi
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `${req.user.role} role ko yeh access nahi hai. Sirf ${roles.join(", ")} ko ijazat hai`,
      });
    }
    next();
  };
};
