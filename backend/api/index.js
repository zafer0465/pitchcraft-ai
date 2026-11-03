const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Supabase client (optional - used when configured) ───────────────────────
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log("✅ Supabase connected.");
} else {
  console.log("⚠️  Supabase not configured. Using in-memory usage tracking (dev mode).");
}

// In-memory fallback store when Supabase is not configured
const memoryUsageStore = new Map();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());

// CORS: only allow requests from Chrome extensions and localhost (dev)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        /^chrome-extension:\/\/.+$/,
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
      ];
      if (!origin || allowed.some((r) => r.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Global rate limiter: max 60 requests per IP per minute
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, please slow down." },
});
app.use(globalLimiter);

// ─── Middleware: Validate extension secret ─────────────────────────────────────
function requireExtensionSecret(req, res, next) {
  const secret = req.headers["x-pitchcraft-secret"];
  if (!secret || secret !== process.env.EXTENSION_SECRET) {
    return res.status(401).json({ error: "Unauthorized: Invalid extension secret." });
  }
  next();
}

// ─── Helper: Get or create user usage record ──────────────────────────────────
async function getUserUsage(userId) {
  if (!supabase) {
    // In-memory fallback
    if (!memoryUsageStore.has(userId)) {
      memoryUsageStore.set(userId, { user_id: userId, monthly_count: 0, is_pro: false, last_reset_at: new Date().toISOString() });
    }
    return memoryUsageStore.get(userId);
  }

  const { data, error } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    const { data: newRow } = await supabase
      .from("user_usage")
      .insert({ user_id: userId, monthly_count: 0, is_pro: false })
      .select()
      .single();
    return newRow;
  }

  return data;
}

// ─── Helper: Reset monthly count if it's a new calendar month ────────────────
async function maybeResetMonthlyCount(userId, usage) {
  const lastReset = new Date(usage.last_reset_at || 0);
  const now = new Date();

  if (
    lastReset.getMonth() !== now.getMonth() ||
    lastReset.getFullYear() !== now.getFullYear()
  ) {
    const updated = { ...usage, monthly_count: 0, last_reset_at: now.toISOString() };
    if (supabase) {
      await supabase
        .from("user_usage")
        .update({ monthly_count: 0, last_reset_at: now.toISOString() })
        .eq("user_id", userId);
    } else {
      memoryUsageStore.set(userId, updated);
    }
    return updated;
  }

  return usage;
}

