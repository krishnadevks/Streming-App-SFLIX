import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import "./UserTable.css";

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    role: "user",
    status: "Active", // default
  });
  const [error, setError] = useState("");

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(
          usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || null,
          }))
        );
      } catch (err) {
        console.error("Error fetching users:", err.message);
        setError("Failed to load users.");
      }
    };
    fetchUsers();
  }, []);

  // Call your backend to disable a user in Firebase Auth
  const disableUserInAuth = async (uid) => {
    await fetch("http://localhost:5000/api/disableUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
  };

  // Call your backend to enable a user in Firebase Auth
  const enableUserInAuth = async (uid) => {
    await fetch("http://localhost:5000/api/enableUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
  };

  // Handle user role or status updates in Firestore + Auth
  const handleUpdateUser = async (userId, field, value) => {
    try {
      const userDocRef = doc(db, "users", userId);

      // If field is "status" and new value is "Deactivated" => disable in Auth
      // If field is "status" and new value is "Active" => enable in Auth
      if (field === "status") {
        if (value === "Deactivated") {
          await disableUserInAuth(userId);
        } else if (value === "Active") {
          await enableUserInAuth(userId);
        }
      }

      // Update Firestore doc
      await updateDoc(userDocRef, { [field]: value });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, [field]: value } : user
        )
      );
    } catch (err) {
      console.error(`Error updating user ${field}:`, err.message);
      setError(`Failed to update user ${field}.`);
    }
  };

  // Deactivate user (status -> "Deactivated")
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;

    try {
      await disableUserInAuth(userId);
      const userDocRef = doc(db, "users", userId);

      // Update Firestore doc
      await updateDoc(userDocRef, { status: "Deactivated" });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: "Deactivated" } : user
        )
      );
    } catch (err) {
      console.error("Error deactivating user:", err.message);
      setError("Failed to deactivate user.");
    }
  };

  // Add a new user (Firestore only) - they'd still need an Auth record in real usage
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const hashedPassword = bcrypt.hashSync(newUser.password, 10);
      const userWithCreatedAt = {
        ...newUser,
        password: hashedPassword,
        createdAt: serverTimestamp(),
      };

      const userRef = await addDoc(collection(db, "users"), userWithCreatedAt);
      setUsers((prev) => [
        ...prev,
        {
          id: userRef.id,
          ...newUser,
          password: hashedPassword,
          createdAt: new Date(),
        },
      ]);
      setNewUser({
        email: "",
        username: "",
        password: "",
        role: "user",
        status: "Active",
      });
    } catch (err) {
      console.error("Error adding new user:", err.message);
      setError("Failed to add user. Please try again.");
    }
  };

  return (
    <div className="user-table-container">
      <h2 className="add-user-h2">User Details</h2>
      {error && <p className="error-message">{error}</p>}

      <table className="user-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.username}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleUpdateUser(user.id, "role", e.target.value)
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <select
                  value={user.status}
                  onChange={(e) =>
                    handleUpdateUser(user.id, "status", e.target.value)
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </td>
              <td>{user.createdAt?.toLocaleString() || "N/A"}</td>
              <td>
                <button
                  className="deactivate-button"
                  onClick={() => handleDeactivateUser(user.id)}
                  disabled={user.status === "Deactivated"}
                >
                  {user.status === "Deactivated" ? "Deactivated" : "Deactivate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="add-user-th">Add New User</h3>
      <form onSubmit={handleAddUser} className="add-user-form">
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label>Role:</label>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label>Status:</label>
          <select
            value={newUser.status}
            onChange={(e) =>
              setNewUser({ ...newUser, status: e.target.value })
            }
          >
            <option value="Active">Active</option>
            <option value="Deactivated">Deactivated</option>
          </select>
        </div>
        <button type="submit" className="add-user-button">
          Add User
        </button>
      </form>
    </div>
  );
};

export default UserTable;
