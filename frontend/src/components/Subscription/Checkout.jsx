import React, { useEffect, useState } from "react";
import { auth, db, realTimeDb } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import Navbar from "../usercomp/Navhome";
import success from "../../picture/assets/success.png";
import cancel from "../../picture/assets/cancel.png";
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [planType, setPlanType] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [plans, setPlans] = useState([]);

  // Fetch Subscription Plans from Firestore
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansCollection = collection(db, "subscriptionPlans");
        const plansSnapshot = await getDocs(plansCollection);
        const plansList = plansSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlans(plansList);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName || "Anonymous");
      } else {
        setUserId("");
        setUserName("");
      }
    });

    return () => unsubscribe();
  }, []);

  const saveSubscriptionToRealtimeDb = (planType, sessionId, isSubscribed) => {
    if (userId) {
      const userRef = ref(realTimeDb, `users/${userId}/subscription`);
      set(userRef, {
        planType,
        sessionId,
        isSubscribed,
        updatedAt: new Date().toISOString(),
      }).catch((error) =>
        console.error("Error saving subscription data to Realtime DB:", error)
      );
    }
  };

  const checkout = (plan) => {
    // Check if the plan is active before proceeding (redundant since only active plans are shown)
    if (plan.status !== "active") {
      alert("This plan is currently inactive.");
      return;
    }
    fetch("http://localhost:5000/api/v1/create-subscription-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "cors",
      body: JSON.stringify({ plan: plan.price, customerId: userId }),
    })
      .then((res) =>
        res.ok ? res.json() : res.json().then((json) => Promise.reject(json))
      )
      .then(({ session }) => {
        saveSubscriptionToRealtimeDb(plan.title, session.id, true);
        window.location = session.url;
      })
      .catch((e) => console.error("Checkout Error:", e));
  };

  return (
    <>
      {!userId ? (
        <div className="m-0 p-0 bg-[#FDFDFD] min-h-screen">
          <div className="w-full min-h-[80vh] flex flex-col justify-center items-center">
            <div className="my-10 text-red-600 text-2xl mx-auto flex flex-col justify-center items-center">
              <a
                href="/"
                className="w-auto uppercase bg-slate-900 text-white text-xl my-16 px-8 py-3 rounded"
              >
                Go To Homepage
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="subscription-container">
          <div className="subscription-header">
            <div className="subscription-title">SERVICES</div>
            <div className="flex justify-center items-center gap-2">
              <Navbar />
            </div>
          </div>
          <div className="subscription-plans">
            {plans
              .filter((plan) => plan.status === "active")
              .map((plan, idx) => (
                <div
                  key={idx}
                  className={`subscription-card ${
                    planType === plan.title.toLowerCase()
                      ? "subscription-active"
                      : ""
                  }`}
                >
                  {plan.image && (
                    <img
                      src={plan.image} // Display image URL from Firestore
                      alt={plan.title}
                      className="subscription-image"
                    />
                  )}
                  <div className="subscription-card-title">{plan.title}</div>
                  <p className="subscription-card-description">
                    {plan.description}
                  </p>
                  <div className="subscription-card-price">₹{plan.price}</div>
                  <div className="subscription-card-button">
                    {planType === plan.title.toLowerCase() ? (
                      <button className="btn-subscribed">Subscribed</button>
                    ) : (
                      <button onClick={() => checkout(plan)} className="btn-start">
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      {/* Success Page */}
      {paymentSuccess && (
        <div className="success-page">
          <img src={success} alt="Success" width={220} height={220} />
          <h3 className="text-4xl font-bold text-center text-slate-700">
            Payment Successful
          </h3>
          <button onClick={() => navigate("/dashboard")} className="btn-success">
            Go to Dashboard
          </button>
        </div>
      )}
      {/* Cancel Page */}
      {paymentCancelled && (
        <div className="cancel-page">
          <img src={cancel} alt="Cancel" width={220} height={220} />
          <h3 className="text-4xl font-bold text-center text-red-600">
            Payment Cancelled
          </h3>
          <button onClick={() => navigate("/dashboard")} className="btn-cancel">
            Return Home
          </button>
        </div>
      )}
    </>
  );
};

export default Checkout;
