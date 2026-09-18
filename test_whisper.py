import sys

from faster_whisper import WhisperModel

if len(sys.argv) < 2:
    print("Audio file path is required")
    sys.exit(1)

audio_path = sys.argv[1]

print("Loading Whisper model...", file=sys.stderr)

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

print("Transcribing audio...", file=sys.stderr)

segments, info = model.transcribe(
    audio_path,
    language="ml",
    task="transcribe",
    beam_size=5,
    best_of=5,
    vad_filter=True,
    condition_on_previous_text=False,
    temperature=0
)

print(f"Detected language: {info.language}", file=sys.stderr)
print(f"Language probability: {info.language_probability}", file=sys.stderr)

text = ""

for segment in segments:
    text += segment.text + " "

print(text.strip())