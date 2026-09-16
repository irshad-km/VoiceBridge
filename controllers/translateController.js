import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import Translation from "../model/Translation.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const translateAudio = async (req, res) => {
    try {
        console.log("Audio received!");

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Audio file is required"
            });
        }

        console.log("File:", req.file);
        console.log("Source:", req.body.sourceLanguage);
        console.log("Target:", req.body.targetLanguage);

        // ==========================================
        // 1. AUDIO → TEXT
        // ==========================================

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: "whisper-1"
        });

        const originalText = transcription.text;

        console.log("Transcription:", originalText);

        // ==========================================
        // 2. TEXT → TARGET LANGUAGE
        // ==========================================

        const translationResponse = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [
                {
                    role: "system",
                    content:
                        "Translate the user's text accurately into the requested target language. Return only the translated text."
                },
                {
                    role: "user",
                    content: `Translate this text from ${req.body.sourceLanguage} to ${req.body.targetLanguage}:

${originalText}`
                }
            ]
        });

        const translatedText = translationResponse.output_text;

        console.log("Translated text:", translatedText);

        // ==========================================
        // 3. SAVE TO MONGODB
        // ==========================================

        const translation = await Translation.create({
            sourceLanguage: req.body.sourceLanguage,
            targetLanguage: req.body.targetLanguage
        });

        console.log(
            "Translation record created:",
            translation._id
        );

        // ==========================================
        // 4. SEND RESULT TO FRONTEND
        // ==========================================

        res.json({
            success: true,
            message: "Audio translated successfully",
            text: originalText,
            translatedText: translatedText,
            translationId: translation._id
        });

    } catch (error) {
        console.error("Translation controller error:", error);

        res.status(500).json({
            success: false,
            message: "Audio processing failed"
        });
    }
};