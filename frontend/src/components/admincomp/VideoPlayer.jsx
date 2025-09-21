import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; // Adjust the path to your Firebase config
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import "./VideoPlayer.css";

const VideoUploadt = () => {
  const [videos, setVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [newThumbnailFile, setNewThumbnailFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["Action", "Comedy", "Drama", "Documentary", "Horror"];

  // Fetch videos from Firestore
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const videosSnapshot = await getDocs(collection(db, "videos"));
      const videosData = videosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(videosData);
      setMessage("");
    } catch (error) {
      console.error("Error fetching videos:", error);
      setMessage("Error fetching video list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Handle editing a video
  const handleEdit = (video) => setEditingVideo(video);

  // Handle updating a video in Firestore via backend (with optional new thumbnail)
  const handleUpdate = async () => {
    if (!editingVideo) return;

    setIsLoading(true);
    try {
      // Use FormData to include files
      const formData = new FormData();
      formData.append("title", editingVideo.title);
      formData.append("description", editingVideo.description);
      formData.append("status", editingVideo.status);
      formData.append("category", editingVideo.category);
      // If a new thumbnail is selected, include it in the request
      if (newThumbnailFile) {
        formData.append("thumbnail", newThumbnailFile);
      }

      const response = await fetch(
        `http://localhost:5000/video/update/${editingVideo.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        setMessage("Video metadata updated successfully!");
        fetchVideos(); // Refresh the video list
        setEditingVideo(null);
        setNewThumbnailFile(null);
      } else {
        throw new Error("Failed to update video metadata");
      }
    } catch (error) {
      console.error("Error updating video metadata:", error);
      setMessage("Error updating video metadata. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deactivating a video
  const handleDeactivate = async (video) => {
    if (!window.confirm("Are you sure you want to deactivate this video?"))
      return;

    setIsLoading(true);
    try {
      const videoRef = doc(db, "videos", video.id);
      await updateDoc(videoRef, { status: "inactive" });

      // Update local state to reflect the change
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.id === video.id ? { ...v, status: "inactive" } : v
        )
      );
      setMessage("Video deactivated successfully!");
    } catch (error) {
      console.error("Error deactivating video:", error);
      setMessage("Error deactivating video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Uploaded Videos</h2>
      {message && (
        <p className={`upload-message ${isLoading ? "loading" : ""}`}>
          {message}
        </p>
      )}

      <table className="video-table">
        <thead>
          <tr className="th">
            <th>Thumbnail</th>
            <th>Video Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Category</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id}>
              <td>
                <img
                  src={video.thumbnailUrl}
                  alt="Thumbnail"
                  className="thumbnail-image"
                />
                {editingVideo?.id === video.id && (
                  <div className="reupload-section">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewThumbnailFile(e.target.files[0])}
                      id={`thumbnail-upload-${video.id}`}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor={`thumbnail-upload-${video.id}`}
                      className="reupload-button"
                    >
                      Reupload
                    </label>
                  </div>
                )}
              </td>
              <td>
                {editingVideo?.id === video.id ? (
                  <input
                    type="text"
                    value={editingVideo.title}
                    onChange={(e) =>
                      setEditingVideo({
                        ...editingVideo,
                        title: e.target.value,
                      })
                    }
                  />
                ) : (
                  video.title
                )}
              </td>
              <td>
                {editingVideo?.id === video.id ? (
                  <textarea
                    value={editingVideo.description}
                    onChange={(e) =>
                      setEditingVideo({
                        ...editingVideo,
                        description: e.target.value,
                      })
                    }
                  />
                ) : (
                  video.description
                )}
              </td>
              <td>
                {editingVideo?.id === video.id ? (
                  <select
                    value={editingVideo.status}
                    onChange={(e) =>
                      setEditingVideo({
                        ...editingVideo,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                ) : (
                  video.status
                )}
              </td>
              <td>
                {editingVideo?.id === video.id ? (
                  <select
                    value={editingVideo.category}
                    onChange={(e) =>
                      setEditingVideo({
                        ...editingVideo,
                        category: e.target.value,
                      })
                    }
                  >
                    {categories.map((categoryOption, index) => (
                      <option key={index} value={categoryOption}>
                        {categoryOption}
                      </option>
                    ))}
                  </select>
                ) : (
                  video.category
                )}
              </td>
              <td>
                {editingVideo?.id === video.id ? (
                  <button className="save" onClick={handleUpdate}>
                    Save
                  </button>
                ) : (
                  <>
                    <button
                      className="edit-1"
                      onClick={() => handleEdit(video)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(video)}
                      disabled={video.status === "inactive"}
                      className="deactivate-button1"
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

export default VideoUploadt;
