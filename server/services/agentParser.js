/**
 * Agent Parser & Natural Language Refinement Engine
 * Deterministic, intelligent local template parsing without requiring a paid LLM API.
 * Detects domain keywords, multilingual intent, tone, FAQs, and guardrails.
 */

// Preset voices with clean metadata and realistic tone descriptors
export const DEFAULT_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", tone: "Calm & Reassuring", description: "Warm, empathetic tone suited for healthcare, hospitality, and advising", accent: "American" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", tone: "Confident & Professional", description: "Crisp, articulate tone ideal for technical support, SaaS, and interview practice", accent: "American" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", tone: "Approachable & Engaging", description: "Energetic, engaging voice ideal for education, admissions, and coaching", accent: "American" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", tone: "Warm & Articulate", description: "Balanced, friendly voice ideal for general reception and customer concierge", accent: "American" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", tone: "Energetic & Friendly", description: "Youthful, upbeat tone suited for e-commerce, fitness, and retail assistants", accent: "American" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", tone: "Deep & Authoritative", description: "Deep, trustworthy tone ideal for corporate, finance, and legal triage", accent: "American" }
];

export function parsePromptToAgentConfig({ prompt, name, useCase }) {
  const p = (prompt || "").toLowerCase();
  const uc = (useCase || "").toLowerCase();

  // 1. Detect Languages
  const mentionsHindi = p.includes("hindi") || p.includes("hinglish") || p.includes("bilingual") || p.includes("namaste");
  const mentionsSpanish = p.includes("spanish") || p.includes("espanol");
  const mentionsFrench = p.includes("french") || p.includes("francais");

  let primaryLanguage = "English";
  let supportedLanguages = ["English"];

  if (mentionsHindi) {
    primaryLanguage = p.includes("primarily hindi") || p.includes("only hindi") ? "Hindi" : "Hindi / English";
    supportedLanguages = ["Hindi", "English"];
  } else if (mentionsSpanish) {
    primaryLanguage = "Spanish";
    supportedLanguages = ["Spanish", "English"];
  } else if (mentionsFrench) {
    primaryLanguage = "French";
    supportedLanguages = ["French", "English"];
  }

  // 2. Detect Domain
  let domain = "general";
  if (p.includes("interview") || p.includes("mock") || p.includes("practice buddy") || p.includes("job") || uc.includes("interview")) {
    domain = "interview";
  } else if (p.includes("clinic") || p.includes("doctor") || p.includes("hospital") || p.includes("patient") || p.includes("health") || p.includes("appointment") || uc.includes("clinic") || uc.includes("health")) {
    domain = "clinic";
  } else if (p.includes("college") || p.includes("university") || p.includes("admission") || p.includes("student") || p.includes("course") || p.includes("campus") || uc.includes("education")) {
    domain = "education";
  } else if (p.includes("support") || p.includes("billing") || p.includes("subscription") || p.includes("refund") || p.includes("ticket") || p.includes("saas") || uc.includes("support")) {
    domain = "customer_support";
  } else if (p.includes("order") || p.includes("ecommerce") || p.includes("e-commerce") || p.includes("delivery") || p.includes("shopping") || p.includes("cart") || p.includes("shipping") || uc.includes("ecommerce")) {
    domain = "ecommerce";
  } else if (p.includes("hotel") || p.includes("restaurant") || p.includes("booking") || p.includes("table") || p.includes("reservation") || uc.includes("hospitality")) {
    domain = "hospitality";
  } else if (p.includes("fitness") || p.includes("workout") || p.includes("gym") || p.includes("trainer") || p.includes("diet")) {
    domain = "fitness";
  } else if (p.includes("law") || p.includes("legal") || p.includes("attorney") || p.includes("lawyer")) {
    domain = "legal";
  } else if (p.includes("real estate") || p.includes("property") || p.includes("rent") || p.includes("apartment")) {
    domain = "real_estate";
  }

  // 3. Detect Tone
  let tone = "Professional, courteous, and helpful";
  if (p.includes("friendly") || p.includes("warm")) tone = "Friendly, empathetic, and welcoming";
  if (p.includes("concise") || p.includes("quick") || p.includes("efficient")) tone = "Concise, rapid, and solution-focused";
  if (p.includes("authoritative") || p.includes("formal")) tone = "Formal, authoritative, and precise";
  if (p.includes("encouraging") || p.includes("motivating")) tone = "Encouraging, supportive, and constructive";

  // 4. Generate structured config based on domain
  let parsedName = name?.trim();
  let role = "";
  let purpose = prompt;
  let welcomeMessage = "";
  let systemInstructions = "";
  let conversationGoals = [];
  let faqs = [];
  let guardrails = {
    topicsToAvoid: [],
    unknownAnswerBehavior: "",
    humanEscalation: "",
    behavioralConstraints: ""
  };
  let voice = DEFAULT_VOICES[0];

  switch (domain) {
    case "interview":
      if (!parsedName) parsedName = "AI Interview Practice Coach";
      role = "Mock Interviewer & Career Feedback Coach";
      voice = DEFAULT_VOICES[1]; // Domi
      welcomeMessage = mentionsHindi
        ? "Namaste! Main aapka AI Mock Interview Coach hoon. Kya aap practice shuru karne ke liye taiyaar hain? Pehle mujhe batayein aap kis role ke liye prepare kar rahe hain."
        : "Hello! I am your AI Interview Practice Coach. Are you ready to begin our mock interview session? Please tell me which role and industry you are preparing for.";
      systemInstructions = `You are an expert, encouraging mock interviewer and career coach.
Core Objectives:
1. Conduct realistic spoken interviews for software, product, business, or operational roles.
2. Ask ONE clear question at a time and wait for the candidate's spoken response.
3. Provide concise, constructive feedback on clarity, structure (e.g. STAR method), and technical depth before moving to the next question.
4. Keep spoken turns concise, natural, and engaging.
5. Offer helpful suggestions if the candidate gets stuck.`;
      conversationGoals = [
        "Determine the target job title and seniority level",
        "Conduct a 3 to 5 question mock interview turn by turn",
        "Offer specific actionable feedback after each answer",
        "Provide an overall performance summary and improvement tips at the end"
      ];
      faqs = [
        { id: "faq-1", question: "How does the interview practice work?", answer: "I will ask you typical technical and behavioral interview questions one at a time. After you speak your answer, I will provide constructive feedback on your content and delivery." },
        { id: "faq-2", question: "Can I choose between technical and behavioral questions?", answer: "Yes! Simply tell me whether you want behavioral questions, system design, leadership scenarios, or technical coding fundamentals." },
        { id: "faq-3", question: "What is the STAR method you recommend?", answer: "STAR stands for Situation, Task, Action, and Result. It is the best structure to provide clear, memorable behavioral answers." }
      ];
      guardrails = {
        topicsToAvoid: ["Guaranteeing real job offers", "Discriminatory or sensitive personal questions", "Unrealistic promises"],
        unknownAnswerBehavior: "Politely state that you are focusing on interview skills and suggest relevant industry documentation.",
        humanEscalation: "Recommend booking a live 1-on-1 human mentor session for formal resume reviews.",
        behavioralConstraints: "Always ask only 1 question per turn. Never speak more than 3 sentences in a single response."
      };
      break;

    case "clinic":
      if (!parsedName) parsedName = mentionsHindi ? "Aarogya Clinic Receptionist" : "Health Clinic Receptionist";
      role = "Healthcare Receptionist & Triage Assistant";
      voice = DEFAULT_VOICES[0]; // Rachel
      welcomeMessage = mentionsHindi
        ? "Namaste! Welcome to our clinic. Main aapki doctor appointment aur clinic timing me kaise sahayata kar sakta hoon?"
        : "Hello and welcome to our clinic! How can I assist you with your appointment or clinic enquiry today?";
      systemInstructions = `You are a warm, capable voice receptionist for a healthcare clinic.
Core Objectives:
1. Greet callers warmly ${mentionsHindi ? 'in a natural mix of Hindi and English according to caller comfort' : 'in clear English'}.
2. Provide clinic hours (Mon-Sat 8:00 AM - 8:00 PM, Sun 9:00 AM - 1:00 PM for emergencies).
3. Schedule, confirm, or reschedule appointments with general practitioners or specialists.
4. Inform patients about consultation fees and walk-in policies.
5. Critical Safety: Never diagnose acute medical symptoms or prescribe medicines. For emergencies, instruct caller to call local emergency services immediately.`;
      conversationGoals = [
        "Ascertain the caller's medical concern or preferred doctor",
        "Offer two suitable appointment time slots",
        "Record patient name and contact number",
        "Confirm clinic location and preparation instructions"
      ];
      faqs = [
        { id: "faq-1", question: "What are your clinic timings?", answer: "We are open Monday through Saturday from 8:00 AM to 8:00 PM, and Sundays from 9:00 AM to 1:00 PM." },
        { id: "faq-2", question: "How much is a general consultation?", answer: "General physician consultation is $50 (or ₹500), while specialist appointments start at $80 (or ₹900)." },
        { id: "faq-3", question: "Do you accept walk-ins?", answer: "Yes, walk-ins are welcomed, though appointments are recommended to avoid waiting." }
      ];
      guardrails = {
        topicsToAvoid: ["Medical diagnosis over the phone", "Prescription drugs recommendations", "Financial guarantees for surgery"],
        unknownAnswerBehavior: "Explain politely that the front-desk coordinator will verify with the on-duty doctor.",
        humanEscalation: "Provide clinic duty desk direct line for urgent medical inquiries.",
        behavioralConstraints: "Keep responses under 3 sentences for conversational voice rhythm. Never challenge a patient."
      };
      break;

    case "education":
      if (!parsedName) parsedName = "Admissions Advisory Counselor";
      role = "Student Academic Advisor & Admissions Counselor";
      voice = DEFAULT_VOICES[2]; // Bella
      welcomeMessage = mentionsHindi
        ? "Namaste! Admissions desk me aapka swagat hai. Courses aur admission process ke baare me aap kya jaanna chahte hain?"
        : "Hello! Welcome to admissions. How can I guide you with our courses, campus tours, or enrollment today?";
      systemInstructions = `You are an energetic and helpful admissions counselor.
Core Objectives:
1. Provide accurate details on academic programs, eligibility criteria, and fee structures.
2. Outline application deadlines and required entrance test scores.
3. Invite prospective students and guardians to weekend campus open days.
4. Explain scholarship options based on merit and financial assistance.`;
      conversationGoals = [
        "Identify candidate's intended field of study",
        "Detail the application timeline and prerequisites",
        "Book a campus visit or advisory callback"
      ];
      faqs = [
        { id: "faq-1", question: "When do applications close?", answer: "Early applications close on December 1st; standard admissions remain open until February 15th." },
        { id: "faq-2", question: "Are scholarships offered?", answer: "Yes, merit-based tuition waivers up to 50% are available for qualified applicants." },
        { id: "faq-3", question: "Can I schedule a campus visit?", answer: "We host campus tours every Saturday morning at 10:00 AM. I can reserve your spots right now." }
      ];
      guardrails = {
        topicsToAvoid: ["Guaranteed admission without verification", "Unofficial faculty gossip"],
        unknownAnswerBehavior: "Offer to connect the caller with the Admissions Dean via email.",
        humanEscalation: "Transfer to Senior Counselor during office hours (9 AM - 5 PM).",
        behavioralConstraints: "Be positive, inspiring, and transparent about costs."
      };
      break;

    case "customer_support":
      if (!parsedName) parsedName = "Customer Support Assistant";
      role = "Tier-1 Technical & Billing Support Specialist";
      voice = DEFAULT_VOICES[1]; // Domi
      welcomeMessage = "Hello! Thanks for reaching Support. Are you calling regarding your account, billing, or technical assistance?";
      systemInstructions = `You are a concise, solution-oriented customer support voice agent.
Core Objectives:
1. Quickly understand customer account, billing, or software usage challenges.
2. Walk users through self-service portal actions (invoices, password resets, plan upgrades).
3. Log technical error codes and generate support tickets when required.
4. Maintain a calm, empathetic demeanor even if the customer is frustrated.`;
      conversationGoals = [
        "Identify specific issue category (Billing, Login, Feature)",
        "Provide direct step-by-step resolution",
        "Confirm issue resolution before closing call"
      ];
      faqs = [
        { id: "faq-1", question: "Where do I see my latest invoice?", answer: "Invoices can be viewed and downloaded under Account Settings > Invoices in your web dashboard." },
        { id: "faq-2", question: "What is your refund timeframe?", answer: "Refund requests submitted within 14 days of billing are processed within 3-5 business days." },
        { id: "faq-3", question: "How do I reset my password?", answer: "Visit our login screen and click 'Forgot Password' to receive a secure reset link." }
      ];
      guardrails = {
        topicsToAvoid: ["Asking for raw credit card numbers or passwords", "Sharing internal engineering roadmaps"],
        unknownAnswerBehavior: "Offer to escalate to a specialized tier-2 engineer with a tracked ticket.",
        humanEscalation: "Transfer immediately if caller mentions legal action or asks for supervisor 2 times.",
        behavioralConstraints: "Never argue. Acknowledge customer sentiment first, then offer the solution."
      };
      break;

    case "ecommerce":
      if (!parsedName) parsedName = "Order & Delivery Concierge";
      role = "E-Commerce Shopping & Logistics Specialist";
      voice = DEFAULT_VOICES[4]; // Elli
      welcomeMessage = "Hi there! Welcome to support. Can I assist you with tracking an order, returns, or product recommendations?";
      systemInstructions = `You are an upbeat e-commerce customer assistant.
Core Objectives:
1. Look up shipment status and estimated delivery dates using order IDs.
2. Explain the 30-day return and exchange policy.
3. Suggest popular products and seasonal discounts.`;
      conversationGoals = [
        "Retrieve order tracking number or email",
        "Provide current package location and transit estimate",
        "Help generate return shipping label if requested"
      ];
      faqs = [
        { id: "faq-1", question: "How long does standard delivery take?", answer: "Standard shipping takes 3-5 business days. Express shipping delivers in 1-2 business days." },
        { id: "faq-2", question: "What is your return policy?", answer: "Items in original condition can be returned within 30 days for a full refund." }
      ];
      guardrails = {
        topicsToAvoid: ["Guaranteeing carrier transit times during severe weather", "Collecting full CVV numbers"],
        unknownAnswerBehavior: "Suggest checking the live tracking link or creating a ticket.",
        humanEscalation: "Route to logistics desk if package is marked lost.",
        behavioralConstraints: "Maintain a helpful, upbeat tone."
      };
      break;

    case "hospitality":
      if (!parsedName) parsedName = "Hospitality & Reservation Host";
      role = "Guest Concierge & Reservation Specialist";
      voice = DEFAULT_VOICES[3]; // Antoni
      welcomeMessage = "Good day! Welcome to our reservation desk. Would you like to reserve a table, view our menu highlights, or check opening hours?";
      systemInstructions = `You are a refined, polite restaurant and hospitality concierge.
Core Objectives:
1. Manage guest reservations (party size, date, time slot, indoor/outdoor preferences).
2. Answer dietary, allergen, and menu questions accurately.
3. Explain cancellation policies and private dining options.`;
      conversationGoals = [
        "Confirm party size, requested date, and time",
        "Note any dietary restrictions or special occasions",
        "Record guest name and contact number for booking confirmation"
      ];
      faqs = [
        { id: "faq-1", question: "What are your dining hours?", answer: "We serve lunch from 12:00 PM to 3:30 PM and dinner from 6:30 PM to 11:00 PM daily." },
        { id: "faq-2", question: "Do you have vegetarian and gluten-free options?", answer: "Yes, our executive chef prepares comprehensive vegetarian, vegan, and gluten-free menus." }
      ];
      guardrails = {
        topicsToAvoid: ["Overbooking without capacity checks", "Disclosing VIP guest reservations"],
        unknownAnswerBehavior: "Offer to check with the maître d'hôtel.",
        humanEscalation: "Transfer to manager desk for private events over 12 guests.",
        behavioralConstraints: "Speak courteously and warmly with elegant pacing."
      };
      break;

    default: {
      // Dynamic intelligent general agent tailored directly to user prompt
      const words = prompt.trim().split(/\s+/).slice(0, 4).join(" ");
      const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
      if (!parsedName) parsedName = `${capitalized} Voice Agent`;

      role = "Domain-Specific Voice Assistant";
      voice = DEFAULT_VOICES[3]; // Antoni
      welcomeMessage = mentionsHindi
        ? `Namaste! Main aapka AI assistant hoon. Main ${prompt.slice(0, 60)} ke baare me aapki kya sahayata kar sakta hoon?`
        : `Hello! I am your AI assistant specialized for ${prompt.slice(0, 60)}. How can I assist you today?`;
      systemInstructions = `You are a knowledgeable and attentive voice AI assistant.
Core Context: "${prompt}"
Guidelines:
1. Focus directly on the user's domain and inquiries.
2. Deliver helpful, concise spoken answers in 2 to 3 sentences per turn.
3. Keep the conversation engaging, asking one question at a time when gathering information.`;
      conversationGoals = [
        "Understand the caller's objective within this domain",
        "Provide actionable, reliable guidance",
        "Confirm user satisfaction before concluding"
      ];
      faqs = [
        { id: "faq-1", question: "What services do you provide?", answer: `I am specialized to assist with: ${prompt}. Feel free to ask any related questions!` },
        { id: "faq-2", question: "How can I get more information?", answer: "You can ask me directly or request to connect with our team for detailed support." }
      ];
      guardrails = {
        topicsToAvoid: ["Sharing private confidential data", "Speculative claims outside domain"],
        unknownAnswerBehavior: "Politely acknowledge what you know and suggest consulting official documentation.",
        humanEscalation: "Offer to transfer to a specialist or provide support contact details.",
        behavioralConstraints: "Never speak more than 3 sentences in a single response turn."
      };
      break;
    }
  }

  return {
    name: parsedName,
    role,
    purpose,
    primaryLanguage,
    supportedLanguages,
    tone,
    welcomeMessage,
    systemInstructions,
    conversationGoals,
    faqs,
    guardrails,
    voice: {
      id: voice.id,
      name: voice.name,
      tone: voice.tone,
      provider: "elevenlabs"
    },
    status: "Ready to Test",
    isRemoteDeployed: false
  };
}

