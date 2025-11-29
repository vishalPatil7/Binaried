// routes/ai.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch"; // required if Node < 18
dotenv.config();

const router = express.Router();
const TMDB_BASE = "https://api.themoviedb.org/3";

/* ----------------------
   Utility: safeFetch (TMDB)
   Logs responses for debugging
   ---------------------- */
async function safeFetch(url) {
  console.log("TMDB FETCH ->", url);
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
    // optional: set timeout handling in production
  });

  const data = await res.json();
  console.log("TMDB RESULT:", data && typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : data);
  return data;
}

/* ----------------------
   1) Interpret Query via OpenAI
   - Returns parsed JSON or null
   ---------------------- */
async function interpretQuery(prompt) {
  console.log("INTERPRET: prompt=", prompt);

  // System prompt instructs the model to return strict JSON
  const systemPrompt = `
You are a movie query interpreter. Convert user input into JSON ONLY.
Accept typos, vague phrasing, moods, and themes. Return one JSON object.

VALID types: similar, genre, top_rated, trending, actor, director, vibe, keyword, year_range, keyword

Output schema:
{
  "type": "similar | genre | top_rated | trending | actor | director | vibe | keyword | year_range",
  "movie": string | null,
  "genre": string | null,
  "actor": string | null,
  "director": string | null,
  "vibe": string | null,
  "keyword": string | null,
  "years": { "from": number|null, "to": number|null },
  "limit": number
}

If you're not sure, return:
{ "type": "top_rated", "limit": 10 }
`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 400,
    }),
  });

  const aiJson = await resp.json();
  console.log("RAW AI RESPONSE:", aiJson && aiJson.choices ? (aiJson.choices[0]?.message?.content || "") : aiJson);

  // Try to safely parse returned content
  const raw = aiJson?.choices?.[0]?.message?.content;
  if (!raw) {
    console.log("No AI content returned");
    return null;
  }

  try {
    // Trim and parse JSON only region if model returns code fences or text
    const jsonText = raw.trim()
      .replace(/^\s*```json\s*/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(jsonText);
    // Ensure at least a type or fallback
    if (!parsed.type) {
      parsed.type = "top_rated";
      parsed.limit = parsed.limit || 10;
    }
    return parsed;
  } catch (err) {
    console.log("AI parse error:", err, "raw:", raw);
    return null;
  }
}

/* ----------------------
   2) Vibe/Genre fuzzy mapping
   ---------------------- */
function mapVibeToGenre(vibeOrGenre) {
  if (!vibeOrGenre) return null;
  const v = String(vibeOrGenre).toLowerCase();

  if (v.includes("fun") || v.includes("laugh") || v.includes("feel good") || v.includes("light"))
    return "comedy";

  if (v.includes("scifi") || v.includes("sci-fi") || v.includes("space") || v.includes("spacey"))
    return "scifi";

  if (v.includes("thrill") || v.includes("suspense") || v.includes("dark") || v.includes("crime"))
    return "thriller";

  if (v.includes("horror") || v.includes("scary") || v.includes("spooky"))
    return "horror";

  if (v.includes("romance") || v.includes("love") || v.includes("emotional") || v.includes("romantic"))
    return "romance";

  if (v.includes("children") || v.includes("kids") || v.includes("family") || v.includes("animation"))
    return "animation";

  if (v.includes("classic") || v.includes("old") || v.includes("classic cinema"))
    return "classic"; // fallback mapping may ignore this

  return null;
}

/* ----------------------
   3) TMDB: Search & helper methods
   ---------------------- */
async function searchMovie(title) {
  if (!title) return null;
  const data = await safeFetch(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}`);
  if (!data || !Array.isArray(data.results) || data.results.length === 0) return null;
  return data.results[0];
}

async function searchPerson(name) {
  if (!name) return null;
  const data = await safeFetch(`${TMDB_BASE}/search/person?query=${encodeURIComponent(name)}`);
  return data?.results?.[0] || null;
}

