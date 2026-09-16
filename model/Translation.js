import mongoose from "mongoose";

const translationSchema = new mongoose.Schema(
    {
        sourceLanguage: {
            type: String,
            required: true
        },

        targetLanguage: {
            type: String,
            required: true
        },

        originalText: {
            type: String,
            default: ""
        },

        translatedText: {
            type: String,
            default: ""
        },

        originalAudioUrl: {
            type: String,
            default: ""
        },

        translatedAudioUrl: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Translation = mongoose.model(
    "Translation",
    translationSchema
);

export default Translation;