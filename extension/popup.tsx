import React, { useState, useEffect } from "react"

interface UserProfile {
  fullName: string
  jobTitle: string
  keySkills: string
  portfolioUrl: string
  tone: string
}

interface UsageInfo {
  isPro: boolean
  used: number
  limit: number | null
  remaining: number | null
}

export default function IndexPopup() {
  const [activeTab, setActiveTab] = useState<"generator" | "profile" | "pro">("generator")
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    jobTitle: "",
    keySkills: "",
    portfolioUrl: "",
    tone: "confident"
  })
  const [usage, setUsage] = useState<UsageInfo>({ isPro: false, used: 0, limit: 10, remaining: 10 })
  const [jobDescription, setJobDescription] = useState("")
  const [proposalLength, setProposalLength] = useState<"short" | "medium" | "detailed">("medium")
  const [generatedProposal, setGeneratedProposal] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      // Load profile
      chrome.storage.local.get(["pitchcraft_profile", "pitchcraft_usage"], (res) => {
        if (res.pitchcraft_profile) setProfile(res.pitchcraft_profile)
        if (res.pitchcraft_usage) setUsage(res.pitchcraft_usage)
      })

      // Sync latest usage from backend
      chrome.runtime.sendMessage({ action: "SYNC_USER" }, (res) => {
        if (res && !res.error) setUsage(res)
      })
    }
  }, [])

  const saveProfile = () => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ pitchcraft_profile: profile }, () => {
        alert("Profile saved!")
      })
    }
  }

  const grabFromCurrentTab = async () => {
    if (typeof chrome === "undefined" || !chrome.tabs) return
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "GET_JOB_DESCRIPTION" }, (response) => {
        if (response?.text) {
          setJobDescription(response.text)
          setErrorMsg("")
        } else {
          setErrorMsg("Could not auto-detect. Open an Upwork job post first, or paste manually.")
        }
      })
    }
  }

  const handleGenerate = async () => {
    setErrorMsg("")
    if (!jobDescription.trim()) {
      setErrorMsg("Please paste the job description or click Auto-Detect.")
      return
    }

    if (!usage.isPro && (usage.remaining ?? 0) <= 0) {
      setActiveTab("pro")
      return
    }

    setIsLoading(true)
    setGeneratedProposal("")

    chrome.runtime.sendMessage(
      {
        action: "GENERATE_PROPOSAL",
        payload: { jobDescription, profile, tone: profile.tone, length: proposalLength }
      },
      (response) => {
        setIsLoading(false)
        if (response?.proposal) {
          setGeneratedProposal(response.proposal)
          if (response.usage) setUsage(response.usage)
        } else if (response?.error === "free_limit_reached") {
          setActiveTab("pro")
        } else {
          setErrorMsg(response?.error || "Something went wrong. Please try again.")
        }
      }
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedProposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const creditsLabel = usage.isPro
    ? "Pro — Unlimited ✨"
    : `${usage.remaining ?? 0} / ${usage.limit} Free Left`

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logoIcon}>⚡</span>
          <h2 style={styles.title}>PitchCraft AI</h2>
        </div>
        <div style={{
          ...styles.creditBadge,
          backgroundColor: usage.isPro ? "#dcfce7" : (usage.remaining ?? 0) <= 2 ? "#fef2f2" : "#e0f2fe",
          color: usage.isPro ? "#16a34a" : (usage.remaining ?? 0) <= 2 ? "#dc2626" : "#0369a1"
        }}>
          {creditsLabel}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {(["generator", "profile", "pro"] as const).map((tab) => (
          <button
            key={tab}
            style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab(tab)}>
            {tab === "generator" ? "Proposal" : tab === "profile" ? "My Profile" : "Upgrade ⭐"}
          </button>
        ))}
      </div>

      {/* ── Tab: Generator ─────────────────────────────────────────────────── */}
      {activeTab === "generator" && (
        <div style={styles.content}>
          <div style={styles.rowBetween}>
            <label style={styles.label}>Job Description</label>
            <button style={styles.smallActionBtn} onClick={grabFromCurrentTab}>
              ⚡ Auto-Detect from Page
            </button>
          </div>
          <textarea
            style={styles.textarea}
            rows={4}
            placeholder="Paste the Upwork job post here, or click Auto-Detect when you're on an Upwork job page..."
            value={jobDescription}
            onChange={(e) => { setJobDescription(e.target.value); setErrorMsg("") }}
          />

          {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}

          <div style={styles.rowBetween}>
            <label style={styles.label}>Proposal Length</label>
            <div style={{ display: "flex", gap: 4 }}>
              {(["short", "medium", "detailed"] as const).map((len) => (
                <button
                  key={len}
                  style={{ ...styles.chipBtn, ...(proposalLength === len ? styles.chipBtnActive : {}) }}
                  onClick={() => setProposalLength(len)}>
                  {len.charAt(0).toUpperCase() + len.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            style={{ ...styles.primaryBtn, ...(isLoading ? styles.btnDisabled : {}) }}
            onClick={handleGenerate}
            disabled={isLoading}>
            {isLoading ? "✦ Crafting your pitch..." : "Generate Winning Proposal ✨"}
          </button>

          {generatedProposal && (
            <div style={styles.resultContainer}>
              <div style={styles.rowBetween}>
                <span style={styles.subHeading}>Your Personalized Pitch 🎯</span>
                <button style={styles.copyBtn} onClick={handleCopy}>
                  {copied ? "Copied! ✓" : "Copy"}
                </button>
              </div>
              <textarea
                style={{ ...styles.textarea, minHeight: 150, backgroundColor: "#f8fafc" }}
                value={generatedProposal}
                onChange={(e) => setGeneratedProposal(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Profile ───────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div style={styles.content}>
          {[
            { label: "Your Name", key: "fullName", placeholder: "e.g. Alex Miller" },
            { label: "Professional Title", key: "jobTitle", placeholder: "e.g. Full-Stack Engineer (React, Node.js)" },
            { label: "Top Skills (comma-separated)", key: "keySkills", placeholder: "e.g. React, Python, PostgreSQL, REST APIs" },
            { label: "Portfolio / GitHub Link", key: "portfolioUrl", placeholder: "e.g. https://github.com/yourprofile" },
          ].map(({ label, key, placeholder }) => (
            <React.Fragment key={key}>
              <label style={styles.label}>{label}</label>
              <input
                style={styles.input}
                placeholder={placeholder}
                value={(profile as any)[key]}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
              />
            </React.Fragment>
          ))}

          <label style={styles.label}>Proposal Tone</label>
          <select
            style={styles.input}
            value={profile.tone}
            onChange={(e) => setProfile({ ...profile, tone: e.target.value })}>
            <option value="confident">Confident & Direct (Best conversion rate)</option>
            <option value="friendly">Friendly & Collaborative</option>
            <option value="technical">Technical Expert</option>
          </select>

          <button style={styles.primaryBtn} onClick={saveProfile}>
            Save Profile
          </button>
        </div>
      )}

      {/* ── Tab: Pro ───────────────────────────────────────────────────────── */}
      {activeTab === "pro" && (
        <div style={{ ...styles.content, textAlign: "center" }}>
          {!usage.isPro && (usage.remaining ?? 0) <= 0 && (
            <div style={styles.warningBanner}>
              You've used all your free proposals this month. Upgrade to keep winning jobs!
            </div>
          )}
          <div style={styles.proCard}>
            <span style={{ fontSize: 36 }}>🚀</span>
            <h3 style={{ margin: "8px 0 4px", fontSize: 18 }}>PitchCraft Pro</h3>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px" }}>
              Remove limits. Win more clients. Pay for itself with one job.
            </p>
            <div style={styles.priceTag}>
              <span style={{ fontSize: 32, fontWeight: "bold" }}>$9</span>
              <span style={{ color: "#64748b", fontSize: 14 }}>/month</span>
            </div>
            <ul style={styles.proBenefits}>
              <li>✓ Unlimited proposal generations</li>
              <li>✓ Advanced AI — human-like, high-converting</li>
              <li>✓ One-click Upwork form autofill</li>
              <li>✓ Priority new features & updates</li>
            </ul>
            <a
              href="https://pitchcraft.lemonsqueezy.com/checkout"
              target="_blank"
              rel="noreferrer"
              style={styles.upgradeBtn}>
              Get Pro — $9/month 💳
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 400,
    minHeight: 520,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc"
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 20 },
  title: { margin: 0, fontSize: 16, fontWeight: 700 },
  creditBadge: {
    fontSize: 11, fontWeight: 700,
    padding: "4px 10px", borderRadius: 999
  },
  tabBar: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f1f5f9"
  },
  tabBtn: {
    flex: 1, padding: "10px 0", border: "none", background: "none",
    fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer"
  },
  tabBtnActive: {
    color: "#2563eb", borderBottom: "2px solid #2563eb", backgroundColor: "#ffffff"
  },
  content: { padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  label: { fontSize: 12, fontWeight: 600, color: "#334155" },
  input: {
    width: "100%", boxSizing: "border-box",
    padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, outline: "none"
  },
  textarea: {
    width: "100%", boxSizing: "border-box",
    padding: 10, borderRadius: 6, border: "1px solid #cbd5e1",
    fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical"
  },
  chipBtn: {
    padding: "4px 10px", fontSize: 11, borderRadius: 6,
    border: "1px solid #cbd5e1", backgroundColor: "#ffffff",
    cursor: "pointer", fontWeight: 600, color: "#475569"
  },
  chipBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb", color: "#ffffff" },
  primaryBtn: {
    padding: "11px", backgroundColor: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer"
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  smallActionBtn: {
    background: "none", border: "none", color: "#2563eb",
    fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "underline"
  },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  errorText: { margin: 0, fontSize: 12, color: "#dc2626", fontWeight: 500 },
  resultContainer: { marginTop: 4, display: "flex", flexDirection: "column", gap: 6 },
  subHeading: { fontSize: 12, fontWeight: 700, color: "#1e293b" },
  copyBtn: {
    backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1",
    borderRadius: 4, fontSize: 11, padding: "4px 10px", cursor: "pointer", fontWeight: 600
  },
  warningBanner: {
    backgroundColor: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626",
    fontWeight: 600, marginBottom: 4
  },
  proCard: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, backgroundColor: "#faf5ff" },
  priceTag: { margin: "12px 0", display: "flex", justifyContent: "center", alignItems: "baseline", gap: 4 },
  proBenefits: {
    listStyle: "none", padding: 0, margin: "12px 0 20px",
    fontSize: 13, textAlign: "left", color: "#475569", lineHeight: "26px"
  },
  upgradeBtn: {
    display: "block", backgroundColor: "#9333ea", color: "#ffffff",
    textDecoration: "none", padding: "13px", borderRadius: 8,
    fontWeight: 700, fontSize: 14
  }
}
