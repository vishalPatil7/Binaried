import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const TMDB_BASE = "https://api.themoviedb.org/3";

/* ---------------------------------------------------
   HELPER: Interpret Query with OpenAI
---------------------------------------------------- */
async function interpretQuery(prompt) {
  console.log("INTERPRET QUERY START: ", prompt);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // FINAL CORRECT MODEL
      messages: [
        {
          role: "system",
          content:
            "You are a movie query interpreter. Convert user text into JSON ONLY:\n" +
            '{ "type": "similar | genre | top_rated", "movie": string|null, "genre": string|null, "limit": number }',
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    }),
  });

  const ai = await response.json();
  console.log("RAW AI RESPONSE:", ai);

  let parsed;
  try {
    parsed = JSON.parse(ai.choices[0]?.message?.content || "{}");
  } catch (err) {
    console.log("AI JSON PARSE FAILED:", err);
    return null;
  }

  console.log("PARSED QUERY:", parsed);
  return parsed;
}

/* ---------------------------------------------------
   TMDB: Safe fetch wrapper
---------------------------------------------------- */
async function safeFetch(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });

  const data = await res.json();
  console.log("TMDB:", url, "->", data);

  return data;
}

/* ---------------------------------------------------
   Actual TMDB helpers
---------------------------------------------------- */
async function searchMovie(title) {
  const data = await safeFetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}`
  );

  if (!data.results || data.results.length === 0) return null;
  return data.results[0];
}

async function getSimilarMovies(id, limit) {
  const data = await safeFetch(`${TMDB_BASE}/movie/${id}/similar`);
  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

async function getTopRated(limit) {
  const data = await safeFetch(`${TMDB_BASE}/movie/top_rated`);
  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

async function getGenreMovies(genre, limit) {
  const map = {
    comedy: 35,
    action: 28,
    thriller: 53,
    horror: 27,
    romance: 10749,
    crime: 80,
    animation: 16,
    scifi: 878,
    "sci-fi": 878,
  };

  const id = map[genre.toLowerCase()];
  if (!id) return [];

  const data = await safeFetch(
    `${TMDB_BASE}/discover/movie?with_genres=${id}&sort_by=vote_average.desc`
  );

  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

/* ---------------------------------------------------
   MAIN ROUTE
---------------------------------------------------- */
router.post("/ai-movie-query", async (req, res) => {
  const { prompt } = req.body;

  console.log("USER PROMPT RECEIVED:", prompt);

  try {
    const query = await interpretQuery(prompt);

    if (!query) {
      return res.status(400).json({ movies: [], error: "Invalid AI format" });
    }

    let movies = [];

    // SIMILAR MOVIES
    if (query.type === "similar") {
      if (!query.movie) return res.json({ movies: [] });

      const found = await searchMovie(query.movie);
      if (!found) return res.json({ movies: [] });

      movies = await getSimilarMovies(found.id, query.limit);
    }

    // TOP RATED
    if (query.type === "top_rated") {
      movies = await getTopRated(query.limit);
    }

    // GENRE
    if (query.type === "genre") {
      if (!query.genre) return res.json({ movies: [] });
      movies = await getGenreMovies(query.genre, query.limit);
    }

    console.log("FINAL MOVIES:", movies);

    return res.json({ movies });
  } catch (error) {
    console.log("SERVER ERROR:", error, error.stack);
    return res.status(500).json({ movies: [], error: "AI handler failed" });
  }
});

export default router;
