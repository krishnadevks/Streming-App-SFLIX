import React, { useState, useEffect } from "react";

const VideoPlayer = ({ videoUrl }) => {
  return (
    <div className="video-player-container">
      <h2>Video Player</h2>
      <video controls width="640" height="360" src={videoUrl} />
    </div>
  );
};

export default VideoPlayer;
