import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');

// Ensure data folder exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Seed data definitions
const SAMPLE_AGENTS = [
  {
    id: "agent-clinic-receptionist-001",
    name: "Aarogya Clinic Receptionist",
    purpose: "Friendly clinic receptionist who speaks Hindi and English, answers clinic FAQs, explains opening hours, and helps patients with appointment enquiries.",
    role: "Healthcare Front-Desk Coordinator & Triage Assistant",
    primaryLanguage: "Hindi",
    supportedLanguages: ["Hindi", "English"],
    tone: "Empathetic, clear, and reassuring",
    welcomeMessage: "Namaste! Welcome to Aarogya Health Clinic. Main aapki appointment booking aur clinic jaankari me kaise madad kar sakta hoon?",
    systemInstructions: `You are the primary front-desk voice assistant for Aarogya Health Clinic.
Your responsibilities:
1. Greet patients warmly in a bilingual Hindi and English blend or the language they prefer.
2. Help patients schedule, reschedule, or cancel consultations with general physicians and specialists.
3. Provide clinic hours: Mon-Sat 8:00 AM to 8:00 PM, Sunday 9:00 AM to 1:00 PM for emergencies.
4. Answer parking, doctor availability, and fee inquiries.
5. In case of severe chest pain, breathing difficulty, or critical trauma, immediately advise calling 112/108 or visiting the nearest hospital emergency room.`,
    conversationGoals: [
      "Identify the patient's concern or required doctor specialty",
      "Offer suitable appointment slots based on clinic availability",
      "Collect patient name and phone number for booking confirmation",
      "Provide clear directions, clinic timing, and fee details"
    ],
    faqs: [
      {
        id: "faq-1",
        question: "What are your operating hours?",
        answer: "Our clinic is open Monday through Saturday from 8:00 AM to 8:00 PM, and on Sundays from 9:00 AM to 1:00 PM."
      },
      {
        id: "faq-2",
        question: "How much is the general consultation fee?",
        answer: "A standard consultation with our general physician is ₹500. Specialist consultations range between ₹800 and ₹1,200."
      },
      {
        id: "faq-3",
        question: "Kya main Hindi me baat kar sakta hoon?",
        answer: "Haan bilkul! Hum Hindi aur English dono bhashaon me aapki poori sahayata karne ke liye uplabdh hain."
      },
      {
        id: "faq-4",
        question: "Do you accept walk-in patients without an appointment?",
        answer: "Yes, walk-ins are accepted on a first-come, first-served basis, but pre-booking is recommended to minimize waiting time."
      }
    ],
    guardrails: {
      topicsToAvoid: ["Prescribing prescription medications", "Diagnosing complex lab reports", "Guaranteeing surgical outcomes"],
      unknownAnswerBehavior: "Politely state that you will connect them with the duty clinic nurse or desk coordinator rather than guessing.",
      humanEscalation: "Transfer immediately or provide direct front-desk phone number (+91 11-4920-8000) whenever the patient has an urgent medical concern.",
      behavioralConstraints: "Never dispute symptoms, keep answers under 3 sentences for natural voice flow, and always maintain patient privacy."
    },
    voice: {
      id: "21m00Tcm4TlvDq8ikWAM",
      name: "Rachel",
      provider: "elevenlabs"
    },
    status: "Ready to Test",
    isSample: true,
    isRemoteDeployed: false,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-24T09:30:00.000Z"
  },
  {
    id: "agent-customer-support-002",
    name: "Apex Cloud Support Assistant",
    purpose: "Customer support assistant that explains subscription tiers, handles billing queries, and assists users with account access.",
    role: "Tier-1 Technical Support & Billing Specialist",
    primaryLanguage: "English",
    supportedLanguages: ["English"],
    tone: "Courteous, solution-focused, and concise",
    welcomeMessage: "Hi there! Welcome to Apex Cloud Support. Are you calling about your subscription, an invoice, or technical troubleshooting?",
    systemInstructions: `You are Apex Cloud's tier-1 voice assistant.
Your responsibilities:
1. Assist users with questions about billing cycles, invoicing, and subscription tier upgrades.
2. Guide users through password resets and multi-factor authentication issues.
3. For service outages or advanced API errors, gather error codes and create a support ticket.
4. Keep spoken responses brief, actionable, and conversational.`,
    conversationGoals: [
      "Understand the customer's account or billing inquiry",
      "Verify account details safely without collecting raw passwords",
      "Provide step-by-step resolution or escalate to Tier-2 engineers"
    ],
    faqs: [
      {
        id: "faq-cs-1",
        question: "Where can I find my monthly invoices?",
        answer: "You can download all PDF invoices directly under Settings > Billing in your Apex Cloud dashboard."
      },
      {
        id: "faq-cs-2",
        question: "Can I upgrade my plan mid-cycle?",
        answer: "Yes! Upgrades take effect immediately, and any unused portion of your previous tier is prorated on your next bill."
      },
      {
        id: "faq-cs-3",
        question: "What is your refund policy?",
        answer: "We offer a 14-day money-back guarantee for annual plans if requested within two weeks of purchase."
      }
    ],
    guardrails: {
      topicsToAvoid: ["Requesting complete credit card numbers", "Disclosing server infrastructure credentials", "Speculating on unannounced product features"],
      unknownAnswerBehavior: "Offer to create a high-priority ticket for our customer success team.",
      humanEscalation: "Transfer to live billing specialist if a dispute exceeds $100 or when user repeatedly requests an agent.",
      behavioralConstraints: "Do not argue with frustrated users; validate their frustration and provide immediate next steps."
    },
    voice: {
      id: "AZnzlk1XvdvUeBnXmlld",
      name: "Domi",
      provider: "elevenlabs"
    },
    status: "Ready to Test",
    isSample: true,
    isRemoteDeployed: false,
    createdAt: "2026-10-21T14:15:00.000Z",
    updatedAt: "2026-10-23T16:45:00.000Z"
  },
  {
    id: "agent-college-enquiry-003",
    name: "Vidyapeeth Admissions Advisor",
    purpose: "Admissions advisor helping prospective students and parents with course details, admission deadlines, fee structures, and campus visits.",
    role: "Academic Counselor & University Information Officer",
    primaryLanguage: "English",
    supportedLanguages: ["English", "Hindi"],
    tone: "Encouraging, knowledgeable, and polite",
    welcomeMessage: "Greetings from Vidyapeeth Institute of Technology! How can I assist you with admissions, campus life, or program details today?",
    systemInstructions: `You are the prospective student voice advisor for Vidyapeeth Institute.
Your responsibilities:
1. Explain undergraduate and postgraduate degree programs in Computer Science, AI, and Electronics.
2. Outline admission eligibility, cutoffs, entrance exam timelines, and scholarship criteria.
3. Help students and parents book weekend campus tour slots.
4. Seamlessly switch between Hindi and English depending on the caller's comfort.`,
    conversationGoals: [
      "Find out the prospective student's program of interest",
      "Share application deadlines and entrance exam requirements",
      "Offer scholarship information based on merit and financial need",
      "Schedule a campus walkthrough or schedule a callback with the dean of admissions"
    ],
    faqs: [
      {
        id: "faq-ad-1",
        question: "What is the application deadline for the B.Tech program?",
        answer: "Round 1 admissions close on November 30th. Round 2 applications will be open until January 15th."
      },
      {
        id: "faq-ad-2",
        question: "Are merit-based scholarships available?",
        answer: "Yes, we offer up to 75% tuition fee waivers for top percentile scorers in JEE Main and state entrance exams."
      },
      {
        id: "faq-ad-3",
        question: "Can we schedule a campus visit?",
        answer: "Campus tours are conducted every Saturday at 10:00 AM and 2:00 PM. I can reserve your passes right now."
      }
    ],
    guardrails: {
      topicsToAvoid: ["Guaranteeing job placements or starting salaries", "Bypassing university regulatory requirements"],
      unknownAnswerBehavior: "Direct the caller to admissions@vidyapeeth.edu or schedule a callback.",
      humanEscalation: "Provide admissions helpline (+91 80-2345-6789) when callers need quota or hostel allotment advice.",
      behavioralConstraints: "Maintain academic decorum and encourage student curiosity."
    },
    voice: {
      id: "EXAVITQu4vr4xnSDxMaL",
      name: "Bella",
      provider: "elevenlabs"
    },
    status: "Draft",
    isSample: true,
    isRemoteDeployed: false,
    createdAt: "2026-10-22T08:20:00.000Z",
    updatedAt: "2026-10-24T11:00:00.000Z"
  }
];

