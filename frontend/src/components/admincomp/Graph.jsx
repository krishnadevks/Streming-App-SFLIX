import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import "./Graph.css";

// Register necessary ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Graph() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "User Growth",
        data: [],
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        tension: 0.4,
        pointBackgroundColor: "#4caf50",
        pointBorderColor: "#ffffff",
        pointRadius: 5,
        fill: true,
      },
      {
        label: "Streaming today",
        data: [],
        borderColor: "#2196f3",
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        tension: 0.4,
        pointBackgroundColor: "#2196f3",
        pointBorderColor: "#ffffff",
        pointRadius: 5,
        fill: true,
      },
      {
        label: "Total Subscribed Users",
        data: [],
        borderColor: "#9c27b0",
        backgroundColor: "rgba(156, 39, 176, 0.2)", // Ensure it fills slightly for better visibility
        tension: 0.4,
        pointBackgroundColor: "#9c27b0",
        pointBorderColor: "#ffffff",
        pointRadius: 5,
        fill: true, // Enable fill for better visualization
      },
    ],
  });

  const firestore = getFirestore();

  useEffect(() => {
    const fetchData = () => {
      const unsubscribe = onSnapshot(
        collection(firestore, "users"),
        (snapshot) => {
          const monthlyCounts = new Array(12).fill(0); // User growth per month
          const streamingCounts = new Array(12).fill(0); // Streaming data per month
          const subscriptionCounts = new Array(12).fill(0); // Subscription growth per month

          let totalSubscribers = 0; // Accumulative subscribers count

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const createdAt = data?.createdAt?.toDate();
            const isStreaming = data?.isStreaming;
            const isSubscribed = data?.subscription?.status === "active";

            if (createdAt) {
              const monthIndex = createdAt.getMonth();
              monthlyCounts[monthIndex]++;
              if (isStreaming) {
                streamingCounts[monthIndex]++;
              }
              if (isSubscribed) {
                subscriptionCounts[monthIndex]++;
              }
            }
          });

          // Accumulate subscription counts to make it grow month by month
          for (let i = 0; i < 12; i++) {
            totalSubscribers += subscriptionCounts[i];
            subscriptionCounts[i] = totalSubscribers;
          }

          // Fetch streams today from watchHistory
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const streamsQuery = query(
            collection(firestore, "watchHistory"),
            where("watchedAt", ">=", today)
          );

          const unsubscribeStreams = onSnapshot(
            streamsQuery,
            (streamsSnapshot) => {
              const currentMonthIndex = today.getMonth();
              const streamsToday = streamsSnapshot.size;
              streamingCounts[currentMonthIndex] += streamsToday;

              setChartData({
                labels: [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
                datasets: [
                  {
                    label: "User Growth",
                    data: monthlyCounts.slice(0, currentMonthIndex + 1),
                    borderColor: "#4caf50",
                    backgroundColor: "rgba(76, 175, 80, 0.2)",
                    tension: 0.4,
                    pointBackgroundColor: "#4caf50",
                    pointBorderColor: "#ffffff",
                    pointRadius: 5,
                    fill: true,
                  },
                  {
                    label: "Streaming today",
                    data: streamingCounts.slice(0, currentMonthIndex + 1),
                    borderColor: "#2196f3",
                    backgroundColor: "rgba(33, 150, 243, 0.2)",
                    tension: 0.4,
                    pointBackgroundColor: "#2196f3",
                    pointBorderColor: "#ffffff",
                    pointRadius: 5,
                    fill: true,
                  },
                  {
                    label: "Total Subscribed Users",
                    data: subscriptionCounts.slice(0, currentMonthIndex + 1),
                    borderColor: "#9c27b0",
                    backgroundColor: "rgba(156, 39, 176, 0.2)", // Light fill for better visibility
                    tension: 0.4,
                    pointBackgroundColor: "#9c27b0",
                    pointBorderColor: "#ffffff",
                    pointRadius: 5,
                    fill: true, // Ensure it has a fill to keep visibility
                  },
                ],
              });
            }
          );

          return () => unsubscribeStreams();
        }
      );

      return () => unsubscribe();
    };

    fetchData();
  }, [firestore]);

  return (
    <div className="graph-container">
      <h2 className="graph-title">
        Monthly User Growth, Streaming, and Total Subscribed Users
      </h2>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}

// ChartJS options for styling
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        color: "#ffffff",
        font: {
          size: 14,
        },
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: "#1e293b",
      titleColor: "#ffffff",
      bodyColor: "#d1d5db",
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#d1d5db" },
    },
    y: {
      grid: { color: "#374151" },
      ticks: { color: "#d1d5db", stepSize: 1 },
    },
  },
};

export default Graph;
