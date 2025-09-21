import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./Banner.css";

function Banner() {
  const [movie, setMovie] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
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

  // Fetch movie data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(collection(db, "videos"));
        const videos = snapshot.docs
          .map((doc) => doc.data())
          .filter((video) => video.status === "active");

        if (videos.length > 0) {
          const randomMovie = videos[Math.floor(Math.random() * videos.length)];
          setMovie(randomMovie);
        } else {
          setError("No active videos available. Please upload some.");
        }
      } catch (error) {
        console.log("Error fetching movie data:", error);
        setError("Failed to load movie data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if user is admin and fetch subscription status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setIsAdmin(userData.role === "admin");
          setSubscriptionStatus(userData.subscription?.status || "inactive");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Format timestamp to include date and time (HH:MM)
  const formatTimestamp = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Handle play button click, add movie to watch history with date & time
  const handlePlayClick = async (movie) => {
    if (!isAdmin && subscriptionStatus !== "active") {
      navigate("/checkout");
      return;
    }

    const currentUser = auth.currentUser;
    if (currentUser && movie?.fileUrl) {
      try {
        const historyRef = doc(collection(db, "history"));
        await setDoc(historyRef, {
          userId: currentUser.uid,
          title: movie.title || movie.name || movie.original_name,
          watchedAt: formatTimestamp(new Date()), // Store formatted date & time
          url: movie.fileUrl,
        });
      } catch (err) {
        console.error("Error adding to watch history:", err);
      }
    }

    if (videoUrl) {
      setVideoUrl("");
    } else if (movie?.fileUrl) {
      setVideoUrl(movie.fileUrl);
    } else {
      setError("No main video available for this movie.");
    }
  };

  // Handle trailer button click
  const handleTrailerClick = (movie) => {
    if (trailerUrl) {
      setTrailerUrl("");
    } else if (movie?.trailerUrl) {
      setTrailerUrl(movie.trailerUrl);
    } else {
      setError("No trailer available for this video.");
    }
  };

  // Truncate text
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (
    <div>
      {loading && <p>Loading movie data...</p>}
      {error && <p className="error-message">{error}</p>}

      {movie && (
        <header
          className="banner"
          style={{
            backgroundSize: "cover",
            backgroundImage: `url(${
              movie?.thumbnailUrl && isValidUrl(movie.thumbnailUrl)
                ? movie.thumbnailUrl
                : "https://via.placeholder.com/1920x1080"
            })`,
            backgroundPosition: "center center",
          }}
          onError={(e) => {
            e.target.style.backgroundImage = `url("https://via.placeholder.com/1920x1080")`;
          }}
        >
          <div className="banner_content">
            <h1 className="banner_title">
              {movie?.title || movie?.name || movie?.original_name}
            </h1>
            <div>
              <button
                className="banner_button"
                onClick={() => handlePlayClick(movie)}
              >
                PLAY
              </button>
              <button
                className="banner_button"
                onClick={() => handleTrailerClick(movie)}
              >
                TRAILER
              </button>
            </div>
            <h1 className="banner_description">
              {truncate(movie?.description || movie?.overview, 150)}
            </h1>
          </div>
          <div className="banner--fadeBottom" />
        </header>
      )}

      {videoUrl && (
        <div className="video-container">
          <video controls width="100%" height="390" autoPlay>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {trailerUrl && (
        <div className="trailer-container">
          <video controls width="100%" height="390" autoPlay>
            <source src={trailerUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}

export default Banner;
