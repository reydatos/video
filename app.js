// AI Video Podcast App
class VideoPodcastApp {
    constructor() {
        // State
        this.stream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recognition = null;
        this.apiKey = '';
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.transcript = [];
        this.selectedRatio = '16:9';
        this.selectedWidth = 1280;
        this.selectedHeight = 720;
        this.conversationHistory = [];
        this.questionTimeout = null;

        // DOM Elements
        this.setupScreen = document.getElementById('setupScreen');
        this.recordingScreen = document.getElementById('recordingScreen');
        this.videoPreview = document.getElementById('videoPreview');
        this.videoContainer = document.getElementById('videoContainer');
        this.promptOverlay = document.getElementById('promptOverlay');
        this.currentPrompt = document.getElementById('currentPrompt');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.recordingTime = document.getElementById('recordingTime');
        this.transcriptDisplay = document.getElementById('transcriptDisplay');

        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newRecordingBtn = document.getElementById('newRecordingBtn');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.ratioButtons = document.querySelectorAll('.ratio-btn');

        this.init();
    }

    init() {
        // Load saved API key
        const savedKey = localStorage.getItem('claudeApiKey');
        if (savedKey) {
            this.apiKeyInput.value = savedKey;
        }

        // Event Listeners
        this.startBtn.addEventListener('click', () => this.startSession());
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.downloadBtn.addEventListener('click', () => this.downloadVideo());
        this.newRecordingBtn.addEventListener('click', () => this.resetToSetup());

        // Aspect ratio selection
        this.ratioButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.ratioButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedRatio = btn.dataset.ratio;
                this.selectedWidth = parseInt(btn.dataset.width);
                this.selectedHeight = parseInt(btn.dataset.height);
            });
        });

        // Initialize Speech Recognition
        this.initSpeechRecognition();
    }

    async startSession() {
        // Validate API key
        this.apiKey = this.apiKeyInput.value.trim();
        if (!this.apiKey) {
            alert('Please enter your Claude API key');
            return;
        }

        // Save API key
        localStorage.setItem('claudeApiKey', this.apiKey);

        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: this.selectedWidth },
                    height: { ideal: this.selectedHeight }
                },
                audio: true
            });

            this.videoPreview.srcObject = this.stream;

            // Apply aspect ratio class
            this.videoContainer.className = 'video-container';
            this.videoContainer.classList.add(`ratio-${this.selectedRatio.replace(':', '-')}`);

            // Switch to recording screen
            this.setupScreen.classList.remove('active');
            this.recordingScreen.classList.add('active');

            // Get initial prompt
            await this.getInitialPrompt();

        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please ensure you have granted camera permissions.');
        }
    }

    async getInitialPrompt() {
        try {
            const prompt = await this.callClaudeAPI(
                "Generate a creative, engaging opening question for a video podcast interview. The question should help someone introduce themselves and their story. Keep it warm, inviting, and open-ended. Return ONLY the question, nothing else."
            );
            this.currentPrompt.textContent = prompt;
            this.promptOverlay.classList.add('visible');
        } catch (error) {
            console.error('Error getting initial prompt:', error);
            this.currentPrompt.textContent = "Tell me about yourself and what brings you here today.";
            this.promptOverlay.classList.add('visible');
        }
    }

    async callClaudeAPI(prompt, includeHistory = false) {
        const url = 'https://api.anthropic.com/v1/messages';

        const messages = includeHistory && this.conversationHistory.length > 0 ? [
            ...this.conversationHistory,
            { role: 'user', content: prompt }
        ] : [
            { role: 'user', content: prompt }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 200,
                temperature: 0.9,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const text = data.content[0].text.trim();

        return text;
    }

    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        let lastTranscriptLength = 0;
        let accumulatedTranscript = '';

        this.recognition.onresult = async (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                accumulatedTranscript += finalTranscript;
                this.transcript.push(finalTranscript.trim());
                this.updateTranscriptDisplay();

                // Check if we should generate a new question
                const currentLength = accumulatedTranscript.split(' ').length;
                if (currentLength - lastTranscriptLength > 30) { // Every ~30 words
                    lastTranscriptLength = currentLength;
                    await this.generateLiveQuestion(accumulatedTranscript);
                }
            }

            // Update display with interim results
            if (interimTranscript) {
                this.updateTranscriptDisplay(interimTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Restart recognition
                if (this.isRecording) {
                    this.recognition.start();
                }
            }
        };

        this.recognition.onend = () => {
            // Restart if still recording
            if (this.isRecording) {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error restarting recognition:', error);
                }
            }
        };
    }

    async generateLiveQuestion(transcript) {
        // Clear any pending question timeout
        if (this.questionTimeout) {
            clearTimeout(this.questionTimeout);
        }

        // Debounce question generation
        this.questionTimeout = setTimeout(async () => {
            try {
                const contextPrompt = `You are an engaging video podcast host interviewing someone. Based on what they've said so far, generate a thoughtful follow-up question to keep the conversation flowing naturally. The question should show you're listening and encourage them to elaborate or share more.

Their recent words: "${transcript.slice(-500)}"

Generate ONE concise, conversational follow-up question (max 20 words). Return ONLY the question, nothing else.`;

                const question = await this.callClaudeAPI(contextPrompt);

                // Update the prompt overlay with smooth transition
                this.promptOverlay.classList.remove('visible');
                setTimeout(() => {
                    this.currentPrompt.textContent = question;
                    this.promptOverlay.classList.add('visible');
                }, 500);

                // Store in conversation history
                this.conversationHistory.push({
                    role: 'user',
                    content: `User said: ${transcript.slice(-200)}`
                });
                this.conversationHistory.push({
                    role: 'assistant',
                    content: `Question: ${question}`
                });

                // Keep history manageable
                if (this.conversationHistory.length > 10) {
                    this.conversationHistory = this.conversationHistory.slice(-10);
                }

            } catch (error) {
                console.error('Error generating live question:', error);
            }
        }, 2000); // Wait 2 seconds before generating new question
    }

    updateTranscriptDisplay(interimText = '') {
        const placeholder = this.transcriptDisplay.querySelector('.transcript-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        // Clear and rebuild
        this.transcriptDisplay.innerHTML = '';

        // Add final transcripts
        this.transcript.forEach(text => {
            const p = document.createElement('p');
            p.className = 'transcript-text final';
            p.textContent = text;
            this.transcriptDisplay.appendChild(p);
        });

        // Add interim text
        if (interimText) {
            const p = document.createElement('p');
            p.className = 'transcript-text interim';
            p.textContent = interimText;
            this.transcriptDisplay.appendChild(p);
        }

        // Auto-scroll to bottom
        this.transcriptDisplay.scrollTop = this.transcriptDisplay.scrollHeight;
    }

    startRecording() {
        if (this.isRecording) return;

        try {
            // Setup MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            };

            // Fallback for browsers that don't support vp9
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8,opus';
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.downloadBtn.disabled = false;
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;

            // Start speech recognition
            if (this.recognition) {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error starting speech recognition:', error);
                }
            }

            // Update UI
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.recordingIndicator.classList.add('active');
            this.recordBtn.classList.add('recording');

            // Start timer
            this.recordingStartTime = Date.now();
            this.recordingTimer = setInterval(() => {
                this.updateRecordingTime();
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not start recording. Please try again.');
        }
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;

        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Stop speech recognition
        if (this.recognition) {
            this.recognition.stop();
        }

        // Clear question timeout
        if (this.questionTimeout) {
            clearTimeout(this.questionTimeout);
        }

        // Update UI
        this.recordBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.recordingIndicator.classList.remove('active');
        this.recordBtn.classList.remove('recording');
        this.promptOverlay.classList.remove('visible');

        // Stop timer
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    updateRecordingTime() {
        const elapsed = Date.now() - this.recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        this.recordingTime.textContent =
            `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    async downloadVideo() {
        if (this.recordedChunks.length === 0) {
            alert('No recording available to download.');
            return;
        }

        try {
            // Create blob from recorded chunks
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });

            // Convert to MP4 (Note: This creates a WebM file but we can use FFmpeg for true MP4 conversion)
            // For client-side simplicity, we'll download as WebM with MP4 extension
            // Users can convert using online tools if needed, or we can add ffmpeg.wasm for true MP4

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-podcast-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Note: For true MP4 conversion, we would need ffmpeg.wasm
            // Keeping it simple for now with WebM which is widely supported

        } catch (error) {
            console.error('Error downloading video:', error);
            alert('Could not download video. Please try again.');
        }
    }

    resetToSetup() {
        // Stop all tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }

        // Clear state
        this.recordedChunks = [];
        this.transcript = [];
        this.conversationHistory = [];
        this.transcriptDisplay.innerHTML = '<p class="transcript-placeholder">Your words will appear here...</p>';
        this.recordingTime.textContent = '00:00';

        // Reset UI
        this.downloadBtn.disabled = true;
        this.recordingScreen.classList.remove('active');
        this.setupScreen.classList.add('active');
        this.promptOverlay.classList.remove('visible');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoPodcastApp();
});
