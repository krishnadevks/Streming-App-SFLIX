const express = require("express");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const moment = require("moment");
const router = express.Router();

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("../serviceAccountKey.json")),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Function to fetch all plans from Firestore
const getSubscriptionPlans = async () => {
  const plansSnapshot = await admin.firestore().collection("subscriptionPlans").get();
  const plans = {};
  plansSnapshot.forEach((doc) => {
    const data = doc.data();
    plans[data.price] = data.stripePriceId; // Store by price for quick lookup
  });
  return plans;
};

// Helper function to create a Stripe session
const createStripeSession = async (priceId, customerId) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      client_reference_id: customerId, // Link Stripe session to Firebase user
    });
    return session;
  } catch (error) {
    throw new Error("Failed to create Stripe session: " + error.message);
  }
};

// Route to create a subscription
router.post("/create-subscription-checkout-session", async (req, res) => {
  const { plan, customerId } = req.body;

  if (!plan || !customerId) {
    return res.status(400).json({ error: "Plan and Customer ID are required." });
  }

  try {
    const plans = await getSubscriptionPlans();
    const planId = plans[plan];

    if (!planId) {
      return res.status(400).json({ error: "Invalid plan selected." });
    }

    const session = await createStripeSession(planId, customerId);

    // Save subscription data to Firestore under the user's document
    const userRef = admin.firestore().collection("users").doc(customerId);
    await userRef.set(
      {
        subscription: {
          sessionId: session.id,
          planId: planId,
          planType: plan,
          status: "pending",
          createdAt: moment().toISOString(),
        },
      },
      { merge: true } // Merge with existing data to avoid overwriting
    );

    return res.status(200).json({ session });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ error: "Subscription creation failed", details: error.message });
  }
});

// Route to handle successful payments
router.post("/payment-success", async (req, res) => {
  const { sessionId, firebaseId } = req.body;

  if (!sessionId || !firebaseId) {
    return res.status(400).json({ error: "Session ID and Firebase ID are required." });
  }

  try {
    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Additional validation: Check if the session matches the user
    if (session.client_reference_id !== firebaseId) {
      throw new Error("Invalid user session");
    }

    // Retrieve subscription details from Stripe
    const subscriptionId = session.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Calculate plan details
    const planPrice = subscription.plan.amount / 100; // Convert from cents
    const plans = await getSubscriptionPlans();
    const planType = plans[planPrice] || "unknown";

    const startDate = moment.unix(subscription.current_period_start).toISOString();
    const endDate = moment.unix(subscription.current_period_end).toISOString();
    const durationInDays = moment.duration(subscription.current_period_end - subscription.current_period_start, "seconds").asDays();

    // Update Firestore User Document with Subscription Data
    const userRef = admin.firestore().collection("users").doc(firebaseId);
    await userRef.set(
      {
        subscription: {
          sessionId: session.id,
          planId: subscription.plan.id,
          planType: planType,
          planStartDate: startDate,
          planEndDate: endDate,
          planDuration: durationInDays,
          status: "active",
          updatedAt: moment().toISOString(),
        },
      },
      { merge: true } // Merge with existing data to avoid overwriting
    );

    console.log("Subscription updated successfully in Firestore.");
    return res.json({ message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error during payment success:", error);
    return res.status(500).json({ error: "Payment processing failed", details: error.message });
  }
});

module.exports = router;