import express from "express";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";

router.get("/bundle", async (req, res) => {
  try {
    const urls = {
      trending: `${TMDB_BASE}/movie/now_playing?language=en-US&page=1`,
      popular: `${TMDB_BASE}/movie/popular?language=en-US&page=1`,
      top_rated: `${TMDB_BASE}/movie/top_rated?language=en-US&page=1`,
      upcoming: `${TMDB_BASE}/movie/upcoming?language=en-US&page=1`,
    };

    const headers = {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    };

    const requests = Object.entries(urls).map(([key, url]) =>
      fetch(url, { headers }).then((r) => r.json())
    );

    const results = await Promise.all(requests);

    res.json({
      trending: results[0].results,
      popular: results[1].results,
      top_rated: results[2].results,
      upcoming: results[3].results,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "TMDB parallel fetch failed" });
  }
});

export default router;
