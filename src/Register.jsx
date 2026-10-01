import { useState } from "react";
import api, { errMsg } from "./api";
import "./register.css";

export default function Register({ goLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setMsg("");
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { username, password, role });
      setMsg("Registration successful! Please wait for admin approval, then login.");
      setUsername("");
      setPassword("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h2>Create Account</h2>
          <p>Join the Campus Resource Portal</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {msg && (
            <div className="auth-success-banner">
              <span>✅</span>
              <span>{msg}</span>
            </div>
          )}

          {error && (
            <div className="auth-error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              className="auth-input"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="auth-input"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-role">Role</label>
            <select
              id="reg-role"
              className="auth-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="STUDENT">STUDENT</option>
              <option value="FACULTY">FACULTY</option>
            </select>
          </div>

          <button type="submit" className="btn-auth-submit-register" disabled={loading}>
            {loading ? "Creating Account..." : "Register Now"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <button type="button" className="auth-toggle-btn" onClick={goLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

