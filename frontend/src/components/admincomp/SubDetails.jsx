import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./SubDetail.css";

/**
 * Helper: adds a given number of days to a start date and returns a new Date object.
 */
const addDays = (startDate, days) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Helper: given a durationType (string) and duration (number or string), return numeric days.
 */
const getNumericDuration = (durationType, duration) => {
  if (durationType === "WEEKLY") return 7;
  if (durationType === "MONTHLY") return 30;
  if (durationType === "YEARLY") return 365;
  if (durationType === "CUSTOM") return Number(duration) || 0;
  return 0;
};

/**
 * Given a plan's durationType/duration and a start date, compute the new end date.
 */
const computeEndDate = (durationType, duration, startDate) => {
  const numericDuration = getNumericDuration(durationType, duration);
  return addDays(startDate, numericDuration);
};

const SubDetails = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedData, setEditedData] = useState({});

  /**
   * Periodically checks if any subscription's end date is in the past
   * and updates its status to "inactive" if needed.
   */
  const checkAndUpdateStatus = async () => {
    const currentDate = new Date();
    const updatedSubscriptions = [];
    for (const sub of subscriptions) {
      if (
        sub.rawEndDate &&
        new Date(sub.rawEndDate) < currentDate &&
        sub.isSubscribed
      ) {
        const userDoc = doc(db, "users", sub.userId);
        await updateDoc(userDoc, { "subscription.status": "inactive" });
        updatedSubscriptions.push({ ...sub, isSubscribed: false });
      } else {
        updatedSubscriptions.push(sub);
      }
    }
    if (updatedSubscriptions.length > 0) {
      setSubscriptions(updatedSubscriptions);
    }
  };

  // Check status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndUpdateStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, [subscriptions]);

  /**
   * Handle changes in the editable fields.
   */
  const handleChange = (userId, e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    // For date fields, parse them into a valid Date object
    if (name === "updatedAt" || name === "endDate") {
      const date = new Date(value + "T00:00:00");
      if (!isNaN(date.getTime())) {
        newValue = date;
      } else {
        console.error("Invalid date value:", value);
        return;
      }
    } else if (name === "isSubscribed") {
      newValue = value === "true";
    }

    setEditedData((prev) => {
      const currentData = prev[userId] || {};
      const updatedEntry = {
        ...currentData,
        [name]: type === "checkbox" ? checked : newValue,
      };

      // When the start date or duration/durationType changes, recalc the end date if possible
      if (
        name === "updatedAt" ||
        name === "durationType" ||
        name === "customDuration"
      ) {
        const start =
          name === "updatedAt"
            ? newValue
            : currentData.updatedAt ||
              subscriptions.find((sub) => sub.userId === userId)?.rawDate;

        const planDurType =
          name === "durationType"
            ? newValue
            : currentData.durationType ||
              subscriptions.find((sub) => sub.userId === userId)?.durationType;

        // For CUSTOM, read from the updated or stored customDuration
        let durValue;
        if (planDurType === "CUSTOM") {
          durValue =
            name === "customDuration"
              ? newValue
              : currentData.customDuration ||
                subscriptions.find((sub) => sub.userId === userId)
                  ?.customDuration ||
                0;
        } else {
          // For standard durations, read from the user's subscription (which overrides the plan doc)
          durValue =
            subscriptions.find((sub) => sub.userId === userId)?.duration || 0;
        }

        if (start && planDurType) {
          const computedEndDate = computeEndDate(planDurType, durValue, start);
          if (computedEndDate) {
            updatedEntry.endDate = computedEndDate;
          }
        }
      }
      return { ...prev, [userId]: updatedEntry };
    });
  };

  /**
   * Enable editing mode for a particular user subscription.
   */
  const handleEdit = (userId) => {
    setEditingUserId(userId);
    const subscription = subscriptions.find((sub) => sub.userId === userId);
    setEditedData((prev) => ({
      ...prev,
      [userId]: {
        planType: subscription.planType,
        isSubscribed: subscription.isSubscribed,
        updatedAt: subscription.rawDate, // store as Date
        durationType: subscription.durationType, // "WEEKLY", "MONTHLY", "YEARLY", or "CUSTOM"
        duration: subscription.duration, // numeric (standard or custom)
        customDuration:
          subscription.durationType === "CUSTOM"
            ? subscription.customDuration || ""
            : "",
      },
    }));
  };

  /**
   * Cancel editing mode.
   */
  const handleCancel = () => {
    setEditingUserId(null);
    setEditedData({});
  };

  /**
   * Fetch subscription data (from 'users') and plan data (from 'subscriptionPlans').
   * We prefer reading duration/durationType from the user's subscription doc
   * so that we preserve custom changes on refresh.
   */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Fetch all subscription plans
          const plansSnapshot = await getDocs(
            collection(db, "subscriptionPlans")
          );
          const plansData = plansSnapshot.docs.map((doc) => doc.data());
          setSubscriptionPlans(plansData);

          // Fetch all user subscriptions
          const usersSnapshot = await getDocs(collection(db, "users"));
          const subscriptionsList = [];
          usersSnapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            if (userData.subscription) {
              const sub = userData.subscription;
              let sDate;
              if (
                sub.planStartDate &&
                !isNaN(new Date(sub.planStartDate).getTime())
              ) {
                sDate = new Date(sub.planStartDate);
              } else {
                console.error("Invalid planStartDate in subscription:", sub);
                return;
              }
              let eDate = null;
              if (
                sub.planEndDate &&
                sub.planEndDate !== "N/A" &&
                !isNaN(new Date(sub.planEndDate).getTime())
              ) {
                eDate = new Date(sub.planEndDate);
              }

              // Attempt to find the matching plan in subscriptionPlans
              const matchedPlan = plansData.find(
                (plan) => plan.stripePriceId === sub.planType
              );

              // If the user doc has its own durationType/duration, we prioritize that
              // because we want to preserve custom changes.
              const finalDurationType = sub.durationType
                ? sub.durationType
                : matchedPlan?.durationType || "WEEKLY";

              // If user doc says CUSTOM, read from sub.customDuration
              // else read from sub.duration or matchedPlan?.duration
              let finalDuration = 7; // default
              let finalCustomDur = "";
              if (finalDurationType === "CUSTOM") {
                finalDuration = sub.customDuration || 0;
                finalCustomDur = String(sub.customDuration || "");
              } else if (typeof sub.duration === "number") {
                // If user doc stores a numeric 'duration', use that
                finalDuration = sub.duration;
              } else if (matchedPlan?.duration) {
                // fallback to matched plan's numeric duration
                finalDuration = matchedPlan.duration;
              }

              subscriptionsList.push({
                userId: docSnap.id,
                name: userData.username || "Unknown User",
                planType: sub.planType,
                planTitle: matchedPlan?.title || "Unknown Plan",
                price: matchedPlan?.price || 0,
                startDate: sDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                endDate: eDate
                  ? eDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A",
                isSubscribed: sub.status === "active",
                rawDate: sDate,
                rawEndDate: eDate,

                durationType: finalDurationType,
                duration: finalDuration,
                customDuration: finalCustomDur,
              });
            }
          });
          setSubscriptions(subscriptionsList);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to fetch data");
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError("User not authenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  /**
   * Save the updated subscription info to Firestore.
   */
  const handleSave = async (userId) => {
    try {
      const userDoc = doc(db, "users", userId);
      const editedEntry = editedData[userId];

      // Get the selected plan from the subscriptionPlans collection
      const selectedPlan = subscriptionPlans.find(
        (plan) => plan.stripePriceId === editedEntry.planType
      );

      // Decide numericDuration from user’s changes or matchedPlan
      let numericDuration = 7; // default
      if (editedEntry.durationType === "CUSTOM") {
        numericDuration = Number(editedEntry.customDuration) || 0;
      } else {
        numericDuration = getNumericDuration(
          editedEntry.durationType,
          editedEntry.duration
        );
      }

      // Compute new end date based on updated start date
      const updatedStartDate = new Date(editedEntry.updatedAt);
      const newEndDate = addDays(updatedStartDate, numericDuration);

      // Build the updated subscription object
      const updatedSubscription = {
        subscription: {
          planType: editedEntry.planType,
          status: editedEntry.isSubscribed ? "active" : "inactive",
          planStartDate: updatedStartDate.toISOString(),
          planEndDate: newEndDate ? newEndDate.toISOString() : "N/A",
          durationType: editedEntry.durationType,
          duration:
            editedEntry.durationType === "CUSTOM"
              ? Number(editedEntry.customDuration)
              : editedEntry.duration,
        },
      };
      // If CUSTOM, also store customDuration
      if (editedEntry.durationType === "CUSTOM") {
        updatedSubscription.subscription.customDuration = Number(
          editedEntry.customDuration
        );
      }

      // Update Firestore
      await updateDoc(userDoc, updatedSubscription);

      // Update local state
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.userId === userId
            ? {
                ...sub,
                planType: editedEntry.planType,
                isSubscribed: editedEntry.isSubscribed,
                planTitle: selectedPlan?.title || "Unknown Plan",
                price: selectedPlan?.price || 0,
                startDate: updatedStartDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                endDate: newEndDate
                  ? newEndDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A",
                rawDate: updatedStartDate,
                rawEndDate: newEndDate,
                durationType: editedEntry.durationType,
                duration:
                  editedEntry.durationType === "CUSTOM"
                    ? Number(editedEntry.customDuration)
                    : editedEntry.duration,
                customDuration:
                  editedEntry.durationType === "CUSTOM"
                    ? String(editedEntry.customDuration)
                    : "",
              }
            : sub
        )
      );

      setEditingUserId(null);
      setError("");
    } catch (err) {
      console.error("Error updating subscription:", err);
      setError("Failed to update subscription");
    }
  };

  /**
   * Deactivate the subscription for a user.
   */
  const handleDeactivate = async (userId) => {
    if (
      !window.confirm("Are you sure you want to deactivate this subscription?")
    ) {
      return;
    }
    try {
      const userDoc = doc(db, "users", userId);
      await updateDoc(userDoc, { "subscription.status": "inactive" });
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.userId === userId ? { ...sub, isSubscribed: false } : sub
        )
      );
      setError("");
    } catch (err) {
      console.error("Error deactivating subscription:", err);
      setError("Failed to deactivate subscription");
    }
  };

  if (loading) {
    return <div className="loading-message">Loading subscriptions...</div>;
  }
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  /**
   * For display in the table: if durationType is WEEKLY, show 7; if MONTHLY, show 30, etc.
   * If CUSTOM, display the numeric value (custom duration).
   */
  const displayDuration = (dType, dur) => {
    if (dType === "WEEKLY") return 7;
    if (dType === "MONTHLY") return 30;
    if (dType === "YEARLY") return 365;
    if (dType === "CUSTOM") return dur;
    return dur; // fallback
  };

  return (
    <div className="subscription-details-container">
      <h2>All Subscriptions</h2>
      <table className="subscription-table">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Plan Type</th>
            <th>Duration (days)</th>
            <th>Price</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.userId}>
              <td>{sub.name}</td>
              <td>
                {editingUserId === sub.userId ? (
                  <select
                    name="planType"
                    value={editedData[sub.userId]?.planType || sub.planType}
                    onChange={(e) => handleChange(sub.userId, e)}
                    className="edit-input"
                  >
                    {subscriptionPlans.map((plan) => (
                      <option
                        key={plan.stripePriceId}
                        value={plan.stripePriceId}
                      >
                        {plan.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  sub.planTitle
                )}
              </td>
              <td>
                {editingUserId === sub.userId ? (
                  <>
                    <select
                      name="durationType"
                      value={
                        editedData[sub.userId]?.durationType || sub.durationType
                      }
                      onChange={(e) => handleChange(sub.userId, e)}
                      className="edit-input"
                    >
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="YEARLY">YEARLY</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                    {(editedData[sub.userId]?.durationType === "CUSTOM" ||
                      (sub.durationType === "CUSTOM" &&
                        !editedData[sub.userId]?.durationType)) && (
                      <input
                        type="number"
                        name="customDuration"
                        placeholder="Enter duration (days)"
                        value={editedData[sub.userId]?.customDuration || ""}
                        onChange={(e) => handleChange(sub.userId, e)}
                        className="edit-input"
                      />
                    )}
                  </>
                ) : (
                  displayDuration(sub.durationType, sub.duration)
                )}
              </td>
              <td>{sub.price}</td>
              <td>
                {editingUserId === sub.userId ? (
                  <input
                    type="date"
                    name="updatedAt"
                    value={
                      new Date(editedData[sub.userId]?.updatedAt || sub.rawDate)
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(e) => handleChange(sub.userId, e)}
                    className="edit-input"
                  />
                ) : (
                  sub.startDate
                )}
              </td>
              <td>
                {editingUserId === sub.userId ? (
                  <input
                    type="date"
                    name="endDate"
                    value={
                      editedData[sub.userId]?.endDate
                        ? new Date(editedData[sub.userId].endDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    readOnly
                    className="edit-input"
                  />
                ) : (
                  sub.endDate
                )}
              </td>
              <td>
                {editingUserId === sub.userId ? (
                  <select
                    name="isSubscribed"
                    value={String(
                      editedData[sub.userId]?.isSubscribed ?? sub.isSubscribed
                    )}
                    onChange={(e) => handleChange(sub.userId, e)}
                    className="edit-input"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : (
                  <span
                    className={`status-badge ${
                      sub.isSubscribed ? "active" : "inactive"
                    }`}
                  >
                    {sub.isSubscribed ? "Active" : "Inactive"}
                  </span>
                )}
              </td>
              <td>
                {editingUserId === sub.userId ? (
                  <>
                    <button
                      onClick={() => handleSave(sub.userId)}
                      className="save-button"
                    >
                      Save
                    </button>
                    <button onClick={handleCancel} className="cancel-button">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(sub.userId)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(sub.userId)}
                      className="deactivate-button"
                      disabled={!sub.isSubscribed}
                    >
                      Deactivate
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubDetails;
