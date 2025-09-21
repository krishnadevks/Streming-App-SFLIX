import React, { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";
import profilePlaceholder from "../../picture/profile.png";
import { toast } from "react-toastify";

const Profile = () => {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    avatar: "",
  });
  const [newUsername, setNewUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const auth = getAuth();
  const firestore = getFirestore();
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      const userRef = doc(firestore, "users", user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setNewUsername(docSnap.data().username);
        }
      });
    }
  }, [auth, firestore]);

  const handleUpdateUsername = () => {
    const user = auth.currentUser;
    if (user && newUsername.trim() && newUsername !== userData.username) {
      const userRef = doc(firestore, "users", user.uid);
      updateDoc(userRef, { username: newUsername.trim() })
        .then(() => {
          setUserData((prevData) => ({ ...prevData, username: newUsername }));
          setIsEditing(false);
        })
        .catch((error) => console.error("Error updating username:", error));
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err.message);
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="profile">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="profile__container">
        <h2 className="profile__title">Profile</h2>

        <div className="profile__avatar-container">
          <img
            className="profile__avatar"
            src={userData.avatar || profilePlaceholder}
            alt="Profile Avatar"
          />
        </div>

        <div className="profile__details">
          <p className="profile__info">
            <strong>Email:</strong> {userData.email}
          </p>
          <p className="profile__info">
            <strong>Username:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="profile__input"
              />
            ) : (
              userData.username
            )}
          </p>

          {isEditing ? (
            <div className="profile__button-group">
              <button
                onClick={handleUpdateUsername}
                className="profile__button profile__button--save"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="profile__button profile__button--cancel"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="profile__button profile__button--edit"
            >
              Edit
            </button>
          )}

          <div className="profile__actions">
          
            <Link to="/history">
              <button className="profile__button profile__button--history">
                Watch History
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="profile__button profile__button--logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
