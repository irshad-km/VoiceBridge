import express from "express";

import {
    home,
    translate,
    howItWorks,
    about,
    result
} from "../controllers/pageController.js";

const router = express.Router();

router.get("/", home);

router.get("/translate", translate);

router.get("/how-it-works", howItWorks);

router.get("/about", about);

router.get("/result", result);

export default router;