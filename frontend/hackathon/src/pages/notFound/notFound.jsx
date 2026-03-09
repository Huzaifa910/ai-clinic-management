import React from 'react';
import { useNavigate } from 'react-router-dom';
import './notFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          Oops! The page you are looking for does not exist or has been moved.
        </p>
        
        <div className="error-actions">
          {/* <button 
            className="home-btn"
            onClick={() => navigate('/')}
          >
            🏠 Go to Home
          </button> */}
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            🔙 Go Back
          </button>
        </div>

        
      </div>

      {/* Decorative Elements */}
      <div className="circle circle-1"></div>
      <div className="circle circle-2"></div>
      <div className="circle circle-3"></div>
    </div>
  );
};

export default NotFound;