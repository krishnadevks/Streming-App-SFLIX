import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <ul className="sidebar__menu">
        <li>
          <Link to="/" className="sidebar__menu-item">
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/user-management" className="sidebar__menu-item">
            User Management
          </Link>
        </li>
        <li>
          <Link to="/movie-library" className="sidebar__menu-item">
            Movie Library
          </Link>
        </li>
        <li>
          <Link to="/analytics" className="sidebar__menu-item">
            Analytics
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