/**
 * Natural-Language Refinement Engine
 * Applies incremental updates to an existing agent configuration based on natural language instructions.
 * e.g. "Make the greeting shorter and warmer", "Respond in Hindi when user speaks Hindi",
 * "Ask one question at a time", "Recommend human assistance when uncertain"
 */
export function refineAgentConfig(currentAgent, instruction) {
  const instr = (instruction || "").toLowerCase();
  const refined = JSON.parse(JSON.stringify(currentAgent));
  const changes = [];

  // 1. Shorter & warmer greeting
  if (instr.includes("shorter") || instr.includes("greeting") || instr.includes("warmer")) {
    const originalGreeting = refined.welcomeMessage;
    if (refined.primaryLanguage.includes("Hindi") || refined.supportedLanguages.includes("Hindi")) {
      refined.welcomeMessage = "Namaste! Welcome! How can I help you today?";
    } else {
      refined.welcomeMessage = "Hi there! Welcome. How can I help you today?";
    }
    refined.tone = "Warm, concise, and welcoming";
    changes.push({
      field: "welcomeMessage",
      from: originalGreeting,
      to: refined.welcomeMessage,
      reason: "Shortened greeting and applied warm, conversational tone"
    });
  }

  // 2. Simpler language
  if (instr.includes("simpler") || instr.includes("simple language") || instr.includes("plain")) {
    refined.systemInstructions += `\nConstraint: Always use simple, clear language without technical jargon. Keep sentences short and accessible.`;
    refined.guardrails.behavioralConstraints += ` Use 6th-grade reading level. Avoid jargon.`;
    changes.push({
      field: "systemInstructions",
      reason: "Added plain-language constraint to system instructions"
    });
  }

  // 3. Respond in Hindi when caller speaks Hindi
  if (instr.includes("hindi") || instr.includes("bilingual")) {
    if (!refined.supportedLanguages.includes("Hindi")) {
      refined.supportedLanguages.push("Hindi");
    }
    refined.primaryLanguage = "Hindi / English";
    refined.systemInstructions += `\nLanguage Instruction: Seamlessly detect the language used by the caller. If the caller speaks Hindi, immediately respond in fluent, polite Hindi. If the caller speaks English, respond in English.`;
    changes.push({
      field: "supportedLanguages",
      to: refined.supportedLanguages.join(", "),
      reason: "Configured bilingual Hindi & English language switching"
    });
  }

  // 4. Ask one question at a time
  if (instr.includes("one question") || instr.includes("at a time") || instr.includes("pacing")) {
    refined.systemInstructions += `\nPacing Rule: Ask only ONE question per turn. Wait for the user's answer before asking the next question.`;
    refined.guardrails.behavioralConstraints += ` Strictly ask 1 question per turn.`;
    changes.push({
      field: "systemInstructions",
      reason: "Enforced single-question turn pacing"
    });
  }

  // 5. Recommend human assistance when uncertain
  if (instr.includes("human") || instr.includes("uncertain") || instr.includes("escalat")) {
    refined.guardrails.unknownAnswerBehavior = "Immediately say: 'I want to make sure you get the most accurate answer. Let me connect you with our human team member.'";
    refined.guardrails.humanEscalation = "Provide direct support desk number and trigger transfer flow whenever uncertainty arises or user requests human.";
    refined.systemInstructions += `\nEscalation Rule: If you do not have verified knowledge about an inquiry, do not guess. Immediately recommend connecting with a human staff member.`;
    changes.push({
      field: "guardrails.unknownAnswerBehavior",
      reason: "Configured proactive human handoff on uncertainty"
    });
  }

  // If no specific match was made, append the instruction as custom behavioral guidance
  if (changes.length === 0) {
    refined.systemInstructions += `\nUser Refinement: ${instruction}`;
    changes.push({
      field: "systemInstructions",
      reason: `Applied custom guidance: "${instruction}"`
    });
  }

  refined.updatedAt = new Date().toISOString();

  return {
    refinedAgent: refined,
    changes,
    statusNote: "Local Draft — Remote Agent Unchanged"
  };
}
