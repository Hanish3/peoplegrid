import React, { useState } from 'react';
import axios from 'axios'; // Import axios
import './LoginPage.css';

function LoginPage({ onLoginSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(''); // State to hold error messages

  // Make the function async to handle API calls
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // The URL for our backend API
    const backendUrl = 'http://localhost:3001/api/auth';

    try {
      if (isLoginView) {
        // --- REAL LOGIN API CALL ---
        const response = await axios.post(`${backendUrl}/login`, {
          email,
          password,
        });
        // Pass the token up to the main App component
        onLoginSuccess(response.data.token);
      } else {
        // --- REAL REGISTER API CALL ---
        await axios.post(`${backendUrl}/register`, {
          username,
          email,
          password,
        });
        // After successful registration, automatically log them in
        const response = await axios.post(`${backendUrl}/login`, {
          email,
          password,
        });
        onLoginSuccess(response.data.token);
      }
    } catch (err) {
      // If the backend sends an error, display it
      setError(err.response?.data?.error || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-logo">PeopleGrid</h1>
        <p className="login-tagline">Connect with your NIAT community</p>

        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Display error message if it exists */}
          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-btn">
            {isLoginView ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="toggle-view" onClick={() => setIsLoginView(!isLoginView)}>
          {isLoginView
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Log In'}
        </p>
      </div>
    </div>
  );
}

export default LoginPage;