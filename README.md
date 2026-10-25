# VoiceForge — Describe It. Talk to It. Deploy It.

**VoiceForge** is a no-code voice AI agent builder that converts natural-language descriptions into interactive, production-ready voice agents. Powered by ElevenLabs Conversational AI with an instant zero-credential **Demo Mode**, VoiceForge lets you describe an agent persona in plain English or Hindi, test live voice conversations with real-time audio waveforms, refine instructions naturally, and inspect deployment readiness.

---

## 🌟 Key Features

- **Natural-Language Agent Builder**: Type a prompt like *"Create a friendly clinic receptionist who speaks Hindi and English, answers clinic FAQs, explains opening hours, and helps patients with appointment enquiries"* — VoiceForge infers domain rules, personality, welcome greetings, and FAQs.
- **Deterministic Local Template Engine**: Works immediately with zero external API fees or paid LLM tokens. When no LLM key is configured, an intelligent parser detects domain (healthcare, customer support, university admissions, e-commerce) and multilingual requirements.
- **ElevenLabs Conversational AI Integration**:
  - Secure backend authorization via signed URLs (`/api/elevenlabs/signed-url`).
  - Private API keys are strictly kept server-side and **never exposed** to browser bundles.
  - Real-time client sessions using the official `@11labs/client` SDK with WebSocket streaming.
- **Hackathon Demo Mode**: No API keys required! Built-in simulated voice conversations with animated audio waveforms, speech synthesis, and turn-by-turn transcripts for reliable presentation.
- **Natural-Language Refinement**: Test your voice agent and refine it with simple feedback like *"Make the greeting shorter and warmer"* or *"Respond in Hindi when the caller speaks Hindi"*.
- **Agent Knowledge & Guardrails**: Add, edit, and preview FAQ question-and-answer pairs, define out-of-scope topics, and set emergency/human escalation rules.
- **Conversation History & Auditing**: Review past conversation logs, durations, and complete transcript messages with distinct Demo Mode vs. Live ElevenLabs badges.
- **Deployment Readiness Checklist**: 6-point pre-flight checklist with copyable React SDK and HTML embed snippets.
- **Lightweight JSON Persistence**: Thread-safe local JSON storage (`server/data/agents.json` and `server/data/conversations.json`) with sample data seeded on first launch.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Lucide React icons, plain CSS design system.
- **Backend**: Node.js, Express, dotenv, cors.
- **Voice SDK**: Official ElevenLabs `@11labs/client` library.
- **Persistence**: Local JSON flat-file storage with atomic write safeguards.
- **Aesthetic**: Tailored SaaS light theme (`#F8F7FF` background, `#7656E8` primary purple, `#B9A7FF` lavender, `#DDF7EC` soft mint).

---

## 📂 Project Structure

```
Voiceforge/
├── .env                  # Local environment configuration (git-ignored)
├── .env.example          # Template environment file
├── .gitignore            # Ignores node_modules, dist, and .env
├── package.json          # Root scripts
├── README.md             # Complete documentation and setup guide
├── scripts/
│   └── start.js          # Launcher for concurrent backend + frontend
├── server/
│   ├── app.js            # Express application middleware & routes
│   ├── server.js         # Server entry point (Port 5000)
│   ├── package.json
│   ├── data/
│   │   ├── agents.json         # Seeded & created voice agents
│   │   └── conversations.json  # Recorded session transcripts
│   ├── routes/
│   │   ├── agents.js           # CRUD & prompt parsing
│   │   ├── conversations.js    # Session history & transcript persistence
│   │   ├── elevenlabs.js       # Signed URLs & voice catalog
│   │   └── health.js           # Health check & live statistics
│   └── services/
│       ├── agentParser.js      # Natural-language parser & refinement engine
│       ├── elevenLabsService.js # Secure ElevenLabs API caller
│       └── storage.js          # Safe JSON read/write & data seeding
└── client/
    ├── index.html        # HTML entry point with Plus Jakarta Sans & Inter
    ├── package.json
    ├── vite.config.js    # Vite config with /api proxy to port 5000
    └── src/
        ├── App.jsx       # Persistent layout and React routes
        ├── main.jsx      # React DOM bootstrap
        ├── index.css     # Curated design system tokens & responsive CSS
        ├── components/
        │   ├── AgentCard.jsx         # Searchable agent card with actions
        │   ├── Modal.jsx             # Reusable accessible dialog
        │   ├── Navbar.jsx            # Top bar with health indicator
        │   ├── Sidebar.jsx           # Persistent sidebar navigation
        │   ├── StatusBadge.jsx       # Visual status & environment badges
        │   └── WaveformAnimation.jsx # Dynamic audio waveform visualizer
        ├── pages/
        │   ├── Overview.jsx          # Dashboard with stats & prompt creator
        │   ├── AgentsList.jsx        # Search, filter, duplicate & delete
        │   ├── CreateAgent.jsx       # 3-step natural language agent builder
        │   ├── AgentDetail.jsx       # Full agent configuration & FAQ editor
        │   ├── Playground.jsx        # Live voice calls & Demo Mode testing
        │   ├── Conversations.jsx     # Transcript history & session viewer
        │   ├── Deploy.jsx            # Pre-flight checklist & embed code
        │   └── Settings.jsx          # Integration status & credential guide
        └── services/
            ├── api.js                # Centralized backend HTTP client
            └── elevenLabsClient.js   # @11labs/client manager & Demo Mode
```

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

