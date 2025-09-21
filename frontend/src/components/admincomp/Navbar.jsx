import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>Admin Panel</h2>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/home">Home</Link>
        </li>
        <li>
          <Link to="/admin/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/admin/users">Users</Link>
        </li>
        <li>
          <Link to="/admin/subdetails">Subscriber Details</Link>
        </li>
        <li>
          <Link to="/admin/player">Uploaded Movies</Link>
        </li>
        <li>
          <Link to="/admin/upload">Upload Movie</Link>
        </li>
        <li>
          <Link to="/serverupdate">Create/update plan</Link>
        </li>

        {/* Logout Button (No Dropdown) */}
        <li>
          <button onClick={handleLogout} className="navbar-logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
