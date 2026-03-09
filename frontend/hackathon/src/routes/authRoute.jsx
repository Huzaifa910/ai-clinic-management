import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Login from "../components/auth/login";

const AuthRoute = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (token) {
    const dashboardPath = `/${user.role}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  return <Login/>;
};

export default AuthRoute;