const SAMPLE_CONVERSATIONS = [
  {
    id: "conv-sample-001",
    agentId: "agent-clinic-receptionist-001",
    agentName: "Aarogya Clinic Receptionist",
    type: "Demo Mode",
    isSample: true,
    startTime: "2026-10-24T12:15:00.000Z",
    duration: "1m 48s",
    status: "Completed",
    transcript: [
      {
        speaker: "agent",
        timestamp: "12:15:01",
        text: "Namaste! Welcome to Aarogya Health Clinic. Main aapki appointment booking aur clinic jaankari me kaise madad kar sakta hoon?"
      },
      {
        speaker: "user",
        timestamp: "12:15:08",
        text: "Hi, kya Dr. Sharma aaj shaam ko available hain? Mujhe fever aur cough ki checkup karwani hai."
      },
      {
        speaker: "agent",
        timestamp: "12:15:15",
        text: "Ji haan! Dr. Sharma General Physician aaj shaam 5:00 PM se 7:30 PM tak clinic me available hain. Kya main aapke liye 5:30 PM ka slot book kar doon?"
      },
      {
        speaker: "user",
        timestamp: "12:15:23",
        text: "Haan 5:30 theek rahega. Consultation fees kitni hogi?"
      },
      {
        speaker: "agent",
        timestamp: "12:15:30",
        text: "Dr. Sharma ki general consultation fee ₹500 hai. Kripya apna shubh naam aur phone number batayein taaki booking confirm ho sake."
      },
      {
        speaker: "user",
        timestamp: "12:15:38",
        text: "Mera naam Rahul Verma hai, number 9876543210."
      },
      {
        speaker: "agent",
        timestamp: "12:15:45",
        text: "Aapki appointment Dr. Sharma ke sath aaj shaam 5:30 PM ke liye confirm ho gayi hai Rahul ji. Confirmation SMS bhej diya gaya hai. Apna khayal rakhein!"
      }
    ],
    metadata: {
      sentiment: "Positive",
      resolved: true,
      satisfactionRating: 5
    }
  },
  {
    id: "conv-sample-002",
    agentId: "agent-customer-support-002",
    agentName: "Apex Cloud Support Assistant",
    type: "Demo Mode",
    isSample: true,
    startTime: "2026-10-24T13:40:00.000Z",
    duration: "2m 12s",
    status: "Completed",
    transcript: [
      {
        speaker: "agent",
        timestamp: "13:40:01",
        text: "Hi there! Welcome to Apex Cloud Support. Are you calling about your subscription, an invoice, or technical troubleshooting?"
      },
      {
        speaker: "user",
        timestamp: "13:40:07",
        text: "Hello, I noticed a charge on my credit card this morning and want to view the itemized breakdown."
      },
      {
        speaker: "agent",
        timestamp: "13:40:15",
        text: "I can certainly guide you to that. You can view and download all itemized invoices by logging in and navigating to Settings > Billing."
      },
      {
        speaker: "user",
        timestamp: "13:40:24",
        text: "Can I also switch our payment method from monthly credit card to corporate annual invoice?"
      },
      {
        speaker: "agent",
        timestamp: "13:40:32",
        text: "Yes, corporate invoicing is supported for our Growth and Enterprise plans. Would you like me to flag this for our billing specialist to prepare your enterprise agreement?"
      },
      {
        speaker: "user",
        timestamp: "13:40:40",
        text: "Yes please, that would be very helpful."
      },
      {
        speaker: "agent",
        timestamp: "13:40:48",
        text: "I have created ticket #APX-8492 for our enterprise billing desk. You will receive an email within 2 business hours. Is there anything else I can assist with today?"
      }
    ],
    metadata: {
      sentiment: "Satisfied",
      resolved: true,
      ticketCreated: "APX-8492"
    }
  },
  {
    id: "conv-sample-003",
    agentId: "agent-college-enquiry-003",
    agentName: "Vidyapeeth Admissions Advisor",
    type: "Demo Mode",
    isSample: true,
    startTime: "2026-10-24T14:10:00.000Z",
    duration: "1m 35s",
    status: "Completed",
    transcript: [
      {
        speaker: "agent",
        timestamp: "14:10:02",
        text: "Greetings from Vidyapeeth Institute of Technology! How can I assist you with admissions, campus life, or program details today?"
      },
      {
        speaker: "user",
        timestamp: "14:10:10",
        text: "Hi, what is the cutoff for Artificial Intelligence and Data Science B.Tech program?"
      },
      {
        speaker: "agent",
        timestamp: "14:10:18",
        text: "For the AI & Data Science B.Tech program, the expected JEE Main percentile cutoff is around 88 percentile, and state exam cutoff is rank 4500. Round 1 closes November 30th."
      },
      {
        speaker: "user",
        timestamp: "14:10:27",
        text: "Do you have hostel facilities for outstation students?"
      },
      {
        speaker: "agent",
        timestamp: "14:10:34",
        text: "Yes, we provide Wi-Fi enabled single and twin sharing hostels with round-the-clock security and dining. We also organize campus tours every Saturday at 10 AM. Would you like to reserve a visit pass?"
      }
    ],
    metadata: {
      sentiment: "Neutral",
      resolved: true,
      courseInterested: "B.Tech AI & Data Science"
    }
  },
  {
    id: "conv-sample-004",
    agentId: "agent-clinic-receptionist-001",
    agentName: "Aarogya Clinic Receptionist",
    type: "Demo Mode",
    isSample: true,
    startTime: "2026-10-24T15:02:00.000Z",
    duration: "1m 10s",
    status: "Completed",
    transcript: [
      {
        speaker: "agent",
        timestamp: "15:02:01",
        text: "Namaste! Welcome to Aarogya Health Clinic. Main aapki appointment booking aur clinic jaankari me kaise madad kar sakta hoon?"
      },
      {
        speaker: "user",
        timestamp: "15:02:08",
        text: "What are your Sunday timings? Is pediatric care available on Sundays?"
      },
      {
        speaker: "agent",
        timestamp: "15:02:16",
        text: "On Sundays our clinic is open from 9:00 AM to 1:00 PM for urgent consultations. Our on-duty pediatrician is available till 12:30 PM."
      },
      {
        speaker: "user",
        timestamp: "15:02:24",
        text: "Great, thank you so much for the quick information!"
      },
      {
        speaker: "agent",
        timestamp: "15:02:29",
        text: "You are most welcome! Wishing good health to your family. Namaste!"
      }
    ],
    metadata: {
      sentiment: "Positive",
      resolved: true
    }
  }
];

