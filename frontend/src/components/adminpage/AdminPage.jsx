import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../admincomp/Navbar";
import VideoUpload from "../admincomp/VideoUpload";
import VideoPlayer from "../admincomp/VideoPlayer";
import UserTable from "./UserTable";
import "./AdminPage.css";
import Dashboard from "../admincomp/Dashboard";
import MovieLibrary from "../admincomp/MovieLibrary";
import SubDetails from "../admincomp/SubDetails";
const AdminPage = () => {
  return (
    <div className="admin-page">
      <Navbar />
      <div className="dashboard-content">
        <Routes>
          {/* Redirect to Dashboard by default */}
          <Route
            path="/"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/movies" element={<MovieLibrary />} />
          <Route path="/users" element={<UserTable />} />
          <Route path="/subdetails" element={<SubDetails />} />
          <Route path="/upload" element={<VideoUpload />} />
          <Route path="/player" element={<VideoPlayer />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPage;
