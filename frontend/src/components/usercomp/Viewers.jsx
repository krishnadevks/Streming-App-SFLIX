import React, { useEffect, useState, useRef } from "react";
import "./Viewers.css";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  getFirestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const TbDetails = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Admin state
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive"); // Subscription status

  const videoRef = useRef(null);
  const firestore = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();

  // Helper function to validate URLs
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Helper function to format timestamp as "YYYY-MM-DD HH:MM"
  const formatTimestamp = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Fetch videos from Firestore
  const fetchVideos = async () => {
    try {
      const videosCollection = collection(firestore, "videos");
      const videoSnapshot = await getDocs(videosCollection);
      const videoData = videoSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((video) => video.status === "active"); // Filter out inactive videos

      setVideos(videoData);
    } catch (error) {
      console.error("Error fetching video data:", error);
      setError("Failed to fetch video details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin and fetch subscription status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setIsAdmin(userData.role === "admin");
          setSubscriptionStatus(userData.subscription?.status || "inactive");
        }
      }
    });

    return () => unsubscribe();
  }, [firestore]);

  // Handle video click
  const handleVideoClick = async (video) => {
    // Check subscription status or admin role
    if (!isAdmin && subscriptionStatus !== "active") {
      navigate("/checkout"); // Redirect to checkout page
      return;
    }

    setSelectedVideo(video.fileUrl);
    setIsModalOpen(true);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await addDoc(collection(firestore, "history"), {
          userId: currentUser.uid,
          title: video.title,
          fileUrl: video.fileUrl,
          watchedAt: formatTimestamp(new Date()), // Formatted date & time
        });
      } catch (err) {
        console.error("Error saving watch history:", err);
      }
    }
  };

  // Handle trailer click
  const handleTrailerClick = (trailerUrl) => {
    setSelectedTrailer(trailerUrl);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
    setSelectedTrailer(null);
  };

  // Auto-play video when modal opens
  useEffect(() => {
    if ((selectedVideo || selectedTrailer) && videoRef.current) {
      videoRef.current.src = selectedVideo || selectedTrailer;
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    }
  }, [selectedVideo, selectedTrailer]);

  // Group videos by category
  const groupVideosByCategory = () => {
    const groupedVideos = {};
    videos.forEach((video) => {
      if (!groupedVideos[video.category]) {
        groupedVideos[video.category] = [];
      }
      groupedVideos[video.category].push(video);
    });
    return groupedVideos;
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const groupedVideos = groupVideosByCategory();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="tb-details-container">
      <h2 className="h2">AVAILABLE NOW</h2>

      {Object.keys(groupedVideos).map((category) => (
        <div key={category}>
          <h3 className="category-heading">{category}</h3>
          <div className="video-row">
            {groupedVideos[category].map((video) => (
              <div key={video.id} className="video-card">
                <img
                  className="video-thumbnail"
                  src={video.thumbnailUrl}
                  alt={video.title}
                  onClick={() => handleVideoClick(video)}
                />
                <div className="video-title">{video.title}</div>
                <button
                  className="trailer-button"
                  onClick={() => handleTrailerClick(video.trailerUrl)}
                >
                  TRAILER
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {isModalOpen && (
        <div className="video-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={closeModal}>
              &times;
            </button>
            <h3>Now Playing:</h3>
            <video
              ref={videoRef}
              controls
              width="640"
              height="360"
              autoPlay
              src={selectedTrailer || (isAdmin || subscriptionStatus === "active" ? selectedVideo : null)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};

export default TbDetails;
