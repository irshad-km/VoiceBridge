import requests

text = "സുഖമാണോ എന്താണ് വർത്തമാനം"

url = "https://api.mymemory.translated.net/get"

params = {
    "q": text,
    "langpair": "ml|en"
}

response = requests.get(url, params=params)

data = response.json()

print(data["responseData"]["translatedText"])