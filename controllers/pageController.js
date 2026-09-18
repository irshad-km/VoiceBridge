import Translation from "../model/Translation.js";

export const home = (req, res) => {
    res.render("home");
};

export const translate = (req, res) => {
    res.render("translate");
};

export const howItWorks = (req, res) => {
    res.render("how-it-works");
};

export const about = (req, res) => {
    res.render("about");
};

export const result = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).send("Translation ID is required");
        }

        const translation = await Translation.findById(id);

        if (!translation) {
            return res.status(404).send("Translation not found");
        }

        res.render("result", {
            translation
        });

    } catch (error) {
        console.error("Result page error:", error);

        res.status(500).send("Failed to load translation result");
    }
};