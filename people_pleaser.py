from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from groq import Groq
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from dotenv import load_dotenv
from transformers import pipeline
import torch, os, base64, uuid, tempfile, requests, random

# Setup
app = Flask(__name__)
CORS(app)
load_dotenv()

# API keys
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
eleven_labs = ElevenLabs(api_key=os.getenv("ELEVEN_API_KEY"))
GIPHY_API_KEY = os.getenv("GIPHY_API_KEY")

# Load Whisper model
device = "cuda" if torch.cuda.is_available() else "cpu"
whisper_model = pipeline("automatic-speech-recognition", model="openai/whisper-base", device=device)

# Roast via LLaMA3
def get_pleasing_response(prompt):
    res = groq_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{
            "role": "system",
            "content": "You are an extremely kind, warm, and helpful assistant. Give polite, friendly, and emotionally uplifting responses. Add 'GIF:' at the end with a feel-good reaction."
        }, {
            "role": "user",
            "content": prompt
        }],
        temperature=0.9,
        max_tokens=250
    )
    return res.choices[0].message.content


# Text-to-Speech
def text_to_speech(text):
    try:
        response = eleven_labs.text_to_speech.convert(
            voice_id="pNInz6obpgDQGcFmaJgB", text=text,
            model_id="eleven_turbo_v2_5",
            output_format="mp3_22050_32",
            voice_settings=VoiceSettings(stability=0, similarity_boost=1, style=0, use_speaker_boost=True)
        )
        file = f"temp_{uuid.uuid4()}.mp3"
        with open(file, "wb") as f: [f.write(chunk) for chunk in response if chunk]
        with open(file, "rb") as f: encoded = base64.b64encode(f.read()).decode("utf-8")
        os.remove(file)
        return encoded
    except Exception as e:
        print("TTS error:", e)
        return None

# Get GIF
def fetch_gif(prompt):
    try:
        g = requests.get("https://api.giphy.com/v1/gifs/search", params={
            "api_key": GIPHY_API_KEY, "q": prompt, "limit": 10, "rating": "g"
        }).json()
        return random.choice(r["data"])["images"]["original"]["url"] if g["data"] else ""
    except:
        return "https://media.giphy.com/media/RBeddeaQ5Xo0E/giphy.gif"

# Parse roast and GIF
def split_roast_and_gif(text):
    if 'GIF:' in text:
        roast, gif_prompt = text.split('GIF:', 1)
        return roast.strip(), gif_prompt.strip()
    return text, "sarcastic roast"

# Routes
@app.route('/compliment', methods=['POST'])
def compliment():
    data = request.json
    user_input = data.get("text", "")
    prompt = f"Give a kind, supportive, and encouraging response to this:\n{user_input}\nEnd with GIF: description."
    full_response = get_pleasing_response(prompt)
    compliment, gif_prompt = split_roast_and_gif(full_response)
    return jsonify({
        "compliment": compliment,
        "gif": fetch_gif(gif_prompt),
        "audio": text_to_speech(compliment)
    })

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    audio = request.files['audio']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
        audio.save(f.name)
        text = whisper_model(f.name)["text"]
    os.unlink(f.name)
    return jsonify({'transcription': text})

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
