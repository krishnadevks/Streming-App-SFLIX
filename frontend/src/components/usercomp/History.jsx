import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./History.css"; // Import CSS for history styling

const History = () => {
  const [history, setHistory] = useState([]);
  const auth = getAuth();
  const firestore = getFirestore();
  const currentUser = auth.currentUser;

  // Fetch history from Firestore (including document id)
  const fetchHistory = async () => {
    if (!currentUser) return;
    try {
      const historyQuery = query(
        collection(firestore, "history"),
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(historyQuery);
      const historyData = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser, firestore]);

  // Remove a single history item
  const handleRemoveItem = async (id) => {
    try {
      await deleteDoc(doc(firestore, "history", id));
      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing history item:", error);
    }
  };

  // Clear all history for the user
  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire history?"))
      return;
    try {
      await Promise.all(
        history.map((item) => deleteDoc(doc(firestore, "history", item.id)))
      );
      setHistory([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  return (
    <div className="history">
      {/* Back Arrow Button */}
      <button className="back-button" onClick={() => window.history.back()}>
        ← Back
      </button>

      <h2>Watch History</h2>
      {history.length === 0 ? (
        <p>No history available.</p>
      ) : (
        <>
          <button className="clear-all-button" onClick={handleClearHistory}>
            Clear All History
          </button>
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <p>Watched on: {new Date(item.watchedAt).toLocaleString()}</p>
                <button onClick={() => handleRemoveItem(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default History;
