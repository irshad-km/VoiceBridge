import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";


import pageRoutes from "./routes/pageRoutes.js";
import translateRoutes from "./routes/translateRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();
// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Public folder
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", pageRoutes);
app.use("/api", translateRoutes);


// Start server
app.listen(PORT, () => {
    console.log(`VoiceBridge running at http://localhost:${PORT}`);
});