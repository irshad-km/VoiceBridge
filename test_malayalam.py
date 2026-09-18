import sys
import onnx_asr

sys.stdout.reconfigure(encoding="utf-8")

if len(sys.argv) < 2:
    print("Audio file path is required", file=sys.stderr)
    sys.exit(1)

audio_path = sys.argv[1]

print("Loading Malayalam model...", file=sys.stderr)

model = onnx_asr.load_model(
    "OpenVoiceOS/ai4bharat-indicconformer-ml-onnx"
)

print("Model loaded!", file=sys.stderr)
print("Transcribing...", file=sys.stderr)

result = model.recognize(audio_path)

print(result.strip(), flush=True)