async function getSimilarMovies(movieId, limit = 10) {
  if (!movieId) return [];
  const data = await safeFetch(`${TMDB_BASE}/movie/${movieId}/similar`);
  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

async function getTopRated(limit = 10) {
  const data = await safeFetch(`${TMDB_BASE}/movie/top_rated`);
  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

async function getTrending(limit = 10) {
  const data = await safeFetch(`${TMDB_BASE}/trending/movie/week`);
  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

async function getGenreMovies(genreName, limit = 10) {
  const genreMap = {
    comedy: 35,
    action: 28,
    thriller: 53,
    horror: 27,
    romance: 10749,
    crime: 80,
    animation: 16,
    scifi: 878,
  };

  const normalized = (genreName || "").toLowerCase();
  let mapped = genreMap[normalized] || genreMap[mapVibeToGenre(normalized)];

  // fallback fuzzy checks
  if (!mapped) {
    if (normalized.includes("comedy") || normalized.includes("fun")) mapped = genreMap["comedy"];
    if (normalized.includes("sci") || normalized.includes("space")) mapped = genreMap["scifi"];
    if (normalized.includes("thrill") || normalized.includes("crime") || normalized.includes("dark")) mapped = genreMap["thriller"];
    if (normalized.includes("rom") || normalized.includes("love") || normalized.includes("emot")) mapped = genreMap["romance"];
  }

  if (!mapped) return [];

  const data = await safeFetch(`${TMDB_BASE}/discover/movie?with_genres=${mapped}&sort_by=vote_average.desc`);
  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

async function getMoviesByActor(actorId, limit = 10) {
  if (!actorId) return [];
  const data = await safeFetch(`${TMDB_BASE}/person/${actorId}/movie_credits`);
  // cast array contains roles; sort/pick by popularity
  return Array.isArray(data.cast) ? data.cast.slice(0, limit) : [];
}

/* Keyword helpers */
async function searchKeyword(keyword) {
  if (!keyword) return null;
  const data = await safeFetch(`${TMDB_BASE}/search/keyword?query=${encodeURIComponent(keyword)}`);
  return data?.results?.[0] || null;
}

async function getKeywordMovies(keywordId, limit = 10) {
  if (!keywordId) return [];
  const data = await safeFetch(`${TMDB_BASE}/discover/movie?with_keywords=${keywordId}&sort_by=popularity.desc`);
  return Array.isArray(data.results) ? data.results.slice(0, limit) : [];
}

/* ----------------------
   4) Main Route Handler
   ---------------------- */
router.post("/ai-movie-query", async (req, res) => {
  const { prompt } = req.body;
  console.log("API: prompt ->", prompt);

  if (!prompt) return res.status(400).json({ movies: [], error: "No prompt provided" });

  try {
    const q = await interpretQuery(prompt);
    console.log("INTERPRETED:", q);

    if (!q) {
      // fallback: return top rated
      const fallback = await getTopRated(10);
      return res.json({ movies: fallback });
    }

    const limit = q.limit || 10;
    let movies = [];

    // 1) SIMILAR
    if (q.type === "similar") {
      const title = q.movie || q.keyword || q.vibe;
      if (!title) {
        movies = await getTopRated(limit);
      } else {
        const found = await searchMovie(title);
        if (!found) movies = await getTopRated(limit); // fallback
        else movies = await getSimilarMovies(found.id, limit);
      }
    }

    // 2) GENRE (includes vibes)
    else if (q.type === "genre" || q.type === "vibe") {
      const genreName = q.genre || q.vibe;
      if (!genreName) movies = await getTopRated(limit);
      else movies = await getGenreMovies(genreName, limit);
    }

    // 3) ACTOR
    else if (q.type === "actor") {
      const actorName = q.actor;
      if (!actorName) movies = [];
      else {
        const person = await searchPerson(actorName);
        if (!person) movies = [];
        else movies = await getMoviesByActor(person.id, limit);
      }
    }

    // 4) DIRECTOR (use person search then filter by job=Director via credits)
    else if (q.type === "director") {
      const dirName = q.director;
      if (!dirName) movies = [];
      else {
        const person = await searchPerson(dirName);
        if (!person) movies = [];
        else {
          // fetch movie_credits and filter crew where job === "Director"
          const data = await safeFetch(`${TMDB_BASE}/person/${person.id}/movie_credits`);
          const directed = (data.crew || []).filter((c) => (c.job || "").toLowerCase() === "director");
          movies = directed.slice(0, limit);
        }
      }
    }

    // 5) KEYWORD (theme-based)
    else if (q.type === "keyword") {
      const kw = q.keyword;
      if (!kw) movies = [];
      else {
        const found = await searchKeyword(kw);
        if (!found) movies = [];
        else movies = await getKeywordMovies(found.id, limit);
      }
    }

    // 6) YEAR RANGE
    else if (q.type === "year_range") {
      const years = q.years || {};
      const from = years.from || 1900;
      const to = years.to || new Date().getFullYear();
      const url = `${TMDB_BASE}/discover/movie?primary_release_date.gte=${from}-01-01&primary_release_date.lte=${to}-12-31&sort_by=popularity.desc`;
      const data = await safeFetch(url);
      movies = Array.isArray(data.results) ? data.results.slice(0, limit) : [];
    }

    // 7) TOP RATED
    else if (q.type === "top_rated") {
      movies = await getTopRated(limit);
    }

    // 8) TRENDING
    else if (q.type === "trending") {
      movies = await getTrending(limit);
    }

    // 9) fallback
    else {
      movies = await getTopRated(limit);
    }

    console.log("RESULT COUNT:", movies?.length || 0);
    return res.json({ movies: movies || [] });
  } catch (err) {
    console.error("AI route error:", err);
    return res.status(500).json({ movies: [], error: "Server error" });
  }
});

export default router;
