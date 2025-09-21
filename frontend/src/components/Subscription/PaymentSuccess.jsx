import React, { useEffect, useState } from "react";
import { auth, realTimeDb } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import { useNavigate, useSearchParams } from "react-router-dom";
import success from "../../picture/assets/success.png";
import "./Success.css";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Fetch user and session data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        // Get sessionId from URL or Realtime Database
        const urlSessionId = searchParams.get("session_id");
        if (urlSessionId) {
          setSessionId(urlSessionId);
        } else {
          const userRef = ref(realTimeDb, `users/${user.uid}/subscription`);
          onValue(userRef, (snapshot) => {
            const subscriptionData = snapshot.val();
            if (subscriptionData) {
              setSessionId(subscriptionData.sessionId || "");
            }
          });
        }
      } else {
        setUserId("");
        setSessionId("");
      }
    });

    return () => unsubscribe();
  }, [searchParams]);

  // Automatically verify payment when sessionId and userId are available
  useEffect(() => {
    if (sessionId && userId) {
      verifyPayment();
    }
  }, [sessionId, userId]);

  // Verify payment and update subscription status
  const verifyPayment = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // Verify payment with backend
      const response = await fetch(
        "http://localhost:5000/api/v1/payment-success",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            firebaseId: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment verification failed");
      }

      // Update subscription status in Realtime Database
      const subRef = ref(realTimeDb, `users/${userId}/subscription`);
      await update(subRef, {
        status: "active",
        updatedAt: new Date().toISOString(),
      });

      console.log("Payment verified and subscription activated");
      navigate("/home"); // Redirect to home page after successful verification
    } catch (error) {
      console.error("Payment verification error:", error);
      setError(error.message || "Failed to verify payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="m-0 p-0">
      <div className="w-full min-h-[80vh] flex flex-col justify-center items-center">
        <div className="my-10 text-green-600 text-2xl mx-auto flex flex-col justify-center items-center">
          <img src={success} alt="Success" width={220} height={220} />
          <h3 className="text-4xl pt-20 lg:pt-0 font-bold text-center text-slate-700">
            Payment Successful
          </h3>

          {isProcessing ? (
            <div className="processing-message">Processing payment...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <button
              onClick={verifyPayment}
              className="w-40 uppercase bg-[#009C96] text-white text-xl my-16 px-2 py-2 rounded"
            >
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Success;