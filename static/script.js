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

    // Initialize voice recording functionality
    initVoiceRecording();
});

// Voice recording variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function initVoiceRecording() {
    const voiceButton = document.getElementById('voiceButton');
    voiceButton.addEventListener('click', function () {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await sendAudioToServer(audioBlob);
            audioChunks = [];
        };

        mediaRecorder.start();
        isRecording = true;

        document.getElementById('voiceButton').classList.add('recording');
        document.getElementById('voiceButton').title = 'Stop recording';
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access your microphone. Please check permissions and try again.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;

        document.getElementById('voiceButton').classList.remove('recording');
        document.getElementById('voiceButton').title = 'Record voice';

        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

async function sendAudioToServer(audioBlob) {
    try {
        const userInput = document.getElementById('userInput');
        userInput.value = 'Transcribing...';
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
        console.error('Transcription error:', error);
        alert('Error transcribing audio. Please try again or type your message.');
        document.getElementById('userInput').value = '';
        document.getElementById('userInput').disabled = false;
    }
}

async function getCompliment() {
    const userInput = document.getElementById('userInput').value;
    const modelChoice = document.getElementById('modelSelect').value;
    if (!userInput) return;

    const chatContainer = document.getElementById('chatContainer');
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user';
    userMessageDiv.innerHTML = `<div class="message-content">${userInput}</div>`;
    chatContainer.appendChild(userMessageDiv);

    document.getElementById('userInput').value = '';
    document.getElementById('userInput').disabled = true;
    document.getElementById('modelSelect').disabled = true;
    const buttons = document.getElementsByTagName('button');
    for (let button of buttons) button.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/compliment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userInput, model: modelChoice })
        });

        const data = await response.json();

        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'message bot';

        const complimentDiv = document.createElement('div');
        complimentDiv.className = 'message-content';
        complimentDiv.textContent = data.compliment;
        botMessageDiv.appendChild(complimentDiv);

        const gifContainer = document.createElement('div');
        gifContainer.className = 'gif-container';
        const gifImage = document.createElement('img');
        gifImage.src = data.gif;
        gifContainer.appendChild(gifImage);
        botMessageDiv.appendChild(gifContainer);

        const audioControl = document.createElement('button');
        audioControl.className = 'audio-control';
        audioControl.innerHTML = '<span class="play-icon">🔊 Play</span><span class="pause-icon">⏸️ Pause</span>';
        audioControl.onclick = function () { toggleAudio(this); };
        botMessageDiv.appendChild(audioControl);

        chatContainer.appendChild(botMessageDiv);

        const audioPlayer = document.createElement('audio');
        audioPlayer.src = `data:audio/mpeg;base64,${data.audio}`;
        botMessageDiv.appendChild(audioPlayer);

        audioPlayer.play();
        audioControl.classList.add('playing');

        audioPlayer.onended = function () {
            audioControl.classList.remove('playing');
        };

        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong! Try again later.');
    }

    document.getElementById('userInput').disabled = false;
    document.getElementById('modelSelect').disabled = false;
    for (let button of buttons) button.disabled = false;
}

document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        getCompliment();
    }
});

document.getElementById('audioPlayer')?.addEventListener('ended', function () {
    document.getElementById('audioControl')?.classList.remove('playing');
});

function toggleAudio(button) {
    const audioPlayer = button.nextElementSibling;

    if (audioPlayer.paused || audioPlayer.ended) {
        audioPlayer.play();
        button.classList.add('playing');
    } else {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        button.classList.remove('playing');
    }
}
