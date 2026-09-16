import express from "express";
import multer from "multer";

import {
    translateAudio
} from "../controllers/translateController.js";

const router = express.Router();

const upload = multer({
    dest: "uploads/"
});

router.post(
    "/translate",
    upload.single("audio"),
    translateAudio
);

export default router;