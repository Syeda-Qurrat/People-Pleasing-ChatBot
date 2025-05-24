document.getElementById('themeToggle').addEventListener('click', function () {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

document.addEventListener('DOMContentLoaded', function () {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    initVoiceRecording();
});

// Voice Recording
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function initVoiceRecording() {
    const voiceButton = document.getElementById('voiceButton');
    voiceButton.addEventListener('click', () => {
        isRecording ? stopRecording() : startRecording();
    });
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await sendAudioToServer(audioBlob);
        };

        mediaRecorder.start();
        isRecording = true;

        const btn = document.getElementById('voiceButton');
        btn.classList.add('recording');
        btn.title = 'Stop recording';
    } catch (error) {
        console.error('Microphone error:', error);
        alert('Unable to access your mic. Please allow microphone access and try again.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;

        const btn = document.getElementById('voiceButton');
        btn.classList.remove('recording');
        btn.title = 'Start recording';
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

async function sendAudioToServer(audioBlob) {
    try {
        const userInput = document.getElementById('userInput');
        userInput.value = 'Transcribing your lovely words...';
        userInput.disabled = true;

        const formData = new FormData();
        formData.append('audio', audioBlob);

        const response = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        userInput.value = data.transcription;
        userInput.disabled = false;
    } catch (error) {
        console.error('Transcription failed:', error);
        alert('Oops! Couldn’t process the audio. Try typing instead!');
        const userInput = document.getElementById('userInput');
        userInput.value = '';
        userInput.disabled = false;
    }
}

async function getCompliment() {
    const inputEl = document.getElementById('userInput');
    const userInput = inputEl.value.trim();
    if (!userInput) return;

    const chatContainer = document.getElementById('chatContainer');
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.innerHTML = `<div class="message-content">${userInput}</div>`;
    chatContainer.appendChild(userMsg);

    inputEl.value = '';
    inputEl.disabled = true;
    const voiceBtn = document.getElementById('voiceButton');
    voiceBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/compliment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userInput })
        });

        const data = await response.json();

        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';

        const complimentDiv = document.createElement('div');
        complimentDiv.className = 'message-content';
        complimentDiv.textContent = data.compliment;
        botMsg.appendChild(complimentDiv);

        const gifContainer = document.createElement('div');
        gifContainer.className = 'gif-container';
        const gifImage = document.createElement('img');
        gifImage.src = data.gif;
        gifImage.alt = "Feel-good reaction";
        gifContainer.appendChild(gifImage);
        botMsg.appendChild(gifContainer);

        const audioPlayer = document.createElement('audio');
        audioPlayer.src = `data:audio/mpeg;base64,${data.audio}`;
        botMsg.appendChild(audioPlayer);

        const audioBtn = document.createElement('button');
        audioBtn.className = 'audio-control';
        audioBtn.innerHTML = '<span class="play-icon">🔊 Play</span><span class="pause-icon">⏸️ Pause</span>';
        audioBtn.onclick = () => toggleAudio(audioBtn);
        botMsg.appendChild(audioBtn);

        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        audioPlayer.play();
        audioBtn.classList.add('playing');

        audioPlayer.onended = () => {
            audioBtn.classList.remove('playing');
        };
    } catch (error) {
        console.error('Compliment fetch failed:', error);
        alert('Something went wrong while fetching your compliment. Please try again!');
    }

    inputEl.disabled = false;
    voiceBtn.disabled = false;
}

document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') getCompliment();
});

function toggleAudio(button) {
    const audio = button.nextElementSibling;

    if (audio.paused || audio.ended) {
        audio.play();
        button.classList.add('playing');
    } else {
        audio.pause();
        audio.currentTime = 0;
        button.classList.remove('playing');
    }
}
