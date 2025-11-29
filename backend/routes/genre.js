import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const TMDB_BASE = "https://api.themoviedb.org/3";

router.get("/genre/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(
      `${TMDB_BASE}/discover/movie?with_genres=${id}&language=en-US`,
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
    console.log(error);
    res.status(500).json({ error: "Genre API failed" });
  }
});

export default router;
