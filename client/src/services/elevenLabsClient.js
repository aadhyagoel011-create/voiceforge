/**
 * ElevenLabs Conversational AI Integration & Interactive Demo Engine
 * 
 * Features:
 * 1. Live ElevenLabs Session using official @11labs/client SDK and signed WebSocket URL.
 * 2. Interactive Demo Conversation Mode with genuine turn-taking (user speaks or types, agent responds).
 * 3. Speech completion tracking: assistant response finishes speaking before advancing or yielding turn.
 * 4. Browser Speech Recognition (Web Speech API) for spoken user input in Demo Mode.
 * 5. Audio playback controls: Stop, Pause, Resume, and Replay Spoken Audio.
 * 6. Real-time audio waveform data collection from microphone or agent output stream.
 * 7. Clean teardown of audio streams, recognition listeners, and synthesis utterances.
 */

import { Conversation } from '@11labs/client';

export class VoiceSessionManager {
  constructor({ onStatusChange, onModeChange, onTranscript, onError, onWaveformData }) {
    this.onStatusChange = onStatusChange || (() => {});
    this.onModeChange = onModeChange || (() => {});
    this.onTranscript = onTranscript || (() => {});
    this.onError = onError || (() => {});
    this.onWaveformData = onWaveformData || (() => {});

    // Session status
    this.liveConversation = null;
    this.currentAgent = null;
    this.isLive = false;
    this.isDemo = false;
    this.isSpeaking = false;
    this.isListening = false;
    this.isPaused = false;

    // Browser TTS state
    this._activeUtterance = null;
    this._heartbeatInterval = null;

    // Browser Speech Recognition state
    this.recognition = null;
    this.isRecognizing = false;

    // Web Audio API state (for Demo Mode mic waveform)
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.waveformDataArray = null;
    this._animationFrameId = null;
  }

  /* =========================================================================
   * 1. LIVE ELEVENLABS CONVERSATION (Official @11labs/client SDK)
   * ========================================================================= */

