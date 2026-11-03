export {}

// ─────────────────────────────────────────────────────────────────────────────
// PitchCraft AI – Background Service Worker
// All AI calls go through our secure backend. The Gemini API key NEVER lives
// in the extension. The extension only knows the backend URL + a shared secret.
// ─────────────────────────────────────────────────────────────────────────────

// Replace this with your deployed Vercel URL after deployment
// During local development use: "http://localhost:3001"
const BACKEND_URL = "http://127.0.0.1:3001"

// This secret is shared between your extension and your backend.
// It prevents strangers from abusing your server endpoint.
// Must match EXTENSION_SECRET in your backend .env file.
const EXTENSION_SECRET = "pitchcraft_gizli_anahtar_2024_xK9mP"

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GENERATE_PROPOSAL") {
    handleGenerateProposal(request.payload)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }))
    return true // Keep the message channel open for async response
  }

  if (request.action === "SYNC_USER") {
    handleSyncUser(request.userId)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }))
    return true
  }
})

// ─── Get current anonymous user ID (stored locally) ──────────────────────────
async function getOrCreateUserId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["pitchcraft_user_id"], (res) => {
      if (res.pitchcraft_user_id) {
        resolve(res.pitchcraft_user_id)
      } else {
        // Generate a persistent anonymous ID for this browser/user
        const newId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        chrome.storage.local.set({ pitchcraft_user_id: newId })
        resolve(newId)
      }
    })
  })
}

// ─── Generate Proposal via our secure backend ─────────────────────────────────
async function handleGenerateProposal(payload: {
  jobDescription: string
  profile: object
  tone: string
  length: string
}): Promise<{ proposal?: string; usage?: object; error?: string }> {
  const userId = await getOrCreateUserId()

  try {
    const response = await fetch(`${BACKEND_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pitchcraft-secret": EXTENSION_SECRET
      },
      body: JSON.stringify({
        userId,
        jobDescription: payload.jobDescription,
        profile: payload.profile,
        tone: payload.tone,
        length: payload.length
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // 402 = free limit reached
      if (response.status === 402) {
        return {
          error: "free_limit_reached",
          ...data
        }
      }
      return { error: data.error || "Server error. Please try again." }
    }

    // Cache the latest usage in local storage so the popup shows live credits
    if (data.usage) {
      chrome.storage.local.set({ pitchcraft_usage: data.usage })
    }

    return { proposal: data.proposal, usage: data.usage }
  } catch (err) {
    console.error("[PitchCraft] Backend call failed:", err)
    return { error: "Could not reach the server. Check your internet connection." }
  }
}

// ─── Sync user plan/usage from backend on extension load ─────────────────────
async function handleSyncUser(userIdOverride?: string): Promise<object> {
  const userId = userIdOverride || (await getOrCreateUserId())

  try {
    const response = await fetch(`${BACKEND_URL}/api/user/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pitchcraft-secret": EXTENSION_SECRET
      },
      body: JSON.stringify({ userId })
    })

    const data = await response.json()
    if (response.ok) {
      chrome.storage.local.set({ pitchcraft_usage: data })
    }
    return data
  } catch (err) {
    console.error("[PitchCraft] Sync failed:", err)
    return {}
  }
}
