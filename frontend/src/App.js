import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import AdminPage from "./components/adminpage/AdminPage";
import Home from "./components/usercomp/Home";
import Checkout from "./components/Subscription/Checkout";
import Profile from "./components/usercomp/Profile";
import History from "./components/usercomp/History";
import Success from "./components/Subscription/PaymentSuccess";
import ServiceUpdate from "./components/Subscription/ServiceUpdate";

const App = () => {
  return (
    <BrowserRouter>
      {/* Main Routes Configuration */}
      <Routes>
        {/* Login Page Route */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/success" element={<Success />} />

        {/* User Home Page Route */}
        <Route path="/home/*" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/serverupdate" element={<ServiceUpdate />} />
        <Route path="/Checkout" element={<Checkout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
