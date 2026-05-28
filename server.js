const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. The Oracle needs to rest. Try again in 15 minutes.' }
});
const oracleLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 15,
  message: { error: 'Slow down. The Oracle speaks in its own time.' }
});

app.use('/api/', apiLimiter);
app.use('/api/oracle', oracleLimiter);

// ─── Gemini Setup ─────────────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is missing from .env — API calls will fail');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig = {
  temperature: 0.8,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
};

const chatConfig = {
  temperature: 0.9,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
};

// Model with fallback
function getModel(modelName = 'gemini-2.5-flash', useChat = false) {
  const cfg = useChat ? chatConfig : generationConfig;
  return genAI.getGenerativeModel({ model: modelName, safetySettings, generationConfig: cfg });
}

async function generateWithFallback(prompt) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  let lastError;
  for (const modelName of models) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error('Empty response from model');
      console.log(`✅  Used model: ${modelName}`);
      return text;
    } catch (err) {
      console.warn(`⚠️  Model ${modelName} failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

// ─── Utils ───────────────────────────────────────────────────────────────────
const cleanJsonResponse = (text) => {
  let cleaned = text.trim();

  // If the model wrapped the whole JSON in quotes (double-encoded), unwrap it
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    try {
      cleaned = JSON.parse(cleaned); // unwrap the outer string
    } catch (e) { /* ignore */ }
  }

  // Strip markdown fences
  cleaned = cleaned
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // Extract just the JSON object (find first { to last })
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    model: 'gemini-2.5-flash',
    timestamp: new Date().toISOString()
  });
});

/**
 * Main recommendation endpoint
 */
app.post('/api/recommend', async (req, res) => {
  const { answers } = req.body;

  if (!answers || Object.keys(answers).length < 7) {
    return res.status(400).json({ error: 'All 7 assessment answers are required.' });
  }

  const prompt = `
You are VentureCompass — a brutally honest, India-savvy startup strategist. 
Analyze this founder's profile and return ONLY valid JSON.
CRITICAL: Return raw JSON only. No markdown. No code fences. No backticks. No explanation before or after.
CRITICAL: In JSON string values, use \\n to represent line breaks (not actual newlines).

FOUNDER PROFILE:
- Available Capital: ${answers.budget}
- Revenue Urgency: ${answers.revenue}
- Technical Skill: ${answers.tech}
- Risk Tolerance: ${answers.risk}
- Product Type: ${answers.product}
- Geographic Ambition: ${answers.scale}
- Brand Priority: ${answers.brand}

The 8 Indian e-commerce business models are:
Subscription Commerce, Affiliate Marketing, Direct-to-Consumer (D2C), Marketplace, Dropshipping, SaaS (E-com Tools), White Label, Freemium.

Return this EXACT JSON structure with no deviation:
{
  "primary": {
    "model": "exact model name from the list above",
    "matchScore": 88,
    "tagline": "one punchy sentence about why this model fits this specific founder",
    "rationale": "Write 3 substantial paragraphs separated by double newlines. Reference real Indian market data, current trends (2024-25), and specific conditions like UPI adoption, Tier-2/3 city growth, ONDC, quick commerce etc. Be brutally specific to this founder's exact combination of constraints — not generic advice.",
    "immediateActions": ["Concrete action they can take this week", "Second action with specific tool/platform name", "Third action with clear measurable outcome"],
    "redFlags": ["One risk highly specific to their profile and chosen model in India", "Second risk they likely haven't considered"],
    "indianExamples": ["Real Indian company using this model", "Second company", "Third company"],
    "estimatedTimeline": "e.g. 4-6 months to first ₹1L revenue",
    "capitalRequired": "e.g. ₹50K–₹2L for MVP"
  },
  "alternatives": [
    {
      "model": "second best model from the list",
      "matchScore": 74,
      "why": "Two sentences: why it's the second best for this profile and what specific trigger would make them pivot to it."
    },
    {
      "model": "third best model from the list",
      "matchScore": 62,
      "why": "Two sentences: the unique angle this model offers and when it makes sense over the primary."
    }
  ],
  "summary": "One ruthlessly honest sentence capturing this founder's strategic north star.",
  "warningSign": "The single most common and fatal mistake founders with exactly this profile make in the Indian market."
}
`;

  try {
    const responseText = await generateWithFallback(prompt);
    const cleanedText = cleanJsonResponse(responseText);

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseErr) {
      // Model included literal newlines inside JSON string values — escape them
      const oneLiner = cleanedText
        .replace(/\r\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\n/g, '\\n');
      parsed = JSON.parse(oneLiner);
    }

    if (!parsed.primary || !parsed.primary.model || !parsed.alternatives) {
      throw new Error('Invalid response structure from AI');
    }

    // Restore newlines in rationale for paragraph splitting on frontend
    if (parsed.primary.rationale) {
      parsed.primary.rationale = parsed.primary.rationale.replace(/\\n/g, '\n');
    }

    res.json(parsed);
  } catch (err) {
    console.error('❌ /api/recommend error:', err.message);

    // Classify error for frontend
    const isApiKeyError = err.message?.includes('API_KEY') || err.message?.includes('400') || err.message?.includes('401');
    const isQuotaError = err.message?.includes('429') || err.message?.includes('quota');

    res.status(500).json({
      error: isApiKeyError
        ? 'API key is invalid or not authorized. Please set a valid GEMINI_API_KEY in .env'
        : isQuotaError
          ? 'Gemini API quota exceeded. Please wait a moment and try again.'
          : 'The Oracle failed to respond. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined,
      fallback: getFallbackRecommendation(answers)
    });
  }
});

/**
 * Oracle chat endpoint — with streaming support
 */
app.post('/api/oracle', async (req, res) => {
  const { message, context, history } = req.body;

  if (!message || message.trim().length < 2) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long. Keep it under 500 characters.' });
  }

  const systemContext = `You are the VentureCompass Oracle — a sharp, no-nonsense Indian startup advisor.
The founder has been recommended: ${context?.model || 'a business model'}.
Their profile: Capital=${context?.userProfile?.budget || 'unknown'}, Revenue Urgency=${context?.userProfile?.revenue || 'unknown'}, Tech=${context?.userProfile?.tech || 'unknown'}, Risk=${context?.userProfile?.risk || 'unknown'}, Product=${context?.userProfile?.product || 'unknown'}, Scale=${context?.userProfile?.scale || 'unknown'}, Brand=${context?.userProfile?.brand || 'unknown'}.

Rules:
- Be direct, specific, actionable. No fluff.
- Reference real Indian companies, platforms (Meesho, Razorpay, Shiprocket, Dukaan, ONDC, etc.)
- Use ₹ for currency. Reference Indian regulations if relevant.
- Format with bullet points (use • not -) for lists where appropriate.
- Keep responses under 300 words unless the question demands more.
- Never say "As an AI..." or hedge excessively. You are the Oracle. You speak truth.`;

  // Build conversation history for multi-turn
  const chatHistory = (history || []).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  try {
    const model = getModel('gemini-2.5-flash', true);
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemContext,
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    if (!reply) throw new Error('Empty response from Oracle');

    res.json({ reply, model: 'gemini-2.5-flash' });
  } catch (err) {
    console.error('❌ /api/oracle error:', err.message);
    res.status(500).json({
      error: 'The Oracle is temporarily silent.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * Deep dive insights endpoint
 */
app.post('/api/insights', async (req, res) => {
  const { modelKey } = req.body;

  if (!modelKey || typeof modelKey !== 'string') {
    return res.status(400).json({ error: 'Model key is required.' });
  }

  const prompt = `
You are a precise Indian e-commerce market analyst. Return ONLY valid JSON for the "${modelKey}" business model in India (2024-25 data). No markdown, no backticks.

{
  "marketSize": "Specific market size with source reference (e.g. '$X Billion by 202X, IBEF/Statista')",
  "indianOpportunity": "2 sentences on why NOW is the right time for this model in India. Reference specific trends like UPI, ONDC, Tier-2 growth, etc.",
  "challengesIndia": ["Challenge specific to Indian market context", "Challenge 2", "Challenge 3"],
  "topFounderMistakes": ["Specific mistake Indian founders make with this model", "Mistake 2", "Mistake 3"],
  "resources": ["Specific Indian platform/tool (e.g. 'Razorpay for payments')", "Resource 2 with brief note", "Resource 3 with brief note"],
  "keyMetrics": ["Key metric to track for this model (e.g. 'CAC below ₹300')", "Metric 2", "Metric 3"],
  "regulatoryNote": "One sentence on any relevant Indian regulations or compliance requirements for this model."
}
`;

  try {
    const responseText = await generateWithFallback(prompt);
    const parsed = JSON.parse(cleanJsonResponse(responseText));
    res.json(parsed);
  } catch (err) {
    console.error('❌ /api/insights error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch insights. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * Export/share result as JSON snapshot
 */
app.post('/api/snapshot', (req, res) => {
  const { result, answers, timestamp } = req.body;
  if (!result || !answers) {
    return res.status(400).json({ error: 'Result and answers are required.' });
  }

  const snapshot = {
    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
    timestamp: timestamp || new Date().toISOString(),
    recommendation: result,
    profile: answers,
    generatedBy: 'VentureCompass v2.0 · Gemini 2.0 Flash'
  };

  res.json(snapshot);
});

// ─── Fallback Data ────────────────────────────────────────────────────────────
function getFallbackRecommendation(answers) {
  return {
    primary: {
      model: 'Direct-to-Consumer (D2C)',
      matchScore: 82,
      tagline: 'Own your customer, own your margin — the Indian brand playbook.',
      rationale: 'D2C is the dominant growth model in India right now, with brands like Mamaearth, BoAt, and Sugar Cosmetics proving that category disruption is possible even against entrenched incumbents. The UPI infrastructure and social commerce explosion via Instagram and WhatsApp have dramatically lowered the customer acquisition cost floor.\n\nFor your profile, D2C aligns well because it gives you control over brand narrative, pricing, and customer data from day one. The margin structure — typically 45-70% gross — allows reinvestment into growth without burning through capital at the rate that marketplace models demand.\n\nThe Indian market in 2025 rewards niche focus. Attempting to be everything to everyone burns runway fast. Pick one customer cohort, solve one specific pain point better than anyone else, and own that before expanding.',
      immediateActions: [
        'Validate your niche with 50 WhatsApp conversations before building anything',
        'Launch a Shopify store with Razorpay in under 48 hours — test one hero product',
        'Set up a Meta Business account and run ₹500/day test ads targeting your core demographic'
      ],
      redFlags: [
        'Underestimating CAC: Most D2C founders budget ₹200-400 per customer but end up paying ₹800-1200+',
        'Inventory risk: Ordering bulk without demand validation can kill cash flow in month 3'
      ],
      indianExamples: ['Mamaearth', 'BoAt', 'Sugar Cosmetics'],
      estimatedTimeline: '3-6 months to first ₹1L revenue',
      capitalRequired: '₹1.5L–₹5L for proper launch'
    },
    alternatives: [
      { model: 'Dropshipping', matchScore: 68, why: 'Zero inventory risk makes this ideal for testing product-market fit before D2C commitment. Pivot to this if you want to validate demand before manufacturing your own product line.' },
      { model: 'White Label', matchScore: 58, why: 'Fastest path to an owned brand without R&D costs. Consider this if you find a strong manufacturer partner with excess capacity.' }
    ],
    summary: 'Build a brand that customers seek out — not one they stumble upon.',
    warningSign: 'Spending on ads before achieving product-market fit. Validate organically first via communities and WhatsApp groups.'
  };
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`\n◈ VentureCompass v2.0`);
  console.log(`◈ Backend active on http://localhost:${port}`);
  console.log(`◈ Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Key loaded' : '❌ MISSING KEY'}`);
  console.log(`◈ Model: gemini-2.5-flash → 2.0-flash → 2.0-flash-lite (fallback chain)\n`);
});