// In-memory cache fallback for read-only serverless environments (e.g., Vercel)
const memoryCache = {
  [AGENTS_FILE]: null,
  [CONVERSATIONS_FILE]: null
};

// Helper to safely read JSON
async function readJsonFile(filePath, defaultData = []) {
  if (memoryCache[filePath] !== null) {
    return memoryCache[filePath];
  }

  try {
    await ensureDataDir();
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    const result = Array.isArray(parsed) ? parsed : defaultData;
    memoryCache[filePath] = result;
    return result;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File does not exist, write default data
      await writeJsonFile(filePath, defaultData);
      memoryCache[filePath] = defaultData;
      return defaultData;
    }
    console.error(`Error reading ${filePath}:`, err.message);
    return memoryCache[filePath] || defaultData;
  }
}

// Helper to safely write JSON
async function writeJsonFile(filePath, data) {
  memoryCache[filePath] = data;
  try {
    await ensureDataDir();
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    const serialized = JSON.stringify(data, null, 2);
    await fs.writeFile(tempPath, serialized, 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (err) {
    if (err.code === 'EROFS' || err.code === 'EACCES') {
      console.warn(`[StorageService] Read-only filesystem detected (${err.code}). Persisted change to in-memory store for serverless execution.`);
      return;
    }
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

// Storage service API
export const StorageService = {
  async init() {
    await ensureDataDir();
    // Check if agents file exists and has content
    try {
      const existingAgents = await this.getAgents();
      if (!existingAgents || existingAgents.length === 0) {
        console.log('Seeding initial sample agents...');
        await writeJsonFile(AGENTS_FILE, SAMPLE_AGENTS);
      }
    } catch {
      await writeJsonFile(AGENTS_FILE, SAMPLE_AGENTS);
    }

    // Check if conversations file exists and has content
    try {
      const existingConvs = await this.getConversations();
      if (!existingConvs || existingConvs.length === 0) {
        console.log('Seeding initial sample conversations...');
        await writeJsonFile(CONVERSATIONS_FILE, SAMPLE_CONVERSATIONS);
      }
    } catch {
      await writeJsonFile(CONVERSATIONS_FILE, SAMPLE_CONVERSATIONS);
    }
  },

  async getAgents() {
    return await readJsonFile(AGENTS_FILE, []);
  },

  async getAgentById(id) {
    const agents = await this.getAgents();
    return agents.find(a => a.id === id) || null;
  },

  async saveAgent(agentData) {
    const agents = await this.getAgents();
    const newAgent = {
      ...agentData,
      id: agentData.id || `agent-${Date.now()}`,
      isSample: false,
      isRemoteDeployed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    agents.unshift(newAgent);
    await writeJsonFile(AGENTS_FILE, agents);
    return newAgent;
  },

  async updateAgent(id, updates) {
    const agents = await this.getAgents();
    const index = agents.findIndex(a => a.id === id);
    if (index === -1) return null;

    agents[index] = {
      ...agents[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile(AGENTS_FILE, agents);
    return agents[index];
  },

  async deleteAgent(id) {
    const agents = await this.getAgents();
    const filtered = agents.filter(a => a.id !== id);
    if (filtered.length === agents.length) return false;
    await writeJsonFile(AGENTS_FILE, filtered);
    return true;
  },

  async duplicateAgent(id) {
    const agent = await this.getAgentById(id);
    if (!agent) return null;

    const duplicate = {
      ...agent,
      id: `agent-${Date.now()}`,
      name: `${agent.name} (Copy)`,
      status: "Draft",
      isSample: false,
      isRemoteDeployed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const agents = await this.getAgents();
    agents.unshift(duplicate);
    await writeJsonFile(AGENTS_FILE, agents);
    return duplicate;
  },

  async getConversations() {
    return await readJsonFile(CONVERSATIONS_FILE, []);
  },

  async getConversationById(id) {
    const conversations = await this.getConversations();
    return conversations.find(c => c.id === id) || null;
  },

  async saveConversation(convData) {
    const conversations = await this.getConversations();
    const newConv = {
      id: convData.id || `conv-${Date.now()}`,
      agentId: convData.agentId,
      agentName: convData.agentName || "Unknown Agent",
      type: convData.type || "Live ElevenLabs Session",
      isSample: !!convData.isSample,
      startTime: convData.startTime || new Date().toISOString(),
      duration: convData.duration || "0m 00s",
      status: convData.status || "Completed",
      transcript: convData.transcript || [],
      metadata: convData.metadata || {}
    };
    conversations.unshift(newConv);
    await writeJsonFile(CONVERSATIONS_FILE, conversations);
    return newConv;
  },

  async getStats() {
    const agents = await this.getAgents();
    const conversations = await this.getConversations();

    const totalAgents = agents.length;
    const readyAgents = agents.filter(a => a.status === 'Ready to Test').length;
    const deployedAgents = agents.filter(a => a.status === 'Deployed' || a.isRemoteDeployed).length;
    const totalSessions = conversations.length;
    const liveSessions = conversations.filter(c => c.type && c.type.toLowerCase().includes('live')).length;
    const demoSessions = conversations.filter(c => c.isSample || (c.type && c.type.toLowerCase().includes('demo'))).length;

    // Recent 5 agents
    const recentAgents = [...agents]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    return {
      totalAgents,
      readyAgents,
      deployedAgents,
      totalSessions,
      liveSessions,
      demoSessions,
      recentAgents
    };
  }
};
