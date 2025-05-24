# People Pleasing Bot

A fun web application that generates sarcastic roasts based on user input. The bot uses AI to create personalized, humorous roasts and pairs them with reaction GIFs and voice responses.

## 🌟 Features

- **Compliment Generator**: Enter a message and receive a warm, personalized compliment.
- **Voice Input**: Speak your thoughts — the Whisper model transcribes your audio to text
- **Feel-Good GIFs**: Each response is paired with a cheerful, uplifting reaction GIF
- **Voice Compliments**: Compliments are spoken aloud using ElevenLabs text-to-speech for a more personal experience.
- **Dark/Light Mode**: Toggle between dark and light themes for your comfort
- **Model Selection**: Choose from different AI models to tailor the tone and creativity of the compliments

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
   > **Note**: The speech recognition feature requires specific dependencies including TensorFlow and Keras. If you encounter any issues, make sure these are properly installed.

3. Create a `.env` file with your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key
   GIPHY_API_KEY=your_giphy_api_key
   ELEVEN_API_KEY=your_elevenlabs_api_key
   ```
4. Run the application:
   ```
   python people_pleaser.py
   ```
5. Open your browser and navigate to `http://localhost:5000`

## Speech Recognition

The application uses the Whisper model from Hugging Face for speech recognition. To use this feature:

1. Click the microphone button to start recording
2. Speak your message
3. Click the button again to stop recording
4. The transcribed text will appear in the input field
5. Click "Compliment" to generate a response

### Troubleshooting Speech Recognition

If you encounter issues with the speech recognition feature:

1. Make sure you have installed all the required dependencies:
   ```
   pip install tensorflow==2.15.0 keras==2.15.1 transformers==4.36.2 torch==2.1.2 accelerate==0.25.0
   ```
2. Check the console output for any error messages related to the Whisper model
3. If you're still having issues, you can still use the application with text input only

## Technologies Used

- **Backend**: Flask, Python
- **AI Models**: Groq (LLM), Whisper (Speech Recognition), ElevenLabs (Text-to-Speech)
- **Frontend**: HTML, CSS, JavaScript
- **APIs**: Giphy API for reaction GIFs

## License

MIT 
