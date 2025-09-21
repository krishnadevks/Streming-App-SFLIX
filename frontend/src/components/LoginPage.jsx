import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";
import "./LoginPage.css";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUserDetails = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User record not found. Please contact support.");
      }

      const userData = userDoc.data();
      if (userData.status === "Deactivated") {
        throw new Error("Your account has been deactivated. Please contact support.");
      }

      return userData.role || "user";
    } catch (err) {
      console.error("Error fetching user details:", err.message);
      throw err;
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        await handleLogin(loginEmail, loginPassword);
      } else {
        if (!email || !password || !username) {
          setError("All fields are required for signup.");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const hashedPassword = bcrypt.hashSync(password, 10);
        await updateProfile(user, { displayName: username });

        await setDoc(doc(db, "users", user.uid), {
          email,
          username,
          password: hashedPassword,
          role: "user",
          status: "Active",
          createdAt: serverTimestamp(),
        });

        toast.success("Signup successful! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error("Authentication error:", err.message);
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() && userDoc.data().status === "Deactivated") {
        await signOut(auth);
        throw new Error("Your account has been deactivated. Please contact support.");
      }

      toast.success("Login successful!");
      const userRole = userDoc.data().role || "user";
      navigate(userRole === "admin" ? "/admin" : "/home");
    } catch (error) {
      console.error("Login failed:", error.message);
      setError(error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="login-container">
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleAuth} className="login-form">
        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-sign"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={isLogin ? loginEmail : email}
          onChange={(e) => (isLogin ? setLoginEmail(e.target.value) : setEmail(e.target.value))}
          className="login-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={isLogin ? loginPassword : password}
          onChange={(e) => (isLogin ? setLoginPassword(e.target.value) : setPassword(e.target.value))}
          className="login-input"
          required
        />
        {isLogin && (
          <div className="login-help">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
          </div>
        )}
        <button type="submit" className="login-btn">
          {isLogin ? "Sign In" : "Sign Up"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <p onClick={() => setIsLogin(!isLogin)} className="toggle-link">
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
      </p>
    </div>
  );
};

export default Login;
