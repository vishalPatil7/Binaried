import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const TMDB_BASE = "https://api.themoviedb.org/3";

router.get("/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const response = await fetch(
      `${TMDB_BASE}/movie/${category}?language=en-US&page=1`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "TMDB request failed" });
  }
});

export default router;
