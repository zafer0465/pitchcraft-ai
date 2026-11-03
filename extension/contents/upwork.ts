import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*.upwork.com/*"]
}

// 1. Listen for requests from popup to extract job text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_JOB_DESCRIPTION") {
    const jobText = extractJobDetails()
    sendResponse({ text: jobText })
  }
  return true
})

function extractJobDetails(): string {
  // Try common Upwork job description selectors
  const descriptionElement =
    document.querySelector('[data-test="job-description-text"]') ||
    document.querySelector(".job-description") ||
    document.querySelector('[data-test="job-description"]') ||
    document.querySelector("article") ||
    document.querySelector(".up-card-section")

  const titleElement =
    document.querySelector("header h2") ||
    document.querySelector("h1") ||
    document.querySelector('[data-test="job-title"]')

  const title = titleElement?.textContent?.trim() || ""
  const body = descriptionElement?.textContent?.trim() || ""

  if (!title && !body) {
    // If user highlighted text, use highlighted text
    return window.getSelection()?.toString() || ""
  }

  return `Job Title: ${title}\n\nJob Description:\n${body}`
}

// 2. In-page floating badge / injection (optional bonus UX)
console.log("PitchCraft AI extension is active on Upwork.")

