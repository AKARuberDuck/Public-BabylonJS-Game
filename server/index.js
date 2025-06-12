const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();

require("dotenv").config(); // Optional if running locally

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// GitHub Repo Info
const GITHUB_REPO = "AKARuberDuck/Public-BabylonJS-Game";
const FILE_PATH = "public/highscores.json";
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.post("/submit-score", async (req, res) => {
  const { name, score } = req.body;

  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid score submission" });
  }

  try {
    // Fetch current file from GitHub
    const getRes = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    const fileData = await getRes.json();
    const currentScores = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // Append new score
    currentScores.push({ name, score });

    // Prepare updated content
    const updatedContent = Buffer.from(JSON.stringify(currentScores, null, 2)).toString("base64");

    // Commit changes to GitHub
    const updateRes = await fetch(API_URL, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: `Add score for ${name}`,
        content: updatedContent,
        sha: fileData.sha
      })
    });

    if (!updateRes.ok) throw new Error("Failed to commit changes");

    res.status(200).json({ success: true, message: "Score submitted" });
  } catch (error) {
    console.error("Error updating scores:", error.message);
    res.status(500).json({ error: "Failed to update scores" });
  }
});

// Optional: health check
app.get("/", (req, res) => {
  res.send("Score API is running ✅");
});

app.listen(PORT, () => {
  console.log(`Score server running on port ${PORT}`);
});
