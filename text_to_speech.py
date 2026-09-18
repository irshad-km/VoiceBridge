import sys
from gtts import gTTS

if len(sys.argv) < 3:
    print("Text and output path are required")
    sys.exit(1)

text = sys.argv[1]
output_path = sys.argv[2]

tts = gTTS(
    text=text,
    lang="en"
)

tts.save(output_path)

print("TTS audio created:", output_path)