# 🚀 Personal Gemini Journal

> **"Think freely. Reflect deeply. Grow over time."**

A secure, production-grade personal reflection companion and mindset evolution platform built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Node.js/Express**, **Cloud Firestore**, **Firebase Authentication (Google Sign-In)**, and the **Google Gemini API (`@google/genai`)**.

---

## 📑 Table of Contents

1. [Project Overview & Philosophy](#-project-overview--philosophy)
2. [Key Product Features](#-key-product-features)
3. [Architecture & Flow Diagrams](#-architecture--flow-diagrams)
   - [1. System Architecture Flow](#1-system-architecture-flow)
   - [2. Authentication & Data Isolation Flow](#2-authentication--data-isolation-flow)
   - [3. Multi-Turn Reflection & Action Trigger Flow](#3-multi-turn-reflection--action-trigger-flow)
   - [4. Reflection Evolution Engine Flow](#4-reflection-evolution-engine-flow)
   - [5. Production Deployment & Secret Flow](#5-production-deployment--secret-flow)
4. [Complete Repository Layout & Code Guide](#-complete-repository-layout--code-guide)
5. [Local Development & Setup Guide](#-local-development--setup-guide)
   - [Prerequisites](#prerequisites)
   - [Step-by-Step Local Setup](#step-by-step-local-setup)
6. [Comprehensive Local Testing Walkthrough](#-comprehensive-local-testing-walkthrough)
7. [Agentic Threat Model & Security Directives](#-agentic-threat-model--security-directives)
8. [Backend API Reference & Data Models](#-backend-api-reference--data-models)
9. [Google Cloud Run Production Deployment](#-google-cloud-run-production-deployment)
10. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 💡 Project Overview & Philosophy

Traditional journals capture static notes, while generic AI chatbots offer fragmented, forgetful conversations. **Personal Gemini Journal** bridges this gap by creating an **encrypted, user-isolated reflection sanctuary** where thoughts turn into long-term personal clarity.

The core philosophy is grounded in three pillars:
- 🌿 **Think Freely**: Express raw, unedited thoughts in a private, distraction-free interface backed by strict per-user database isolation.
- 🔍 **Reflect Deeply**: Engage with a supportive, non-diagnostic AI reflection companion that asks clarifying questions, structures intentions into actionable steps, and extracts underlying themes.
- 🌱 **Grow Over Time**: Harness the **Reflection Evolution** engine to compare earlier journal entries with recent entries, uncovering personal mindset shifts, cognitive progress, and emerging values over time.

---

## 🌟 Key Product Features

| Feature | Description | Implementation Details |
| :--- | :--- | :--- |
| 🛡️ **Firebase Authentication** | Secure, zero-password Google Sign-In with JWT token verification. | Client-side popup/redirect with token forwarding via `Authorization: Bearer <token>`. |
| 🔒 **Owner-Bound Isolation** | Total data privacy; users can only read and write their own documents. | Cloud Firestore security rules matching `/users/{userId}/**` with `request.auth.uid == userId`. |
| 🤖 **Server-Side Gemini Proxy** | Multi-turn conversational companion with zero exposed API keys. | Express backend calling `@google/genai` with a resilient 4-stage model fallback ladder. |
| ⚡ **Reflection Action Triggers** | On-demand cognitive prompts (✨ *Reflect*, ❓ *Deeper Question*, 💡 *Brainstorm*, 🎯 *Action Plan*). | Augmented prompt dispatching for contextual reflection modes. |
| 🏷️ **Automatic Summarization** | Real-time sentiment tagging, mood detection, and category assignment. | Structured JSON schema extraction returning titles, summaries, moods, and topic chips. |
| 🌱 **Reflection Evolution** | AI-driven differential analysis of past vs. recent journal entries. | Contextual aggregation comparing baseline thoughts with current perspective to plot mindset shifts. |
| 📦 **Data Sovereignty & Export** | One-click complete archive extraction in standard JSON format. | Recursive Firestore document retrieval compiling journals, messages, and evolution logs. |

---

## 📊 Architecture & Flow Diagrams

### 1. System Architecture Flow

```text
[Client / Browser (React 19)]
  │
  ├─> (HTTPS / Firebase Auth JWT) ─────────> [Google Firebase Cloud Platform]
  │                                           ├─> Firebase Auth (Authentication Provider)
  │                                           └─> Cloud Firestore (Database: /users/{userId}/journals/{journalId})
  │
  └─> (HTTPS POST /api/gemini/chat) ─────────> [Secure Backend (Node.js + Express)]
                                              ├─> Rate Limiting / Guardrails
                                              └─> Google GenAI SDK (Calls Gemini 2.5 Flash / 3.7 Flash)
flowchart TB
    subgraph Client ["Client Layer (React 19 + Tailwind CSS)"]
        UI[Single Page App UI]
        AuthHook[Firebase Auth Hook]
        JService[Journal Service / Firestore SDK]
        GeminiClient[Gemini API Client Proxy]
    end

    subgraph Firebase ["Google Firebase Cloud Platform"]
        FAuth[Firebase Authentication\nGoogle OAuth Provider]
        Firestore[Cloud Firestore NoSQL Database\n/users/{uid}/journals\n/users/{uid}/evolutions]
        FRules[Owner-Bound Security Rules\nrequest.auth.uid == userId]
    end

    subgraph Backend ["Server Layer (Node.js + Express)"]
        Server[Express Server on Port 3000]
        AuthMW[requireAuth Middleware]
        FallbackLadder[Gemini Model Fallback Ladder\n1. gemini-3.6-flash\n2. gemini-3.1-flash-lite\n3. gemini-flash-latest\n4. gemini-3.7-flash]
    end

    subgraph GoogleAI ["Google Gemini AI Cloud"]
        GenAI[@google/genai SDK]
        SecretMgr[Secret Manager / Process Env\nGEMINI_API_KEY]
    end

    UI --> AuthHook
    AuthHook <--> FAuth
    UI --> JService
    JService <--> FRules
    FRules <--> Firestore
    UI --> GeminiClient
    GeminiClient -- "POST /api/gemini/* (Bearer Token)" --> Server
    Server --> AuthMW
    AuthMW --> FallbackLadder
    FallbackLadder <--> GenAI
    SecretMgr -.-> FallbackLadder
```

---

### 2. Authentication & Data Isolation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant Client as React App
    participant FAuth as Firebase Auth
    participant Server as Express Server (/api/*)
    participant FStore as Cloud Firestore Rules

    User->>Client: Clicks "Sign in with Google"
    Client->>FAuth: signInWithPopup(googleProvider)
    FAuth-->>Client: Returns Firebase User (UID: abc123xyz, ID Token)
    Client->>Client: Sync User Profile state & streak
    
    rect rgb(240, 250, 240)
        Note over Client,FStore: Authorized Database Access
        Client->>FStore: getDocs(collection(db, "users/abc123xyz/journals"))
        FStore->>FStore: Verify request.auth.uid == "abc123xyz"
        FStore-->>Client: 200 OK (Returns private user journals)
    end

    rect rgb(255, 240, 240)
        Note over Client,FStore: Malicious / Foreign Probe Attempt
        Client->>FStore: getDocs(collection(db, "users/FOREIGN_USER/journals"))
        FStore->>FStore: Check request.auth.uid ("abc123xyz" != "FOREIGN_USER")
        FStore-->>Client: 403 PERMISSION_DENIED (Blocked)
    end

    rect rgb(240, 245, 255)
        Note over Client,Server: Authenticated Gemini Interaction
        Client->>Server: POST /api/gemini/chat with Header Authorization: Bearer <ID_TOKEN>
        Server->>Server: Validate Bearer token in requireAuth middleware
        Server-->>Client: 200 OK with Gemini reflection reply
    end
```

---

### 3. Multi-Turn Reflection & Action Trigger Flow

```mermaid
flowchart TD
    Start([User opens Journal View]) --> CheckDraft{Draft thought entered?}
    CheckDraft -- Yes --> SelectAction{Action Trigger Selected?}
    CheckDraft -- No --> EnterThought[User types thought or prompt] --> SelectAction

    SelectAction -- "✨ Reflect" --> SetActionReflect[actionType = 'reflect']
    SelectAction -- "❓ Deeper Question" --> SetActionQuestion[actionType = 'deeper_question']
    SelectAction -- "💡 Brainstorm" --> SetActionBrainstorm[actionType = 'brainstorm']
    SelectAction -- "🎯 Action Plan" --> SetActionPlan[actionType = 'action_plan']
    SelectAction -- Standard Send --> SetActionNormal[actionType = undefined]

    SetActionReflect --> DispatchPayload
    SetActionQuestion --> DispatchPayload
    SetActionBrainstorm --> DispatchPayload
    SetActionPlan --> DispatchPayload
    SetActionNormal --> DispatchPayload

    DispatchPayload[Format conversation history & dispatch to /api/gemini/chat] --> ExpressRoute[Express Route Handler]
    ExpressRoute --> SanitizeInput[Defensive Input Validation & Sanitization]
    SanitizeInput --> Model1{Attempt 1:\ngemini-3.6-flash}

    Model1 -- Success --> ReturnReply[Return AI response to client]
    Model1 -- Error 503/429/500 --> Model2{Attempt 2:\ngemini-3.1-flash-lite}
    Model2 -- Success --> ReturnReply
    Model2 -- Error --> Model3{Attempt 3:\ngemini-flash-latest}
    Model3 -- Success --> ReturnReply
    Model3 -- Error --> Model4{Attempt 4:\ngemini-3.7-flash}
    Model4 -- Success --> ReturnReply
    Model4 -- Failure --> FailOut[500 JSON Error: All fallback models failed]

    ReturnReply --> PersistUser[Save user message in Firestore]
    PersistUser --> PersistAI[Save assistant message in Firestore]
    PersistAI --> CheckLength{Messages >= 4 or User clicked Summarize?}
    CheckLength -- Yes --> TriggerSummarize[Call /api/gemini/summarize]
    CheckLength -- No --> EndCycle([Ready for next turn])
    TriggerSummarize --> UpdateMeta[Update Journal: Title, Summary, Mood, Topics] --> EndCycle
```

---

### 4. Reflection Evolution Engine Flow

```mermaid
flowchart LR
    subgraph DataCollection ["1. Historical Data Ingestion"]
        UserJournals[(Cloud Firestore\n/users/{uid}/journals)] --> SortChronological[Sort Journals by Date]
        SortChronological --> SplitPeriods[Divide into Earlier Baseline vs. Recent Reflections]
    end

    subgraph PayloadFormatting ["2. Context Formulation"]
        SplitPeriods --> FormatEarlier["Earlier Excerpts:\n- Quotes & Key Themes\n- Uncertainty & Hesitations"]
        SplitPeriods --> FormatRecent["Recent Excerpts:\n- Priorities & Clarity\n- Value Alignments"]
    end

    subgraph LLMAnalysis ["3. Gemini Evolution Engine"]
        FormatEarlier & FormatRecent --> EvolutionPrompt["System Instruction:\nNon-Diagnostic Reflection Analyst\nIdentify Shift Summary (A → B)"]
        EvolutionPrompt --> GeminiEvolution[POST /api/gemini/evolution]
    end

    subgraph OutputPersist ["4. Client Visuals & Follow-Up"]
        GeminiEvolution --> ParsedJSON["Structured Result:\n- Theme & Mindset Shift\n- Earlier vs Recent Cards\n- Non-diagnostic Observation\n- 3 Follow-up Prompts"]
        ParsedJSON --> SaveFirestore[(Save to /users/{uid}/evolutions)]
        ParsedJSON --> RenderEvolutionUI[Render Timeline & Mindset Shift UI]
        RenderEvolutionUI --> ClickPrompt[User clicks Follow-up Prompt]
        ClickPrompt --> NewJournalSession([Seeds Brand-New Journal Reflection])
    end
```

---

### 5. Production Deployment & Secret Flow

```mermaid
flowchart TD
    Developer([Developer / CI]) --> CreateSecret["gcloud secrets create GEMINI_API_KEY"]
    CreateSecret --> PopulateSecret["echo -n 'KEY' | gcloud secrets versions add"]
    PopulateSecret --> GrantIAM["Grant secretAccessor role to Cloud Run Service Account"]
    
    GrantIAM --> BuildDeploy["gcloud run deploy personal-gemini-journal\n--set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest\n--update-labels=dev-tutorial=cloud-run-ai-challenge"]
    
    BuildDeploy --> CloudRunInstance[Google Cloud Run Container Instance]
    CloudRunInstance --> ServerBoot["server.ts Boots on 0.0.0.0:3000"]
    ServerBoot --> RuntimeSecret[Injects process.env.GEMINI_API_KEY dynamically at runtime]
```

---

## 📁 Complete Repository Layout & Code Guide

```
├── .env.example                      # Blueprint for environment variables (GEMINI_API_KEY, APP_URL)
├── .gitignore                        # Git exclusion rules (node_modules, dist, secrets, build logs)
├── README.md                         # Comprehensive project documentation & architecture reference
├── bun.lock                          # Dependency lockfile for bun package manager
├── firebase-applet-config.json       # Firebase client config (Auth domain, Database ID, App ID)
├── firestore.rules                   # Production Firestore security rules (strict per-user isolation)
├── index.html                        # HTML5 entrypoint with metadata and root mount target
├── metadata.json                     # AI Studio metadata specifying capabilities and permissions
├── package.json                      # NPM scripts, runtime dependencies (@google/genai, React 19), devDeps
├── server.ts                         # Express server, /api/gemini routes, Vite middleware, fallback ladder
├── tsconfig.json                     # TypeScript compiler configuration (ES2022, bundler resolution)
├── vite.config.ts                    # Vite config with React plugin and Tailwind CSS v4 integration
└── src/
    ├── main.tsx                      # React root rendering script mounting App inside StrictMode
    ├── index.css                     # Global stylesheet with @import "tailwindcss";
    ├── types.ts                      # Universal TypeScript interfaces (Journal, Evolution, UserProfile)
    ├── App.tsx                       # Master controller: Auth state, view routing, real-time sync
    ├── lib/
    │   ├── firebase.ts               # Firebase App, Auth, Firestore initialization & Google Auth helpers
    │   ├── geminiApi.ts              # Client API proxy wrapper for /api/gemini endpoints
    │   └── journalService.ts         # Firestore CRUD service with zero-crash sanitizePayload hygiene
    └── components/
        ├── Navbar.tsx                # Responsive top navigation, user profile badge, sign-in/out trigger
        ├── LandingView.tsx           # Hero section, feature breakdown, and Google Sign-In call-to-action
        ├── DashboardView.tsx         # User home: streak tracker, quick prompt card, recent reflection grid
        ├── JournalView.tsx           # Multi-turn reflection interface with action triggers and live summary
        ├── EvolutionView.tsx         # Original Ideathon: Comparative mindset evolution timeline & prompts
        ├── HistoryView.tsx           # Chronological archives with mood filter, search, and detail modal
        ├── SecurityView.tsx          # Interactive threat model inspector & live Firestore isolation probe
        └── ProfileView.tsx           # User settings, session stats, and complete JSON archive export
```

### Detailed Component & Module Tour

- **`server.ts`**:
  - Implements top-level deserialization middleware (`express.json({ limit: "2mb" })`).
  - Contains `generateWithFallback()` providing zero-downtime model fallback (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
  - Provides endpoints: `/api/health`, `/api/gemini/chat`, `/api/gemini/summarize`, `/api/gemini/evolution`, and `/api/gemini/daily-prompt`.
  - Integrates Vite development middleware in local dev and static Express file serving in production.

- **`src/lib/journalService.ts`**:
  - Contains the `sanitizePayload()` recursive utility that strips any `undefined` keys prior to passing data to Firestore, preventing database driver exceptions.
  - Exposes type-safe CRUD operations for user profiles, journals, messages, and reflection evolution insights.

- **`src/components/EvolutionView.tsx`**:
  - Powers the **Reflection Evolution** feature. Aggregates past entries, submits them to `/api/gemini/evolution`, and renders a side-by-side comparative card highlighting the user's shift in perspective along with 3 contextual follow-up reflection questions.

- **`src/components/SecurityView.tsx`**:
  - Provides a live test suite where users and evaluators can verify the application's agentic threat model and execute a real-time **Firestore Cross-User Isolation Probe**.

---

## 🛠️ Local Development & Setup Guide

### Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: Version `20.x` or higher (`node -v`)
- **npm** (`npm -v`) or **bun** (`bun -v`)
- **A Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)
- **A Firebase Project** (or use the pre-configured project credentials)

---

### Step-by-Step Local Setup

#### Step 1: Clone the Repository & Navigate to Folder

```bash
git clone <YOUR_REPO_URL>
cd personal-gemini-journal
```

#### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using bun:
```bash
bun install
```

#### Step 3: Configure Local Environment Variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Gemini API key:

```env
# .env
GEMINI_API_KEY="AIzaSyYourActualGeminiApiKeyHere"
APP_URL="http://localhost:3000"
```

> ⚠️ **Security Note**: Never commit your `.env` file containing real API keys to version control. The `.gitignore` file already excludes `.env`.

#### Step 4: Verify Firebase Configuration

Inspect `firebase-applet-config.json` in the root directory. Ensure it has valid Firebase client configuration keys:

```json
{
  "projectId": "gen-lang-client-0103084590",
  "appId": "1:852490978309:web:153945072eb324bf73086c",
  "apiKey": "AIzaSyAWS0ubwFjH5jwOEpTmaAUmUuWlfuF0yOM",
  "authDomain": "gen-lang-client-0103084590.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-remixpersonalgem-015262ac-9bac-459d-8e28-10ab9df7eb5b",
  "storageBucket": "gen-lang-client-0103084590.firebasestorage.app",
  "messagingSenderId": "852490978309",
  "measurementId": "",
  "oAuthClientId": "852490978309-6jbok1lcl362ktmd80ajk0n63im02plp.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
}
```

> If you are using your own custom Firebase project, update `firebase-applet-config.json` with your project's credentials from the Firebase Console (Project Settings &rarr; General &rarr; Your apps &rarr; Web app).

#### Step 5: Start the Development Server

Run the development command:

```bash
npm run dev
```

This launches `server.ts` with `tsx`, binding Express and the Vite SPA middleware on:
👉 **`http://localhost:3000`**

Open your browser and navigate to `http://localhost:3000`.

---

## 🧪 Comprehensive Local Testing Walkthrough

Walk through the following 6 test suites to verify full functionality, security boundaries, and AI integrations locally.

```
+-----------------------------------------------------------------------------------+
|                              LOCAL VERIFICATION MATRIX                            |
+----+----------------------------------+--------------------+----------------------+
| #  | Feature / Flow                   | Test Action        | Expected Outcome     |
+----+----------------------------------+--------------------+----------------------+
| 1  | Google Authentication            | Click Sign In      | Profile synced in DB |
| 2  | Multi-turn Conversational Chat   | Send Reflections   | Context maintained   |
| 3  | Reflection Action Triggers       | Trigger Actions    | Tailored AI guidance |
| 4  | Auto Summarization & Tagging     | Summarize Session  | Tags & mood updated  |
| 5  | Reflection Evolution Analysis    | Compare Timelines  | Mindset shift mapped |
| 6  | Cross-User Isolation Probe       | Run Security Test  | 403 PERMISSION DENIED|
+----+----------------------------------+--------------------+----------------------+
```

### Test Case 1: Google Authentication & Profile Sync
1. Open `http://localhost:3000`. You will see the **Landing View**.
2. Click **"Sign in with Google"** in the top navigation or hero section.
3. Complete the Google Auth popup.
4. **Verification**:
   - The landing page transitions into the private **Dashboard View**.
   - Your Google avatar, display name, and active streak counter appear in the top navigation.
   - Inspect Firestore: A document at `/users/{your_uid}` is created/updated with `lastLoginAt` and `streakCount`.

### Test Case 2: Multi-Turn Conversational Reflection
1. On the Dashboard, click **"Start New Reflection"** or select **"Today's Reflection Prompt"**.
2. Type an opening thought (e.g. *"I've been feeling torn between two career opportunities."*).
3. Click the **Send** icon or press **Enter**.
4. **Verification**:
   - The user message is saved to Firestore under `/users/{uid}/journals/{journalId}/messages`.
   - The Gemini Reflection Companion responds with a thoughtful, non-diagnostic inquiry.
   - Reply with a follow-up (e.g. *"One offers higher stability, but the other offers more creative freedom."*).
   - Verify Gemini maintains full context from the prior turns.

### Test Case 3: Reflection Action Triggers
1. In the active journal view, type a thought into the text area.
2. Instead of standard send, click one of the action trigger pills:
   - **✨ Reflect**: Prompts Gemini to offer an empathetic reflection on values.
   - **❓ Deeper Question**: Prompts Gemini to isolate a single illuminating inquiry.
   - **💡 Brainstorm**: Prompts Gemini to explore alternative angles.
   - **🎯 Action Plan**: Prompts Gemini to break the intention into 2-3 low-stress next steps.
3. **Verification**: The response reflects the requested action mode.

### Test Case 4: Automatic Summarization, Mood & Topic Extraction
1. In an active journal conversation with 2+ messages, click the **"Summarize"** button in the header.
2. **Verification**:
   - Gemini processes the conversation transcript and returns structured JSON.
   - The journal title updates from "New Reflection" to an insightful theme title.
   - The summary card displays an empathetic summary.
   - A primary mood badge (e.g. `Reflective`, `Calm`, `Confused`) and topic chips (e.g. `#Career`, `#Goals`) are attached and saved to Firestore.

### Test Case 5: 🌱 Reflection Evolution Engine
1. Ensure at least two journal reflections exist (or click **"Seed Demo Journey"** on the Dashboard for immediate sample data).
2. Click the **"🌱 Evolution"** tab in the navigation bar.
3. Select a focus topic (or "All Topics") and click **"Analyze Thinking Changes"**.
4. **Verification**:
   - The system partitions early baseline reflections from recent reflections.
   - The UI renders the Evolution Timeline with:
     - **Earlier Baseline Card**: Summary of early mindset and representative quote.
     - **Shift Arrow**: Mindset transition indicator (e.g., *Uncertainty &rarr; Evaluation*).
     - **Recent State Card**: Summary of current clarity and representative quote.
     - **Gemini Observation**: A warm, non-diagnostic observation on your growth.
     - **3 Follow-Up Prompts**: Click any prompt (e.g. *"What changed in how you view this choice?"*) to immediately launch a new seeded journal reflection.

### Test Case 6: Live Security Isolation Probe & Threat Defense
1. Navigate to the **"Security"** tab in the navigation bar.
2. Review the active 5 Threat Zones table.
3. Click the **"Run Live Isolation Probe"** button.
4. **Verification**:
   - The client attempts an unauthorized query to `users/FOREIGN_USER_DEMO_99999/journals`.
   - Firestore security rules instantly reject the request with `PERMISSION_DENIED`.
   - The test status lights turn green, confirming owner-bound database rules are active.

### Test Case 7: Data Sovereignty & JSON Export
1. Navigate to the **"Profile"** tab.
2. Click **"Export All Journal Data (JSON)"**.
3. **Verification**: A JSON file (`gemini-journal-export-<uid>-<timestamp>.json`) containing your complete user profile, all journals, conversation messages, and evolution insights downloads to your machine.

---

## 🛡️ Agentic Threat Model & Security Directives

```
+----------------------------------------------------------------------------------------------------+
|                                    AGENTIC THREAT MODEL MATRIX                                     |
+----+-------------------+--------------------------------+------------------------------------------+
| #  | Threat Zone       | Identified Attack Vector       | Countermeasure & Architecture Invariant  |
+----+-------------------+--------------------------------+------------------------------------------+
| 1  | Input Surfaces    | Prompt injection in journals;  | Strict length caps (8k chars), untrusted |
|    |                   | oversized payload DoS          | data encapsulation, React auto-escaping  |
+----+-------------------+--------------------------------+------------------------------------------+
| 2  | Planning/Reasoning| LLM hallucinating clinical     | System prompt non-diagnostic stance;     |
|    |                   | diagnoses or medical claims    | structured JSON schemas for summaries    |
+----+-------------------+--------------------------------+------------------------------------------+
| 3  | Tool Execution    | Gemini API key leakage in JS   | Server-side Express proxy (/api/gemini); |
|    |                   | client bundles or network logs | Zero client-side keys; fallback ladder   |
+----+-------------------+--------------------------------+------------------------------------------+
| 4  | Memory & State    | Cross-user data leaks, forged  | Owner-bound firestore.rules enforced;    |
|    |                   | UID requests, DB write crashes | sanitizePayload strips all undefined keys|
+----+-------------------+--------------------------------+------------------------------------------+
| 5  | Inter-System Comm | API failure / rate limit DoS   | 4-stage fallback ladder; defensive token |
|    |                   | from external endpoints        | validation in requireAuth middleware     |
+----+-------------------+--------------------------------+------------------------------------------+
```

### Active Cloud Firestore Security Rules

The application enforces owner-bound access control in `firestore.rules`:

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

## 📡 Backend API Reference & Data Models

### REST API Endpoints (`server.ts`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | System health check and security configuration status. |
| `POST` | `/api/gemini/chat` | Yes (`Bearer <token>`) | Multi-turn conversational reflection with action triggers. |
| `POST` | `/api/gemini/summarize` | Yes (`Bearer <token>`) | Structured summarization, mood tagging, and category extraction. |
| `POST` | `/api/gemini/evolution` | Yes (`Bearer <token>`) | Differential past vs. recent reflection mindset analysis. |
| `POST` | `/api/gemini/daily-prompt`| No | Dynamic daily reflection prompt generator. |

---

### Core Data Models (`src/types.ts`)

```typescript
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  streakCount: number;
  totalJournals: number;
}

export interface Journal {
  id: string;
  userId: string;
  title: string;
  summary: string;
  mood: "Reflective" | "Calm" | "Excited" | "Worried" | "Frustrated" | "Confused" | "Happy" | "Neutral";
  topics: ("Career" | "Studies" | "Relationships" | "Goals" | "Ideas" | "Future" | "Personal" | "Wellbeing" | "Creativity")[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview?: string;
  keyInsight?: string;
}

export interface JournalMessage {
  id: string;
  journalId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actionType?: "reflect" | "summarize" | "brainstorm" | "action_plan" | "deeper_question";
}

export interface ReflectionEvolution {
  id: string;
  userId: string;
  timestamp: string;
  comparedJournalIds: string[];
  theme: string;
  earlierSummary: string;
  earlierQuote: string;
  recentSummary: string;
  recentQuote: string;
  shiftSummary: string;
  geminiObservation: string;
  followUpPrompts: string[];
}
```

---

## 🚢 Google Cloud Run Production Deployment

Deploy the containerized full-stack application directly to Google Cloud Run with Google Secret Manager bindings and the mandatory challenge verification label.

### 1. Enable Required Google Cloud APIs

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Configure Secret Manager for Gemini API Key

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key secret version
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run default compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Cloud Run with Challenge Verification Label

```bash
gcloud run deploy personal-gemini-journal \
  --source . \
  --region us-central1 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --allow-unauthenticated
```

### 4. Deploy Cloud Firestore Security Rules

Using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## ❓ Troubleshooting & FAQ

### Q: Why do I get `auth/popup-blocked` when clicking Sign In?
- **Cause**: Browser popup blockers or strict iframe sandboxing policies.
- **Solution**: The app includes an automatic fallback to `signInWithRedirect()`. You can also allow popups for `localhost:3000` in your browser settings.

### Q: Why does the server report `GEMINI_API_KEY is not configured`?
- **Cause**: Missing `.env` file or empty `GEMINI_API_KEY` variable.
- **Solution**: Ensure `.env` exists in the project root with `GEMINI_API_KEY="your-actual-key"`, and restart the dev server with `npm run dev`.

### Q: How does the model fallback ladder work?
- **Behavior**: If `gemini-3.6-flash` is temporarily unavailable (e.g., rate limit or 503), the backend automatically and silently tries `gemini-3.1-flash-lite`, then `gemini-flash-latest`, and finally `gemini-3.7-flash` before throwing any error to the user interface.

---

## 📄 License & Attribution

Designed and developed for the **Google Cloud Run & Gemini Ideathon Challenge**.
Built with Google Cloud Run, Cloud Firestore, Firebase Authentication, and `@google/genai`.

