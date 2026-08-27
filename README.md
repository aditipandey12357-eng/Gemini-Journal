# 🚀 Personal Gemini Journal

> **"Think freely. Reflect deeply. Grow over time."**

A secure, production-grade personal reflection companion built with **React**, **Tailwind CSS**, **Node.js/Express**, **Cloud Firestore**, **Firebase Authentication (Google Sign-In)**, and the **Google Gemini API (@google/genai)**.

---

## 🌟 Key Product Features

1. **Firebase Authentication (Google Sign-In)**:
   - Zero custom password storage; authenticated identity derived strictly from Firebase Authentication.
2. **Strict Per-User Firestore Isolation**:
   - Documents structured under `/users/{uid}/journals/{journalId}/messages/{messageId}` and `/users/{uid}/evolutions/{evolutionId}`.
   - Enforced by owner-bound `firestore.rules` (`request.auth.uid == userId`).
3. **Secure Server-Side Gemini Architecture**:
   - Zero API keys exposed in browser code, client network requests, or localStorage.
   - Server-side model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
4. **Multi-Turn AI Reflections & Journal Summarization**:
   - Conversational AI reflection companion with dedicated action triggers (✨ *Reflect*, ❓ *Ask deeper question*, 💡 *Brainstorm*, 🎯 *Action Plan*).
   - Automatic summarization, mood tagging, and topic classification.
5. **🌱 Original Ideathon Feature: Reflection Evolution**:
   - Compares earlier journal reflections with recent reflections to uncover mindset shifts over time (e.g. *Uncertainty &rarr; Clear Evaluation*).
   - Non-diagnostic, empowering AI observations with follow-up exploration prompts.
6. **Data Portability & Sovereignty**:
   - One-click full JSON export of all personal reflection archives.

---

## 🛡️ Agentic Threat Model Summary

| Threat Zone | Identified Vector | Implemented Invariant & Countermeasure |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Prompt injection in journal text; oversized payload DoW | Schema length limits, untrusted data separation in system prompts, XSS auto-escaping in React |
| **2. Planning & Reasoning** | LLM hallucinating diagnostic certainty or medical advice | Non-diagnostic reflection companion system prompts, structured JSON schema extraction |
| **3. Tool Execution** | Gemini API key leakage in client bundles | Server-side Express proxy `/api/gemini/*` with fallback ladder; zero client-side keys |
| **4. Memory & State** | Cross-user data leakage, forged UID claims in payloads | Firestore hierarchy `/users/{uid}`, verified Firebase Auth ID tokens, zero-insecure rules |
| **5. Inter-System Comm** | Silent failures or crashes on undefined properties | Defensive undefined-stripping (`sanitizePayload`) before all database writes |

---

## 🔒 Active Cloud Firestore Security Rules

Deploy the following rules to enforce strict per-user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Strictly isolate all user data. User A can NEVER read or write User B's documents.
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔐 Google Cloud Secret Manager Configuration

Store and bind your Gemini API key dynamically:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚢 Google Cloud Run Production Deployment

Deploy the containerized full-stack application directly to Google Cloud Run with the required campaign label:

```bash
gcloud run deploy personal-gemini-journal \
  --source . \
  --region us-central1 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --allow-unauthenticated
```

---

## 🧪 Functional Walkthrough & Step-by-Step Test Plan

### Test Case 1: Google Sign-In & Auth State Integrity
1. Open the landing page.
2. Click **"Sign in with Google"**.
3. Verify redirection or popup completes and the private dashboard opens with your verified Google account profile.
4. Verify unauthenticated users cannot access `/users/{uid}` or private endpoints.

### Test Case 2: Multi-Turn Conversational Journaling
1. Click **"New Reflection"** or select **"Today's Reflection Prompt"**.
2. Type an initial thought (e.g. *"I've been thinking about changing my career."*).
3. Verify Gemini provides a thoughtful, non-diagnostic reflection asking open-ended questions.
4. Reply with a follow-up message (e.g. *"I'm balancing creative fulfillment with financial runway."*).
5. Verify context is maintained across multiple conversational turns.

### Test Case 3: Automatic Summarization & Topic Extraction
1. Click the **"Summarize"** button (or exchange 4+ messages).
2. Verify an AI-generated concise summary, primary mood badge (e.g. *Reflective*), and topic chips (e.g. *#Career*, *#Goals*) are assigned and persisted in Firestore.

### Test Case 4: 🌱 Reflection Evolution
1. Ensure at least two reflections exist (or click **"Seed Demo Reflections"**).
2. Navigate to the **"🌱 Evolution"** tab.
3. Click **"Analyze Thinking Changes"**.
4. Verify the side-by-side progression timeline displays *Earlier Reflection* vs. *More Recent Reflection*, alongside the mindset shift (e.g. *Uncertainty &rarr; Evaluation*) and Gemini's non-diagnostic observation.
5. Click one of the follow-up prompt cards (e.g. *"What changed in how you view this choice?"*) to verify it seeds a brand-new reflection seamlessly.

### Test Case 5: Security & Cross-User Isolation Verification
1. Navigate to the **"Security"** tab.
2. Click **"Run Live Isolation Probe"**.
3. Verify the client query to `users/FOREIGN_USER_DEMO_99999/journals` is immediately rejected with `PERMISSION_DENIED` by Firestore security rules.
4. Verify zero API keys exist in browser network logs or bundle assets.

### Test Case 6: Data Portability
1. Navigate to **"Profile"**.
2. Click **"Export All Journal Data (JSON)"**.
3. Verify a complete JSON file containing all user-isolated reflections, messages, and evolution records downloads successfully.
