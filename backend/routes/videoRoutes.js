const express = require("express");
const multer = require("multer");
const { uploadToR2 } = require("../Uploadserver");
const fs = require("fs").promises;
const path = require("path");
const admin = require("firebase-admin");

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
(async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    console.error("Error creating uploads directory:", err);
  }
})();

const videoRoutes = (db) => {
  const router = express.Router();
  const videosCollection = db.collection("videos");

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });

  const upload = multer({ storage });

  // Video Upload Route (with Thumbnail, Trailer, Status, and Category)
  router.post(
    "/upload",
    upload.fields([
      { name: "file" }, // Main video file
      { name: "thumbnail" }, // Thumbnail file
      { name: "trailerFile" }, // Trailer video file
    ]),
    async (req, res) => {
      try {
        const { title, description, status, category } = req.body; // Include category in the request body
        const videoFile = req.files?.file?.[0];
        const thumbnailFile = req.files?.thumbnail?.[0];
        const trailerFile = req.files?.trailerFile?.[0]; // New trailer file

        // Validate input (trailerFile is optional)
        if (
          !title ||
          !description ||
          !status ||
          !category ||
          !videoFile ||
          !thumbnailFile
        ) {
          return res.status(400).json({
            message:
              "All fields, including the thumbnail, status, and category, are required",
          });
        }

        // Upload main video to Cloudflare R2
        const videoResult = await uploadToR2(
          videoFile.path,
          videoFile.filename
        );
        const videoUrl = `https://pub-6dd4b238315b4e83bc98ef3f35507357.r2.dev/upload/${videoFile.filename}`;

        if (!videoResult.Location || !videoUrl) {
          throw new Error("Failed to retrieve video URL from R2");
        }

        // Upload thumbnail to Cloudflare R2
        const thumbnailResult = await uploadToR2(
          thumbnailFile.path,
          thumbnailFile.filename
        );
        const thumbnailUrl = `https://pub-6dd4b238315b4e83bc98ef3f35507357.r2.dev/upload/${thumbnailFile.filename}`;

        if (!thumbnailResult.Location || !thumbnailUrl) {
          throw new Error("Failed to retrieve thumbnail URL from R2");
        }

        // Upload trailer video to Cloudflare R2 (if provided)
        let trailerUrl = null;
        if (trailerFile) {
          const trailerResult = await uploadToR2(
            trailerFile.path,
            trailerFile.filename
          );
          trailerUrl = `https://pub-6dd4b238315b4e83bc98ef3f35507357.r2.dev/upload/${trailerFile.filename}`;

          if (!trailerResult.Location || !trailerUrl) {
            throw new Error("Failed to retrieve trailer URL from R2");
          }
        }

        // Clean up local files
        await fs.unlink(videoFile.path);
        await fs.unlink(thumbnailFile.path);
        if (trailerFile) await fs.unlink(trailerFile.path);

        // Prepare video metadata for Firestore (including status, trailer URL, and category)
        const videoData = {
          title,
          description,
          fileUrl: videoUrl,
          thumbnailUrl: thumbnailUrl, // Store thumbnail URL in Firestore
          status, // Include the status in the Firestore document
          trailerUrl, // Store trailer URL in Firestore (if provided)
          category, // Include category in the Firestore document
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Save metadata to Firestore
        const docRef = await videosCollection.add(videoData);

        // Respond with the video data
        res.status(201).json({
          message: "Video uploaded successfully",
          videoId: docRef.id,
          video: videoData,
        });
      } catch (error) {
        console.error("Error during upload:", error);
        res
          .status(500)
          .json({ message: "Error uploading video", error: error.message });
      }
    }
  );

  // Fetch video list
  router.get("/videos", async (req, res) => {
    try {
      // Query Firestore for the video collection
      const snapshot = await videosCollection
        .orderBy("createdAt", "desc")
        .get();
      const videos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res
        .status(500)
        .json({ message: "Error fetching videos", error: error.message });
    }
  });

  // Update video metadata (including thumbnail reupload)
  router.put(
    "/video/update/:id",
    upload.single("thumbnail"),
    async (req, res) => {
      const { id } = req.params;
      const { title, description, status, category } = req.body;
      const thumbnailFile = req.file;

      try {
        if (!title || !description || !status || !category) {
          return res.status(400).json({ message: "All fields are required" });
        }

        const docRef = videosCollection.doc(id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
          return res.status(404).json({ message: "Video not found" });
        }

        const updateData = {
          title,
          description,
          status,
          category,
        };

        // If a new thumbnail is uploaded, update it
        if (thumbnailFile) {
          const thumbnailResult = await uploadToR2(
            thumbnailFile.path,
            thumbnailFile.filename
          );
          const thumbnailUrl = `https://pub-6dd4b238315b4e83bc98ef3f35507357.r2.dev/upload/${thumbnailFile.filename}`;

          if (!thumbnailResult.Location || !thumbnailUrl) {
            throw new Error("Failed to retrieve thumbnail URL from R2");
          }

          updateData.thumbnailUrl = thumbnailUrl;
          await fs.unlink(thumbnailFile.path); // Clean up local file
        }

        await docRef.update(updateData);

        res
          .status(200)
          .json({ message: "Video metadata updated successfully!" });
      } catch (error) {
        console.error("Error updating video metadata:", error);
        res.status(500).json({ message: "Failed to update video metadata" });
      }
    }
  );

  // Update video status (separate route for status only)
  router.put("/video/status/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      // Validate input: Check if status is provided
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const docRef = videosCollection.doc(id);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Update the video status
      await docRef.update({
        status,
      });

      res.status(200).json({ message: "Video status updated successfully!" });
    } catch (error) {
      console.error("Error updating video status:", error);
      res.status(500).json({ message: "Failed to update video status" });
    }
  });

  // Delete video metadata route (without deleting the video from Cloudflare R2)
  router.delete("/video/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
      // Log the incoming request
      console.log("Deleting video metadata with ID:", id);

      // Delete the video's metadata from Firebase
      const docRef = videosCollection.doc(id);
      await docRef.delete();
      console.log("Deleted metadata from Firestore.");

      // Respond with success message
      res.status(200).json({ message: "Video metadata deleted successfully" });
    } catch (error) {
      console.error("Error deleting video metadata:", error);
      res.status(500).json({ message: "Failed to delete video metadata" });
    }
  });

  return router;
};

module.exports = videoRoutes;
