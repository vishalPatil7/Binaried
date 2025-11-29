import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const TMDB_BASE = "https://api.themoviedb.org/3";

// ------------------------------------------
// 1) Interpret Query using OpenAI
// ------------------------------------------
async function interpretQuery(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a movie query interpreter. Convert user text into structured JSON. DO NOT hallucinate movies. ONLY return JSON in this format:\n\n" +
            `{
              "type": "similar | genre | top_rated | trending",
              "movie": "string or null",
              "genre": "string or null",
              "limit": number
             }`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// ------------------------------------------
// 2) TMDB helpers
// ------------------------------------------
async function searchMovie(title) {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}`,
    {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      },
    }
  );

  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  return data.results[0];
}

async function getSimilarMovies(movieId, limit) {
  const res = await fetch(`${TMDB_BASE}/movie/${movieId}/similar`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });

  const data = await res.json();

  if (!data.results) return [];

  return data.results.slice(0, limit);
}

async function getTopRated(limit) {
  const res = await fetch(`${TMDB_BASE}/movie/top_rated`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });

  const data = await res.json();

  if (!data.results) return [];

  return data.results.slice(0, limit);
}

async function getGenreMovies(genreName, limit) {
  const genreMap = {
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

  const id = genreMap[genreName.toLowerCase()];
  if (!id) return [];

  const res = await fetch(
    `${TMDB_BASE}/discover/movie?with_genres=${id}&sort_by=vote_average.desc`,
    {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      },
    }
  );

  const data = await res.json();

  if (!data.results) return [];

  return data.results.slice(0, limit);
}

// ------------------------------------------
// 3) Main Route Handler
// ------------------------------------------
router.post("/ai-movie-query", async (req, res) => {
  const { prompt } = req.body;

  try {
    // Step 1: interpret
    const query = await interpretQuery(prompt);

    let movies = [];

    if (query.type === "similar" && query.movie) {
      const searched = await searchMovie(query.movie);
      if (searched) {
        movies = await getSimilarMovies(searched.id, query.limit);
      }
    }

    if (query.type === "top_rated") {
      movies = await getTopRated(query.limit);
    }

    if (query.type === "genre" && query.genre) {
      movies = await getGenreMovies(query.genre, query.limit);
    }

    return res.json({ movies });
  } catch (error) {
    console.log("AI movie query error:", error);
    return res.status(500).json({ error: "AI handler failed" });
  }
});

export default router;
