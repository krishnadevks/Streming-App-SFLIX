import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("pending");

  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const userRef = doc(firestore, "users", currentUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setSubscriptionStatus(userData.subscription?.status || "pending");
      } else {
        setSubscriptionStatus("pending");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (loading) return <div>Loading...</div>;

  // Redirect if not logged in
  if (!user) return <Navigate to="/" replace />;

  // Redirect to checkout if subscription is not active
  if (subscriptionStatus !== "active") return <Navigate to="/checkout" replace />;

  // Handle admin-only routes
  if (adminOnly && !user.email.includes("@admin.com")) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