// ─── Helper: Call Gemini 3.5 Flash ────────────────────────────────────────────
async function callGemini(systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `Here is the Upwork job posting. Write a winning, complete proposal for it:\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini API error");
  }

  // Find candidate part that is not internal thought
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((p) => !p.thought && p.text) || parts[0];
  return textPart?.text?.trim() || null;
}

// ─── Helper: Build the proposal system prompt ─────────────────────────────────
function buildSystemPrompt(profile, tone, length) {
  const wordTargets = { short: 80, medium: 150, detailed: 250 };
  const wordCount = wordTargets[length] || 150;

  const toneGuide = {
    confident: "Confident, direct and results-focused. No fluff.",
    friendly: "Warm, collaborative and approachable. Show genuine interest.",
    technical: "Technical expert. Use precise terminology and highlight methodology.",
  };

  return `You are a top-rated Upwork freelancer with a 98% job success score.
Write a personalized, high-converting Upwork proposal for the job description provided.

STRICT RULES:
1. NEVER use cliché openers like "I hope this finds you well", "I am thrilled" or "Dear Hiring Manager".
2. Open with a sharp, specific insight about the client's EXACT problem.
3. Target word count: ~${wordCount} words. Be concise — clients skim proposals.
4. Naturally weave in the freelancer's details:
   - Name: ${profile.fullName || "the freelancer"}
   - Role: ${profile.jobTitle || "Software Developer"}
   - Top skills: ${profile.keySkills || "modern technologies"}
   ${profile.portfolioUrl ? `- Portfolio: ${profile.portfolioUrl}` : ""}
5. Tone: ${toneGuide[tone] || toneGuide.confident}
6. End with ONE specific, open-ended question that invites an immediate reply.
7. Write in plain text. No markdown. No bullet points unless the job itself uses them.`;
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "PitchCraft AI Backend", version: "1.0.0" });
});

// ── POST /api/generate ────────────────────────────────────────────────────────
// Main proposal generation endpoint
app.post("/api/generate", requireExtensionSecret, async (req, res) => {
  try {
    const { userId, jobDescription, profile, tone, length } = req.body;
    console.log(`[POST /api/generate] Request received from user: ${userId}`);

    // Validate required fields
    if (!userId || !jobDescription) {
      console.log("[POST /api/generate] Validation error: missing userId or jobDescription");
      return res.status(400).json({ error: "userId and jobDescription are required." });
    }

    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      console.log("[POST /api/generate] Validation error: job description too short");
      return res.status(400).json({ error: "Job description is too short. Please paste the full job post." });
    }

    // ── Check usage & subscription ──────────────────────────────────────────
    let usage = await getUserUsage(userId);
    usage = await maybeResetMonthlyCount(userId, usage);

    const FREE_LIMIT = parseInt(process.env.FREE_MONTHLY_LIMIT || "10");

    if (!usage.is_pro && usage.monthly_count >= FREE_LIMIT) {
      console.log(`[POST /api/generate] User ${userId} reached free limit`);
      return res.status(402).json({
        error: "free_limit_reached",
        message: `You've used your ${FREE_LIMIT} free proposals this month. Upgrade to Pro for unlimited generation.`,
        upgradeUrl: "https://pitchcraft.lemonsqueezy.com/checkout",
      });
    }

    // ── Build prompt and call Gemini ────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(
      profile || {},
      tone || "confident",
      length || "medium"
    );

    const userPrompt = `Client's Job Description:\n\n${jobDescription}`;
    console.log("[POST /api/generate] Calling Gemini API...");

    const proposal = await callGemini(systemPrompt, userPrompt);
    console.log("[POST /api/generate] Proposal successfully generated by Gemini!");

    if (!proposal) {
      return res.status(500).json({ error: "AI returned an empty response. Please try again." });
    }

    // ── Increment usage count ───────────────────────────────────────────────
    const newCount = (usage.monthly_count || 0) + 1;
    if (supabase) {
      await supabase
        .from("user_usage")
        .update({ monthly_count: newCount })
        .eq("user_id", userId);
    } else {
      memoryUsageStore.set(userId, { ...usage, monthly_count: newCount });
    }

    // ── Return proposal ─────────────────────────────────────────────────────
    return res.json({
      proposal,
      usage: {
        used: (usage.monthly_count || 0) + 1,
        limit: usage.is_pro ? null : FREE_LIMIT,
        isPro: usage.is_pro,
      },
    });
  } catch (err) {
    console.error("[/api/generate] Error:", err.message);
    return res.status(500).json({ error: "Internal server error. Please try again." });
  }
});

// ── POST /api/user/sync ───────────────────────────────────────────────────────
// Called on extension load to get user's current plan & usage
app.post("/api/user/sync", requireExtensionSecret, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    let usage = await getUserUsage(userId);
    usage = await maybeResetMonthlyCount(userId, usage);

    const FREE_LIMIT = parseInt(process.env.FREE_MONTHLY_LIMIT || "10");

    return res.json({
      isPro: usage.is_pro,
      used: usage.monthly_count,
      limit: usage.is_pro ? null : FREE_LIMIT,
      remaining: usage.is_pro ? null : Math.max(0, FREE_LIMIT - usage.monthly_count),
    });
  } catch (err) {
    console.error("[/api/user/sync] Error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ PitchCraft AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health check → http://localhost:${PORT}/health\n`);
});

module.exports = app;

