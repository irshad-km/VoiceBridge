import fs from "fs";
import path from "path";
import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";
import Translation from "../model/Translation.js";

const execFileAsync = promisify(execFile);

export const translateAudio = async (req, res) => {
    let wavPath = null;
    let translatedAudioPath = null;

    try {
        console.log("Audio received!");

        // Check audio file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Audio file is required"
            });
        }

        console.log("Uploaded file:", req.file.path);
        console.log("Source:", req.body.sourceLanguage);
        console.log("Target:", req.body.targetLanguage);

        // --------------------------------
        // 1. Convert uploaded audio to WAV
        // --------------------------------

        const wavFileName = `${path.basename(req.file.path)}.wav`;

        wavPath = path.join(
            path.dirname(req.file.path),
            wavFileName
        );

        console.log("Converting audio to WAV...");

        await execFileAsync(
            "ffmpeg",
            [
                "-y",
                "-i",
                req.file.path,
                "-ar",
                "16000",
                "-ac",
                "1",
                wavPath
            ],
            {
                maxBuffer: 1024 * 1024 * 10
            }
        );

        console.log("WAV created:", wavPath);

        // --------------------------------
        // 2. Speech to Text
        // --------------------------------

        console.log("Starting Malayalam ASR...");

        const { stdout, stderr } = await execFileAsync(
            "python",
            [
                "test_malayalam.py",
                wavPath
            ],
            {
                cwd: process.cwd(),
                maxBuffer: 1024 * 1024 * 10
            }
        );

        if (stderr) {
            console.log("ASR output:", stderr);
        }

        const originalText = stdout.trim();

        console.log("Transcription:", originalText);

        // Check transcription
        if (!originalText) {
            return res.status(400).json({
                success: false,
                message: "Could not detect speech in audio"
            });
        }

        // --------------------------------
        // 3. Get Languages
        // --------------------------------

        const sourceLanguage = (
            req.body.sourceLanguage || "ML"
        ).toLowerCase();

        const targetLanguage = (
            req.body.targetLanguage || "EN"
        ).toLowerCase();

        console.log(
            `Translating from ${sourceLanguage} to ${targetLanguage}`
        );

        // --------------------------------
        // 4. Translate Text
        // --------------------------------

        console.log("Starting translation...");

        const translationResponse = await axios.get(
            "https://api.mymemory.translated.net/get",
            {
                params: {
                    q: originalText,
                    langpair: `${sourceLanguage}|${targetLanguage}`
                },
                timeout: 15000
            }
        );

        const translatedText =
            translationResponse.data?.responseData?.translatedText;

        console.log("Translated text:", translatedText);

        // Check translation
        if (!translatedText) {
            return res.status(500).json({
                success: false,
                message: "Translation failed"
            });
        }

        // --------------------------------
        // 4.5. Convert translated text to voice
        // --------------------------------

        console.log("Starting Text-to-Speech...");

        const audioFileName =
            `translated_${Date.now()}.mp3`;

        translatedAudioPath = path.join(
            process.cwd(),
            "uploads",
            audioFileName
        );

        await execFileAsync(
            "python",
            [
                "text_to_speech.py",
                translatedText,
                translatedAudioPath
            ],
            {
                cwd: process.cwd(),
                maxBuffer: 1024 * 1024 * 10
            }
        );

        console.log(
            "Translated audio created:",
            translatedAudioPath
        );

        const translatedAudioUrl =
            `/uploads/${audioFileName}`;

        // --------------------------------
        // 5. SAVE FULL DATA TO MONGODB
        // --------------------------------

        const translation = await Translation.create({
            sourceLanguage: req.body.sourceLanguage,
            targetLanguage: req.body.targetLanguage,
            originalText: originalText,
            translatedText: translatedText,
            translatedAudioUrl: translatedAudioUrl
        });

        console.log(
            "Translation record created:",
            translation._id
        );

        // --------------------------------
        // 6. Delete uploaded temporary audio
        // --------------------------------

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);

            console.log("Uploaded audio deleted.");
        }

        // Delete temporary WAV
        if (wavPath && fs.existsSync(wavPath)) {
            fs.unlinkSync(wavPath);

            console.log("Temporary WAV deleted.");
        }

        // --------------------------------
        // 7. Send response to frontend
        // --------------------------------

        return res.json({
            success: true,
            message: "Audio translated successfully",

            text: originalText,

            translatedText: translatedText,

            translatedAudioUrl: translatedAudioUrl,

            translationId: translation._id
        });

    } catch (error) {

        console.error(
            "Translation controller error:",
            error
        );

        // --------------------------------
        // Delete uploaded file if error
        // --------------------------------

        if (
            req.file?.path &&
            fs.existsSync(req.file.path)
        ) {
            try {

                fs.unlinkSync(req.file.path);

            } catch (deleteError) {

                console.error(
                    "Could not delete uploaded file:",
                    deleteError.message
                );

            }
        }

        // --------------------------------
        // Delete WAV if error
        // --------------------------------

        if (
            wavPath &&
            fs.existsSync(wavPath)
        ) {
            try {

                fs.unlinkSync(wavPath);

            } catch (deleteError) {

                console.error(
                    "Could not delete WAV:",
                    deleteError.message
                );

            }
        }

        // --------------------------------
        // Delete generated TTS audio if error
        // --------------------------------

        if (
            translatedAudioPath &&
            fs.existsSync(translatedAudioPath)
        ) {
            try {

                fs.unlinkSync(translatedAudioPath);

            } catch (deleteError) {

                console.error(
                    "Could not delete translated audio:",
                    deleteError.message
                );

            }
        }

        // --------------------------------
        // Send error response
        // --------------------------------

        return res.status(500).json({

            success: false,

            message: "Audio processing failed",

            error: error.message

        });
    }
};