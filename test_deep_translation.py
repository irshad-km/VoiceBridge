from deep_translator import GoogleTranslator

text = "ഭക്ഷണം കഴിച്ചോ"

result = GoogleTranslator(
    source="ml",
    target="en"
).translate(text)

print("Original:", text)
print("Translated:", result)