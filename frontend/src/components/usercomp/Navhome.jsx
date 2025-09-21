import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth"; // Import Firebase Authentication
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Link, useNavigate } from "react-router-dom"; // For page navigation and redirection
import "./Navhome.css"; // Import CSS file for Navbar styling
import sflix from "../../picture/sflix.png";

function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [show, setShow] = useState(false);
  const auth = getAuth();
  const firestore = getFirestore();
  const navigate = useNavigate();

  // Handle scroll to toggle navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 100); // Hide/show navbar based on scroll position
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Check if the user is logged in and if they are an admin
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If the user is not logged in, redirect to the login page
        navigate("/login");
      } else {
        // If the user is logged in, check if they are an admin
        const userRef = doc(firestore, "users", user.uid); // Assuming user roles are stored in Firestore under "users" collection
        getDoc(userRef)
          .then((docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              // Check if the user role is "admin"
              if (userData.role === "admin") {
                setIsAdmin(true); // Set isAdmin to true if the user is an admin
              }
            }
          })
          .catch((error) => {
            console.error("Error fetching user role:", error);
          });
      }
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [auth, firestore, navigate]);

  return (
    <div className={`nav ${show ? "nav_black" : ""}`}>
      {/* Logo */}
      <Link to="" className="nav__logo">
        <img src={sflix} alt="Netflix Logo" />
      </Link>

      {/* Navigation Links */}
      <div>
        <ul className="navbar-links">
          {/* Home link */}
          <li>
            <Link to="/home" className="navbar__link">
              Home
            </Link>
          </li>

          {/* Admin-only links */}
          {isAdmin && (
            <>
              <li>
                <Link to="/admin/dashboard" className="navbar__link">
                  Dashboard
                </Link>
              </li>
            </>
          )}

          {/* Services link */}
          <li>
            <Link to="/checkout" className="navbar__link">
              Services
            </Link>
          </li>

          {/* Profile link */}
          <li>
            <Link to="/profile" className="navbar__link">
              Profile
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
