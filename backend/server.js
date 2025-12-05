import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import trendingRoute from "./routes/trending.js";
import genreRoute from "./routes/genre.js";
import imageRoute from "./routes/image.js";
import aiRoute from "./routes/ai.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mount Routes
app.use("/api", trendingRoute);
app.use("/api", genreRoute);
app.use("/api", imageRoute);
app.use("/api", aiRoute);

app.listen(3000, () => console.log("Proxy running on port 3000"));
