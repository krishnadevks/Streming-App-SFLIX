import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { realTimeDb } from "../../firebase";

export const useSubscription = () => {
  const [status, setStatus] = useState("pending");
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const subRef = ref(realTimeDb, `users/${user.uid}/subscription`);
        onValue(subRef, (snapshot) => {
          setStatus(snapshot.val()?.status || "pending");
        });
      } else {
        setStatus("pending");
      }
    });

    return unsubscribe;
  }, []);

  return status;
}; 