import React, { useEffect, useState } from "react";
import "./Dashboard.css"; // Dashboard-specific styles
import AnalyticsPanel from "./AnalyticsPanel";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    videosUploaded: 0,
    activeSessions: 0,
    newUsers: 0,
    streamsToday: 0,
    subscribedUsers: 0,
  });

  const firestore = getFirestore();

  useEffect(() => {
    // 1) Fetch total users
    const unsubscribeUsers = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        setDashboardData((prev) => ({
          ...prev,
          totalUsers: snapshot.size,
        }));
      }
    );

    // 2) Fetch videos uploaded
    const unsubscribeVideos = onSnapshot(
      collection(firestore, "videos"),
      (snapshot) => {
        setDashboardData((prev) => ({
          ...prev,
          videosUploaded: snapshot.size,
        }));
      }
    );

    // 3) Fetch active sessions
    const unsubscribeSessions = onSnapshot(
      collection(firestore, "sessions"),
      (snapshot) => {
        const activeSessions = snapshot.docs.filter(
          (doc) => doc.data().isActive
        ).length;
        setDashboardData((prev) => ({
          ...prev,
          activeSessions,
        }));
      }
    );

    // 4) Fetch new users (users created today)
    const unsubscribeNewUsers = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight
        const newUsers = snapshot.docs.filter((doc) => {
          const createdAt = doc.data().createdAt?.toDate();
          return createdAt && createdAt.toDateString() === today.toDateString();
        }).length;

        setDashboardData((prev) => ({
          ...prev,
          newUsers,
        }));
      }
    );

    // 5) Updated fetchData function for streamsToday
    const fetchData = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight
      const unsubscribe = onSnapshot(
        collection(firestore, "history"), // Ensure this is the correct collection name
        (snapshot) => {
          let streamsToday = 0;

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const watchedAtString = data?.watchedAt; // Expected format: "2025-03-26 21:35"
            if (
              typeof watchedAtString === "string" &&
              watchedAtString.includes(" ")
            ) {
              const [datePart, timePart] = watchedAtString.split(" ");
              const [year, month, day] = datePart.split("-").map(Number);
              const [hours, minutes] = timePart.split(":").map(Number);
              const watchedDate = new Date(
                year,
                month - 1,
                day,
                hours,
                minutes
              ); // Month is zero-based

              // Check if the watchedDate is today
              if (watchedDate >= today) {
                streamsToday++;
              }
            }
          });

          setDashboardData((prev) => ({
            ...prev,
            streamsToday,
          }));
        }
      );

      return unsubscribe;
    };

    const unsubscribeStreams = fetchData();

    // 6) Fetch subscribed users (from 'users' collection)
    const unsubscribeSubscribedUsers = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        const subscribedUsers = snapshot.docs.filter((doc) => {
          const userData = doc.data();
          return (
            userData.subscription && userData.subscription.status === "active"
          );
        }).length;
        setDashboardData((prev) => ({
          ...prev,
          subscribedUsers,
        }));
      }
    );

    // Cleanup all subscriptions
    return () => {
      unsubscribeUsers();
      unsubscribeVideos();
      unsubscribeSessions();
      unsubscribeNewUsers();
      unsubscribeStreams();
      unsubscribeSubscribedUsers();
    };
  }, [firestore]);

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-content">
        <div className="card">
          <h3>Total Users</h3>
          <p>{dashboardData.totalUsers}</p>
        </div>
        <div className="card">
          <h3>Videos Uploaded</h3>
          <p>{dashboardData.videosUploaded}</p>
        </div>
        <div className="card">
          <h3>Active Sessions</h3>
          <p>{dashboardData.activeSessions}</p>
        </div>
      </div>

      <div className="analytics">
        <h1>Analytics</h1>
        <div className="analytics-container">
          <div className="analytics-card">
            <h3>New Users</h3>
            <p>{dashboardData.newUsers}</p>
          </div>
          <div className="analytics-card">
            <h3>Streams Today</h3>
            <p>{dashboardData.streamsToday}</p>
          </div>
          <div className="analytics-card">
            <h3>Subscribed Users</h3>
            <p>{dashboardData.subscribedUsers}</p>
          </div>
        </div>
      </div>

      <AnalyticsPanel />
    </div>
  );
}

export default Dashboard;
