import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const router = express.Router();
const TMDB_BASE = "https://api.themoviedb.org/3";

async function safeFetch(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });
  return await res.json();
}

async function interpretQuery(prompt) {
  const systemPrompt = `
You convert user movie requests to JSON ONLY.
Support: similar, genre, top_rated, trending, actor, director, vibe, keyword, year_range.
Output:
{
 "type": "...",
 "movie": string|null,
 "genre": string|null,
 "actor": string|null,
 "director": string|null,
 "vibe": string|null,
 "keyword": string|null,
 "years": { "from": number|null, "to": number|null },
 "limit": number
}
Default if unsure: { "type": "top_rated", "limit": 10 }
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
    }),
  });

  const json = await resp.json();
  const raw = json?.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;

  try {
    const cleaned = raw
      .replace(/^\s*```json/i, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (!parsed.type) parsed.type = "top_rated";
    if (!parsed.limit) parsed.limit = 10;
    return parsed;
  } catch {
    return null;
  }
}

function mapVibeToGenre(v) {
  if (!v) return null;
  v = v.toLowerCase();

  if (v.includes("fun") || v.includes("laugh") || v.includes("feel"))
    return "comedy";
  if (v.includes("scifi") || v.includes("space")) return "scifi";
  if (v.includes("thrill") || v.includes("dark") || v.includes("crime"))
    return "thriller";
  if (v.includes("scary") || v.includes("horror")) return "horror";
  if (v.includes("rom") || v.includes("love") || v.includes("emot"))
    return "romance";
  if (v.includes("kids") || v.includes("family") || v.includes("animation"))
    return "animation";

  return null;
}

async function searchMovie(t) {
  const d = await safeFetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(t)}`
  );
  return d?.results?.[0] || null;
}

async function searchPerson(t) {
  const d = await safeFetch(
    `${TMDB_BASE}/search/person?query=${encodeURIComponent(t)}`
  );
  return d?.results?.[0] || null;
}

async function getSimilarMovies(id, limit) {
  const d = await safeFetch(`${TMDB_BASE}/movie/${id}/similar`);
  return d?.results?.slice(0, limit) || [];
}

async function getTopRated(limit) {
  const d = await safeFetch(`${TMDB_BASE}/movie/top_rated`);
  return d?.results?.slice(0, limit) || [];
}

async function getTrending(limit) {
  const d = await safeFetch(`${TMDB_BASE}/trending/movie/week`);
  return d?.results?.slice(0, limit) || [];
}

async function getGenreMovies(g, limit) {
  const map = {
    comedy: 35,
    action: 28,
    thriller: 53,
    horror: 27,
    romance: 10749,
    crime: 80,
    animation: 16,
    scifi: 878,
  };

  const normalized = g?.toLowerCase();
  let id = map[normalized] || map[mapVibeToGenre(normalized)];

  if (!id) {
    if (normalized.includes("fun")) id = 35;
    if (normalized.includes("sci")) id = 878;
    if (normalized.includes("thrill")) id = 53;
    if (normalized.includes("rom")) id = 10749;
  }

  if (!id) return [];
  const d = await safeFetch(
    `${TMDB_BASE}/discover/movie?with_genres=${id}&sort_by=vote_average.desc`
  );
  return d?.results?.slice(0, limit) || [];
}

async function getMoviesByActor(id, limit) {
  const d = await safeFetch(`${TMDB_BASE}/person/${id}/movie_credits`);
  return d?.cast?.slice(0, limit) || [];
}

async function searchKeyword(k) {
  const d = await safeFetch(
    `${TMDB_BASE}/search/keyword?query=${encodeURIComponent(k)}`
  );
  return d?.results?.[0] || null;
}

async function getKeywordMovies(id, limit) {
  const d = await safeFetch(
    `${TMDB_BASE}/discover/movie?with_keywords=${id}&sort_by=popularity.desc`
  );
  return d?.results?.slice(0, limit) || [];
}

router.post("/ai-movie-query", async (req, res) => {
  const { prompt } = req.body;

  try {
    const q = await interpretQuery(prompt);
    const limit = q?.limit || 10;
    let movies = [];

    if (!q) movies = await getTopRated(limit);
    else if (q.type === "similar") {
      const title = q.movie || q.keyword || q.vibe;
      const m = await searchMovie(title);
      movies = m
        ? await getSimilarMovies(m.id, limit)
        : await getTopRated(limit);
    } else if (q.type === "genre" || q.type === "vibe") {
      movies = await getGenreMovies(q.genre || q.vibe, limit);
    } else if (q.type === "actor") {
      const person = await searchPerson(q.actor);
      movies = person ? await getMoviesByActor(person.id, limit) : [];
    } else if (q.type === "director") {
      const person = await searchPerson(q.director);
      if (person) {
        const d = await safeFetch(
          `${TMDB_BASE}/person/${person.id}/movie_credits`
        );
        movies = (d.crew || [])
          .filter((c) => (c.job || "").toLowerCase() === "director")
          .slice(0, limit);
      }
    } else if (q.type === "keyword") {
      const kw = await searchKeyword(q.keyword);
      movies = kw ? await getKeywordMovies(kw.id, limit) : [];
    } else if (q.type === "year_range") {
      const y = q.years || {};
      const from = y.from || 1900;
      const to = y.to || new Date().getFullYear();
      const d = await safeFetch(
        `${TMDB_BASE}/discover/movie?primary_release_date.gte=${from}-01-01&primary_release_date.lte=${to}-12-31&sort_by=popularity.desc`
      );
      movies = d?.results?.slice(0, limit) || [];
    } else if (q.type === "top_rated") movies = await getTopRated(limit);
    else if (q.type === "trending") movies = await getTrending(limit);
    else movies = await getTopRated(limit);

    return res.json({ movies });
  } catch (err) {
    return res.status(500).json({ movies: [], error: "Server error" });
  }
});

export default router;
