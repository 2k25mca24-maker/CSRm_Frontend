import { useState } from "react";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import Booking from "./Booking.jsx";
import Admin from "./Admin.jsx";

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [page, setPage] = useState("login");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("login");
  };

  if (!user) {
    return page === "login"
      ? <Login onLogin={setUser} goRegister={() => setPage("register")} />
      : <Register goLogin={() => setPage("login")} />;
  }

  const userInitial = (user.username || "U").charAt(0).toUpperCase();

  return (
    <div className="app-layout">
      <header className="app-navbar">
        <div className="navbar-brand">
          <div className="brand-icon">🏛️</div>
          <div className="brand-info">
            <h1>Campus Resource Management</h1>
            <span>Smart Reservation & Allocation Portal</span>
          </div>
        </div>
        
        <div className="navbar-user">
          <div className="user-pill">
            <span className="user-avatar">{userInitial}</span>
            <span>{user.username}</span>
            <span className={`badge-role ${user.role}`}>{user.role}</span>
          </div>
          <button className="btn-logout" onClick={logout} title="Sign Out">
            <span>Logout</span> 🚪
          </button>
        </div>
      </header>

      <main className="app-main-content">
        {user.role === "ADMIN" ? <Admin /> : <Booking user={user} />}
      </main>
    </div>
  );
}

