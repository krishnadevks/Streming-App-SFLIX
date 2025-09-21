import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import "./ServiceUpdate.css";
import Navbar from "../admincomp/Navbar";

const ServiceUpdate = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stripePriceId, setStripePriceId] = useState("");
  const [description, setDescription] = useState("");
  const [durationType, setDurationType] = useState("WEEKLY");
  const [customDuration, setCustomDuration] = useState("");
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);

  // Helper to determine duration (in days) based on selected type
  const getDurationValue = (dType, customDur) => {
    switch (dType) {
      case "WEEKLY":
        return 7;
      case "MONTHLY":
        return 30;
      case "YEARLY":
        return 365;
      case "CUSTOM":
        return Number(customDur) || 0;
      default:
        return 0;
    }
  };

  // Fetch existing subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      const querySnapshot = await getDocs(collection(db, "subscriptionPlans"));
      const plansList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlans(plansList);
    };
    fetchPlans();
  }, []);

  const handleAddPlan = async () => {
    if (
      !title ||
      !price ||
      !stripePriceId ||
      !description ||
      !durationType ||
      (durationType === "CUSTOM" && !customDuration)
    ) {
      alert("Please fill in all fields");
      return;
    }
    const durationValue = getDurationValue(durationType, customDuration);

    const data = {
      title,
      price: Number(price),
      stripePriceId,
      description,
      durationType,
      duration: durationValue,
      status: "active",
    };

    try {
      await addDoc(collection(db, "subscriptionPlans"), data);
      alert("Plan added successfully!");
      // Reset fields
      setTitle("");
      setPrice("");
      setStripePriceId("");
      setDescription("");
      setDurationType("WEEKLY");
      setCustomDuration("");
      // Refresh plans list
      const querySnapshot = await getDocs(collection(db, "subscriptionPlans"));
      const plansList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlans(plansList);
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    const durationValue = getDurationValue(
      editingPlan.durationType,
      editingPlan.customDuration
    );

    const data = {
      title: editingPlan.title,
      price: Number(editingPlan.price),
      stripePriceId: editingPlan.stripePriceId,
      description: editingPlan.description,
      durationType: editingPlan.durationType,
      duration: durationValue,
      status: editingPlan.status,
    };

    try {
      await updateDoc(doc(db, "subscriptionPlans", editingPlan.id), data);
      alert("Plan updated successfully!");
      setEditingPlan(null);

      // Refresh list
      const querySnapshot = await getDocs(collection(db, "subscriptionPlans"));
      const plansList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlans(plansList);
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };

  const handleToggleStatus = async (plan) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "subscriptionPlans", plan.id), {
        status: newStatus,
      });
      alert("Plan status updated successfully!");
      setPlans(
        plans.map((p) => (p.id === plan.id ? { ...p, status: newStatus } : p))
      );
      if (editingPlan && editingPlan.id === plan.id) {
        setEditingPlan({ ...editingPlan, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating plan status:", error);
    }
  };

  return (
    <div >
      <Navbar />
      <div className="service-update-container">
        <h2 className="service-update-header">Add New Subscription Plan</h2>
        {/* -- The "Add Plan" form container -- */}
        <div className="service-update-form">
          <input
            className="service-update-input"
            type="text"
            placeholder="Plan Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="service-update-input"
            type="number"
            placeholder="Plan Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            className="service-update-input"
            type="text"
            placeholder="Stripe Price ID"
            value={stripePriceId}
            onChange={(e) => setStripePriceId(e.target.value)}
          />
          <textarea
            className="service-update-textarea"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            className="service-update-select"
            value={durationType}
            onChange={(e) => setDurationType(e.target.value)}
          >
            <option value="WEEKLY">Weekly (7 days)</option>
            <option value="MONTHLY">Monthly (30 days)</option>
            <option value="YEARLY">Yearly (365 days)</option>
            <option value="CUSTOM">Custom</option>
          </select>
          {durationType === "CUSTOM" && (
            <input
              className="service-update-input"
              type="number"
              placeholder="Enter custom duration (in days)"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
            />
          )}
          <div className="service-update-duration-display">
            <strong>Plan Duration (days): </strong>
            {getDurationValue(durationType, customDuration)}
          </div>
          <button className="service-update-add-btn" onClick={handleAddPlan}>
            Add Plan
          </button>
        </div>
      </div>

      {/* -- Now the table is placed outside the "Add Plan" form container -- */}
      <div className="service-update-container">
        <h3 className="service-update-subheader">Existing Subscription Plans</h3>
        <table className="service-update-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stripe Price ID</th>
              <th>Duration (days)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                {editingPlan?.id === plan.id ? (
                  <>
                    <td>
                      <input
                        className="service-update-input"
                        type="text"
                        value={editingPlan.title}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            title: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <textarea
                        className="service-update-textarea"
                        value={editingPlan.description}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            description: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="service-update-input"
                        type="number"
                        value={editingPlan.price}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            price: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="service-update-input"
                        type="text"
                        value={editingPlan.stripePriceId}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            stripePriceId: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="service-update-select"
                        value={editingPlan.durationType}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            durationType: e.target.value,
                          })
                        }
                      >
                        <option value="WEEKLY">Weekly (7 days)</option>
                        <option value="MONTHLY">Monthly (30 days)</option>
                        <option value="YEARLY">Yearly (365 days)</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                      {editingPlan.durationType === "CUSTOM" && (
                        <input
                          className="service-update-input"
                          type="number"
                          placeholder="Enter custom duration (in days)"
                          value={editingPlan.customDuration || ""}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              customDuration: e.target.value,
                            })
                          }
                        />
                      )}
                      <div className="service-update-duration-display">
                        <strong>Duration (days): </strong>
                        {getDurationValue(
                          editingPlan.durationType,
                          editingPlan.customDuration
                        )}
                      </div>
                    </td>
                    <td>{editingPlan.status}</td>
                    <td>
                      <button
                        className="service-update-toggle-btn"
                        onClick={() => handleToggleStatus(editingPlan)}
                      >
                        {editingPlan.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                      <button
                        className="service-update-save-btn"
                        onClick={handleUpdatePlan}
                      >
                        Save
                      </button>
                      <button
                        className="service-update-cancel-btn"
                        onClick={() => setEditingPlan(null)}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="service-update-cell">{plan.title}</td>
                    <td className="service-update-cell">{plan.description}</td>
                    <td className="service-update-cell">${plan.price}</td>
                    <td className="service-update-cell">{plan.stripePriceId}</td>
                    <td className="service-update-cell">{plan.duration}</td>
                    <td className="service-update-cell">{plan.status}</td>
                    <td className="service-update-cell">
                      <button
                        className="service-update-edit-btn"
                        onClick={() => handleEditPlan(plan)}
                      >
                        Edit
                      </button>
                      <button
                        className="service-update-toggle-btn"
                        onClick={() => handleToggleStatus(plan)}
                      >
                        {plan.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceUpdate;