  async startLiveSession({ signedUrl, agentId }) {
    this.cleanup();
    this.isLive = true;
    this.isDemo = false;

    try {
      this.onStatusChange('connecting');

      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        throw new Error(`Microphone permission denied: ${micErr.message}. Please allow microphone access in your browser.`);
      }

      const options = {
        onConnect: ({ conversationId }) => {
          this.onStatusChange('connected');
          this.onModeChange('listening');
          this._startLiveWaveformLoop();
        },
        onDisconnect: (details) => {
          this.onStatusChange('disconnected');
          this.onModeChange('idle');
          this._stopLiveWaveformLoop();
        },
        onMessage: ({ message, source }) => {
          if (message) {
            const role = source === 'user' ? 'user' : 'agent';
            this.onTranscript({
              speaker: role,
              text: message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });
          }
        },
        onError: (err) => {
          console.error('ElevenLabs session error:', err);
          const msg = typeof err === 'string' ? err : err.message || 'ElevenLabs connection error';
          this.onError(msg);
          this.onStatusChange('disconnected');
        },
        onStatusChange: (status) => {
          const current = status.status || status;
          this.onStatusChange(current);
        },
        onModeChange: (mode) => {
          // 'speaking' | 'listening'
          const currentMode = mode.mode || mode;
          this.onModeChange(currentMode);
        }
      };

      if (signedUrl) {
        options.signedUrl = signedUrl;
      } else if (agentId) {
        options.agentId = agentId;
      } else {
        throw new Error('Neither signedUrl nor agentId was provided for live session.');
      }

      this.liveConversation = await Conversation.startSession(options);
      return { success: true, mode: 'live', conversationId: this.liveConversation.getId() };
    } catch (err) {
      this.isLive = false;
      this.onStatusChange('disconnected');
      this.onError(err.message || 'Failed to establish ElevenLabs live connection');
      throw err;
    }
  }

  _startLiveWaveformLoop() {
    this._stopLiveWaveformLoop();
    const tick = () => {
      if (!this.liveConversation || !this.isLive) return;
      try {
        const outFreq = this.liveConversation.getOutputByteFrequencyData();
        const inFreq = this.liveConversation.getInputByteFrequencyData();
        const activeData = outFreq && outFreq.some(v => v > 0) ? outFreq : inFreq;
        if (activeData && activeData.length > 0) {
          this.onWaveformData(activeData);
        }
      } catch {
        // ignore frequency poll exceptions
      }
      this._animationFrameId = requestAnimationFrame(tick);
    };
    this._animationFrameId = requestAnimationFrame(tick);
  }

  _stopLiveWaveformLoop() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /* =========================================================================
   * 2. INTERACTIVE DEMO CONVERSATION MODE (Local Voice Agent Engine)
   * ========================================================================= */

  /**
   * Start a genuine interactive demo session.
   * Begins by speaking the agent's welcome greeting and then waits for user turn.
   */
  async startDemoSession(agent) {
    this.cleanup();
    this.isDemo = true;
    this.isLive = false;
    this.currentAgent = agent;

    this.onStatusChange('connected');

    // Setup optional Web Audio analyser for user's microphone so waveform reacts
    await this._setupDemoMicAudio();

    // Initial greeting from agent configuration
    const isHindi = agent?.primaryLanguage?.includes('Hindi') || agent?.supportedLanguages?.includes('Hindi');
    const initialGreeting = agent?.welcomeMessage?.trim() || (isHindi
      ? "Namaste! Welcome to our voice service. Main aapki kya madad kar sakta hoon?"
      : "Hello! Welcome to our voice service. How may I assist you today?");

    // 1. Post to transcript immediately
    this.onTranscript({
      speaker: 'agent',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // 2. Speak greeting and wait for completion before yielding turn to user
    await this.speakDemoText(initialGreeting, () => {
      // Once assistant completes speaking, mode becomes 'listening'
      this.onModeChange('listening');
    });
  }

  /**
   * Speak text using browser speech synthesis with full completion guarantee.
   * Resolves when utterance actually ends (onend or onerror).
   */
  speakDemoText(text, onComplete = null) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || !text) {
        this.onModeChange('listening');
        if (onComplete) onComplete();
        resolve();
        return;
      }

      try {
        // Cancel previous speech if active
        window.speechSynthesis.cancel();
        this._stopHeartbeat();

        const utterance = new SpeechSynthesisUtterance(text);
        this._activeUtterance = utterance; // Pin to instance to prevent Chrome GC bug

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Choose appropriate browser voice if available
        const voices = window.speechSynthesis.getVoices();
        const isHindi = this.currentAgent?.primaryLanguage?.includes('Hindi');
        const matchingVoice = voices.find(v => isHindi ? v.lang.startsWith('hi') : v.lang.startsWith('en'));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        this.isSpeaking = true;
        this.onModeChange('speaking');

        const finishPlayback = () => {
          this.isSpeaking = false;
          this._stopHeartbeat();
          this._activeUtterance = null;
          if (onComplete) onComplete();
          resolve();
        };

        utterance.onend = () => {
          finishPlayback();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          finishPlayback();
        };

        // Chromium bug workaround: speech synthesis pauses silently after ~15 seconds without a resume heartbeat
        this._heartbeatInterval = setInterval(() => {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 12000);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis execution failure:', err);
        this.isSpeaking = false;
        this.onModeChange('listening');
        if (onComplete) onComplete();
        resolve();
      }
    });
  }

  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }

  /**
   * User sends a message (spoken or typed).
   * Generates a contextually intelligent response based on the agent's actual FAQs, instructions, and guardrails.
   */
  async handleUserMessage(userText) {
    if (!userText || !userText.trim()) return;
    const cleanText = userText.trim();

    // 1. Add user message to transcript
    this.onTranscript({
      speaker: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // 2. Generate contextual response using agent's actual knowledge
    const responseText = this.generateLocalResponse(cleanText, this.currentAgent);

    // 3. Add agent response to transcript
    this.onTranscript({
      speaker: 'agent',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // 4. Speak response with full completion guarantee
    await this.speakDemoText(responseText, () => {
      // Yield back to user
      this.onModeChange('listening');
    });
  }

  /**
   * Deterministic local responder that understands agent FAQs, opening hours, pricing,
   * Hindi/English switching, and guardrails.
   */
  generateLocalResponse(userQuery, agent) {
    const q = userQuery.toLowerCase();
    const isHindiQuery = /[\u0900-\u097F]/.test(userQuery) || q.includes('namaste') || q.includes('kya') || q.includes('hain') || q.includes('sharma') || q.includes('madad') || q.includes('bataiye');
    const isHindiAgent = agent?.primaryLanguage?.includes('Hindi') || agent?.supportedLanguages?.includes('Hindi');

    // 1. Check FAQs first (exact or keyword matching)
    if (agent?.faqs && agent.faqs.length > 0) {
      for (const faq of agent.faqs) {
        const faqQ = (faq.question || '').toLowerCase();
        const faqKeywords = faqQ.split(/\s+/).filter(w => w.length > 3);
        const matchCount = faqKeywords.filter(w => q.includes(w)).length;
        if (matchCount >= 2 || (faqKeywords.length === 1 && matchCount === 1)) {
          return faq.answer;
        }
      }
    }

    // 2. Domain-specific keyword matching
    const agentName = (agent?.name || '').toLowerCase();
    const instructions = (agent?.systemInstructions || '').toLowerCase();

    // Healthcare & Clinic Queries
    if (agentName.includes('clinic') || agentName.includes('doctor') || agentName.includes('health') || instructions.includes('clinic')) {
      if (q.includes('timing') || q.includes('hours') || q.includes('open') || q.includes('samay')) {
        return isHindiQuery || isHindiAgent
          ? "Hamari clinic Monday se Saturday subah 8:00 AM se shaam 8:00 PM tak open rehti hai, aur Sunday 9:00 AM se 1:00 PM tak."
          : "Our clinic is open Monday through Saturday from 8:00 AM to 8:00 PM, and Sundays from 9:00 AM to 1:00 PM.";
      }
      if (q.includes('fee') || q.includes('cost') || q.includes('charge') || q.includes('price') || q.includes('fees') || q.includes('kitni')) {
        return isHindiQuery || isHindiAgent
          ? "General physician consultation fee ₹500 hai, aur specialist consultations ₹800 se ₹1,200 ke beech hoti hain."
          : "A general physician consultation is $50 (or ₹500), while specialist appointments start at $80.";
      }
      if (q.includes('appointment') || q.includes('book') || q.includes('slot') || q.includes('sharma') || q.includes('doctor') || q.includes('fever')) {
        return isHindiQuery || isHindiAgent
          ? "Ji haan! Dr. Sharma shaam 5:00 PM se 7:30 PM tak clinic me uplabdh hain. Kya main aapke liye 5:30 PM ka slot confirm kar doon?"
          : "Yes, Dr. Sharma is available this evening from 5:00 PM to 7:30 PM. Would you like me to reserve the 5:30 PM slot for you?";
      }
      if (q.includes('confirm') || q.includes('yes') || q.includes('haan') || q.includes('kripya')) {
        return isHindiQuery || isHindiAgent
          ? "Aapka 5:30 PM ka appointment confirm ho gaya hai! Kripya clinic aane par apna phone number reception par bata dein. Kya aapko aur koi jaankari chahiye?"
          : "Your appointment is confirmed for 5:30 PM! Please provide your phone number at reception upon arrival. Can I help you with anything else?";
      }
      if (q.includes('emergency') || q.includes('chest pain') || q.includes('breath') || q.includes('critical')) {
        return isHindiQuery || isHindiAgent
          ? "Emergency sthiti me kripya turant 112 ya 108 par call karein ya nazdeeki hospital emergency room me jaayein."
          : "For medical emergencies, please immediately call 911 (or 112) or go to the nearest emergency room.";
      }
    }

    // Interview Coaching Queries
    if (agentName.includes('interview') || instructions.includes('interview') || instructions.includes('mock')) {
      if (q.includes('star') || q.includes('method') || q.includes('structure')) {
        return "The STAR method structures behavioral answers into Situation, Task, Action, and Result. Let's practice! Tell me about a time you handled a difficult deadline.";
      }
      if (q.includes('ready') || q.includes('start') || q.includes('software') || q.includes('engineer') || q.includes('role') || q.includes('yes')) {
        return "Excellent! Let's start with Question 1: Can you describe a challenging technical problem you solved recently and how you decided on the architecture?";
      }
      if (q.split(/\s+/).length > 8) {
        return "Great response! You clearly outlined your technical rationale. To elevate your answer, quantify the business impact or latency reduction. Ready for Question 2?";
      }
      return "Understood. Remember to structure your response with clear actions and quantifiable outcomes. Would you like to practice a technical or behavioral scenario?";
    }

    // Customer Support / SaaS Queries
    if (agentName.includes('support') || agentName.includes('cloud') || instructions.includes('support')) {
      if (q.includes('invoice') || q.includes('bill') || q.includes('receipt')) {
        return "All PDF invoices can be downloaded directly from Settings > Billing in your web dashboard. I can also email you a copy if needed.";
      }
      if (q.includes('upgrade') || q.includes('tier') || q.includes('annual') || q.includes('plan')) {
        return "Annual upgrades include a 20% discount and priority support. Upgrades take effect immediately with prorated billing. Shall I generate a quote for you?";
      }
      if (q.includes('password') || q.includes('reset') || q.includes('login')) {
        return "To reset your password, visit the login screen and click 'Forgot Password'. A secure reset link will be sent to your registered email address.";
      }
    }

    // Admissions / Education Queries
    if (agentName.includes('admissions') || agentName.includes('college') || instructions.includes('admissions')) {
      if (q.includes('deadline') || q.includes('date') || q.includes('last')) {
        return "Round 1 applications close on December 1st, and regular admissions remain open until February 15th.";
      }
      if (q.includes('scholarship') || q.includes('merit') || q.includes('fee')) {
        return "Yes, merit scholarships covering up to 50% of tuition are available based on entrance exam scores and academic records.";
      }
      if (q.includes('tour') || q.includes('visit') || q.includes('campus')) {
        return "We host guided campus tours every Saturday morning at 10:00 AM. Would you like me to reserve your tour passes?";
      }
    }

    // Hospitality & Dining Queries
    if (agentName.includes('restaurant') || agentName.includes('table') || agentName.includes('reservation')) {
      if (q.includes('hours') || q.includes('open') || q.includes('time')) {
        return "We serve lunch from 12:00 PM to 3:30 PM and dinner from 6:30 PM to 11:00 PM daily.";
      }
      if (q.includes('table') || q.includes('reserve') || q.includes('book') || q.includes('people') || q.includes('tonight')) {
        return "I would be delighted to reserve a table for you! For how many guests, and at what time would you prefer to dine?";
      }
    }

    // Guardrail: Unknown inquiry fallback
    if (agent?.guardrails?.unknownAnswerBehavior) {
      return agent.guardrails.unknownAnswerBehavior;
    }

    // General courteous default response
    if (isHindiQuery || isHindiAgent) {
      return "Maine aapki request note kar li hai. Kya aap is baare me thoda aur vistaar se bata sakte hain taaki main aapki behtar sahayata kar sakoon?";
    }

    return "Thank you for that question! I have recorded your inquiry. Could you provide a bit more detail so I can give you the most accurate guidance?";
  }

  /* =========================================================================
   * 3. AUDIO PLAYBACK & SPEECH RECOGNITION CONTROLS
   * ========================================================================= */

  replayMessage(text) {
    if (!text) return;
    this.speakDemoText(text);
  }

  pausePlayback() {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.onModeChange('idle');
    }
  }

  resumePlayback() {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.onModeChange('speaking');
    }
  }

  stopPlayback() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this._stopHeartbeat();
      this.isSpeaking = false;
      this.isPaused = false;
      this.onModeChange('listening');
    }
  }

  /**
   * Browser Speech Recognition for spoken conversation in Demo Mode
   */
  startSpeechRecognition({ onSpeechStart, onSpeechResult, onSpeechEnd, onError }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError("Browser speech recognition is not supported in this browser. Please use text input.");
      return null;
    }

    try {
      this.stopSpeechRecognition();

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = this.currentAgent?.primaryLanguage?.includes('Hindi') ? 'hi-IN' : 'en-US';

      rec.onstart = () => {
        this.isRecognizing = true;
        this.onModeChange('listening');
        if (onSpeechStart) onSpeechStart();
      };

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (onSpeechResult) onSpeechResult(transcript, event.results[event.results.length - 1].isFinal);
      };

      rec.onerror = (e) => {
        console.warn('SpeechRecognition error:', e);
        this.isRecognizing = false;
        if (onError) onError(e.error === 'not-allowed' ? "Microphone access blocked." : e.error);
      };

      rec.onend = () => {
        this.isRecognizing = false;
        if (onSpeechEnd) onSpeechEnd();
      };

      rec.start();
      this.recognition = rec;
      return rec;
    } catch (err) {
      if (onError) onError(err.message);
      return null;
    }
  }

  stopSpeechRecognition() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
      this.isRecognizing = false;
    }
  }

  async _setupDemoMicAudio() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.waveformDataArray = new Uint8Array(bufferLength);

      const updateDemoWaveform = () => {
        if (!this.isDemo || !this.analyser) return;
        if (this.analyser && this.waveformDataArray) {
          this.analyser.getByteFrequencyData(this.waveformDataArray);
          this.onWaveformData(this.waveformDataArray);
        }
        this._animationFrameId = requestAnimationFrame(updateDemoWaveform);
      };
      this._animationFrameId = requestAnimationFrame(updateDemoWaveform);
    } catch {
      // User declined mic or mic not available; Demo Mode gracefully works with text
    }
  }

  /* =========================================================================
   * 4. SESSION TERMINATION & CLEANUP
   * ========================================================================= */

  async endSession() {
    this.cleanup();
    this.onStatusChange('disconnected');
    this.onModeChange('idle');
  }

  cleanup() {
    // 1. Stop live ElevenLabs session
    if (this.liveConversation) {
      try {
        this.liveConversation.endSession();
      } catch (e) {
        console.warn('Error ending ElevenLabs session:', e);
      }
      this.liveConversation = null;
    }

    // 2. Stop speech recognition
    this.stopSpeechRecognition();

    // 3. Cancel speech synthesis & heartbeat
    this._stopHeartbeat();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this._activeUtterance = null;

    // 4. Stop Web Audio & mic streams
    this._stopLiveWaveformLoop();
    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach(track => track.stop());
      } catch {
        // ignore
      }
      this.micStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
      this.analyser = null;
    }

    this.isLive = false;
    this.isDemo = false;
    this.isSpeaking = false;
    this.isListening = false;
    this.isPaused = false;
  }
}
