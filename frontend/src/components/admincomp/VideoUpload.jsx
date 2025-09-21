import React, { useState } from "react";
import "./VideoUpload.css";

const VideoUpload = ({ onVideoUpload }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["Action", "Comedy", "Drama", "Documentary", "Horror"];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) setVideoFile(file);
    else setMessage("Please select a valid video file.");
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) setThumbnailFile(file);
    else setMessage("Please select a valid image file for the thumbnail.");
  };

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleStatusChange = (e) => setStatus(e.target.value);
  const handleCategoryChange = (e) => setCategory(e.target.value);

  const resetFields = () => {
    setTitle("");
    setDescription("");
    setVideoFile(null);
    setThumbnailFile(null);
    setTrailerFile(null);
    setStatus("active");
    setCategory("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !title || !description || !thumbnailFile || !category) {
      setMessage(
        "Please fill in all fields, including the thumbnail and category."
      );
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("thumbnail", thumbnailFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("status", status);
      formData.append("category", category);

      if (trailerFile) {
        formData.append("trailerFile", trailerFile);
      }

      const response = await fetch("http://localhost:5000/video/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Upload successful!");
        resetFields();
        if (typeof onVideoUpload === "function")
          onVideoUpload(result.video.fileUrl);
      } else throw new Error(result.message || "Upload failed");
    } catch (error) {
      console.error("Error uploading video:", error);
      setMessage("Error uploading video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Video</h2>
      {message && (
        <p className={`upload-message ${isLoading ? "loading" : ""}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Status:</label>
          <select value={status} onChange={handleStatusChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category:</label>
          <select value={category} onChange={handleCategoryChange} required>
            <option value="">Select Category</option>
            {categories.map((categoryOption, index) => (
              <option key={index} value={categoryOption}>
                {categoryOption}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Video File:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Thumbnail [ PNG ]:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Trailer Video File:</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.type.startsWith("video/")) setTrailerFile(file);
              else setMessage("Please select a valid trailer video file.");
            }}
          />
        </div>
        <button type="submit" className="upload-button" disabled={isLoading}>
          {isLoading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload;