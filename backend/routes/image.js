import express from "express";
const router = express.Router();

const TMDB_BASE = "https://image.tmdb.org/t/p";

router.get("/:size/*", (req, res) => {
  const { size } = req.params;

  let filePath = req.params[0];

  if (!filePath.startsWith("/")) {
    filePath = "/" + filePath;
  }

  const finalUrl = `${TMDB_BASE}/${size}${filePath}`;

  return res.json({ url: finalUrl });
});

export default router;