---

## 🚀 Installation & Getting Started

### 1. Clone or Open Workspace
Open a terminal in the `Voiceforge` root folder.

### 2. Install Dependencies
Install dependencies for both backend and frontend:
```bash
npm run install:all
```
*(Or run `npm install` inside `server/` and `client/` separately).*

### 3. Verify Environment File
A `.env` file has been pre-created from `.env.example`. Check that it exists in the root:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_VOICE_ID=
LLM_API_KEY=
```
*Note: The app will run immediately in **Demo Mode** even if all keys are left blank!*

### 4. Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```

Alternatively, run each service in separate terminal windows:
- **Backend (Port 5000)**:
  ```bash
  npm run dev:server
  ```
- **Frontend (Port 5173)**:
  ```bash
  npm run dev:client
  ```

### 5. Access VoiceForge
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 ElevenLabs Setup (Optional for Live Calls)

VoiceForge does **not** require any API keys to test conversations. However, if you have an ElevenLabs account and want to test real bidirectional voice streaming:

1. Obtain your API key from [ElevenLabs Dashboard](https://elevenlabs.io).
2. Create an agent in [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai) and copy the **Agent ID**.
3. Open the `.env` file in the root folder and paste your keys:
   ```env
   ELEVENLABS_API_KEY=xi_api_your_key_here
   ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
   ```
4. Restart the backend server (`npm run dev` or restart the server process).
5. The UI will instantly display **ElevenLabs Live** in the sidebar and enable **Start ElevenLabs Live Call** in the Playground!

---

## 🎭 Demo Mode & Seeded Data

When starting VoiceForge for the first time with empty JSON storage, the system automatically seeds realistic sample records:

1. **Aarogya Clinic Receptionist**: Bilingual Hindi & English assistant with operating hours, fee structure, and urgent emergency safety guardrails.
2. **Apex Cloud Support Assistant**: English customer support agent handling billing cycles, invoices, and tier upgrades.
3. **Vidyapeeth Admissions Advisor**: Higher-education advisor for B.Tech programs, cutoff percentiles, and campus visit bookings.
4. **Sample Conversation Logs**: 4 realistic sessions with transcripts, timestamps, and durations.

*All seeded records are clearly tagged with a yellow `Sample Data` badge to prevent confusing simulated tests with genuine production usage.*

---

## ⏱️ 3-Minute Hackathon Demonstration Steps

Follow these steps to demonstrate the full end-to-end workflow:

1. **Open Dashboard (`/`)**: Show the live statistics derived from stored data (Total Agents, Ready to Test, Deployed, Sessions).
2. **Enter Prompt**: Click the *"Clinic Receptionist (Hindi & English)"* example button.
3. **Generate Configuration**: Click **Generate Agent Configuration** — observe the deterministic engine structure the name, welcome message, system prompt, and FAQs without consuming LLM credits.
4. **Customize & Save**: Review the generated Hindi/English welcome greeting and FAQs, then click **Save Agent**.
5. **Test in Voice Playground (`/playground`)**:
   - Select your newly created clinic agent.
   - Click **Start Demo Conversation** (or **Start ElevenLabs Live Call** if credentials are set).
   - Watch the animated waveform respond to speaking/listening turns and observe real-time transcripts appearing.
   - Click **End Conversation & Save History**.
6. **Refine Using Natural Language**:
   - Scroll down to *"How would you like to improve your agent?"*.
   - Click *"Respond in Hindi when the caller speaks Hindi"* or type *"Make the greeting shorter and warmer"*.
   - Click **Apply Refinement** and review the proposed configuration diff.
   - Click **Save Refined Changes**.
7. **Inspect Deployment Readiness (`/deploy`)**:
   - Review the 6-point pre-flight checklist.
   - Click **Copy React Code** to show how easy it is to embed the agent into production websites.

---

## 🔒 Security & Reliability

- **Private API Keys**: `ELEVENLABS_API_KEY` is loaded on the backend with `dotenv`. It is **never** sent to the client browser, never printed in client logs, and never returned in API payloads.
- **Client Authentication**: Browser sessions use secure signed URLs generated by the server (`GET /api/elevenlabs/signed-url`).
- **Git Ignore**: Root `.gitignore` includes `.env`, `node_modules`, and `dist`.
- **Safe Persistence**: Writes to JSON files use temporary atomic write patterns to avoid file corruption on unexpected crashes.
- **Clean Resource Teardown**: Exiting the Playground stops WebRTC/WebSocket audio streams, cancels browser speech synthesis, and cleans up microphone access.

---

## 📜 License
MIT © 2026 VoiceForge Team.
