# FutureVerse AI — Simulate Today, Shape Tomorrow

> An AI-powered personal financial twin and decision simulator that helps users see how today's financial decisions shape their future savings.

---

## 🌟 Core Features

1. **Digital Financial Twin**
   - Real-time model connecting income, expenses, savings rate, and emergency buffer.
   - Calculates financial health score (0–100) and personalized insights.

2. **Deterministic Future Simulator**
   - Month-by-month financial projection engine using precise monetary arithmetic.
   - Models one-time purchases, recurring expense adjustments, and income changes.
   - Generates real SVG bezier curve projections and detects cash shortages or safety buffer breaches.

3. **Parallel Futures Comparison**
   - **Future A (Buy Immediately):** Cost deducted immediately; monitors short-term buffer resilience.
   - **Future B (Wait 3 Months):** Allows buffer accumulation before purchase; provides balanced cushion.
   - **Future C (Postpone 6 Months):** Preserves 100% of savings growth with zero cash risk.

4. **AI Financial Coach (Powered by Google Gemini API)**
   - Built with the official `@google/genai` SDK.
   - Grounded in the user's live financial data (income, expenses, goals, and simulations).
   - Dynamic interactive action buttons:
     - **Simulate This Decision** (pre-fills purchase amounts and triggers simulation)
     - **Compare My Futures**
     - **Explain My Simulation**
   - Clickable suggested questions, multi-turn history, and conversation clear options.

5. **Financial Ledger & Savings Goals**
   - Income and expense tracking.
   - Visual milestone progress bars and target date projections.

---

## 🏗️ Architecture & Folder Structure

```
Future-Verse-AI/
├── .env.example                # Template of all required environment variables
├── .env                        # Local environment secrets (ignored by Git)
├── package.json                # Project dependencies and run scripts
├── render.yaml                 # Render Blueprint deployment configuration
├── supabase/
│   └── schema.sql              # Supabase PostgreSQL schema with RLS policies
├── test/
│   └── test-endpoints.js       # Automated integration test suite
├── server/                     # Node.js & Express.js Backend
│   ├── server.js               # Express application entry point & static file server
│   ├── config/
│   │   ├── env.js              # Environment variable loader
│   │   ├── supabase.js         # Supabase client & fallback store
│   │   └── gemini.js           # Google GenAI SDK (@google/genai) client
│   ├── middleware/
│   │   ├── auth.middleware.js  # Supabase JWT token validator
│   │   ├── rateLimiter.middleware.js # API and AI chat rate limiters
│   │   ├── validation.middleware.js  # Request body validation
│   │   └── errorHandler.middleware.js # Centralized error handling
│   ├── services/
│   │   ├── simulation.service.js # Deterministic calculation & curve generation engine
│   │   ├── gemini.service.js   # Gemini AI Coach integration with financial grounding
│   │   └── supabase.service.js # Database CRUD service with persistent fallback
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── finance.controller.js
│   │   ├── transactions.controller.js
│   │   ├── goals.controller.js
│   │   ├── simulate.controller.js
│   │   └── ai.controller.js
│   └── routes/
│       ├── health.routes.js
│       ├── auth.routes.js
│       ├── finance.routes.js
│       ├── transactions.routes.js
│       ├── goals.routes.js
│       ├── simulate.routes.js
│       ├── ai.routes.js
│       └── index.js
└── dist/                       # Frontend Web Application (Vanilla HTML/CSS/JS)
    ├── index.html              # Main application shell & screens
    ├── api.js                  # Frontend REST API client
    ├── app.js                  # Core interactive screens & navigation
    ├── enhancements.js         # Backend connector, dynamic data loader & AI Coach UI
    ├── styles.css              # Landing page styling & visual effects
    ├── screens.css             # Dashboard, twin, and tool panels styling
    ├── ai-coach.css            # Responsive AI Coach chat interface styles
    └── simulator-responsive.css
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the keys in `.env`:
```env
PORT=5000
NODE_ENV=development

# Supabase (Get from your Supabase Dashboard -> Project Settings -> API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API (Get free from https://aistudio.google.com/)
GEMINI_API_KEY=your-gemini-api-key

# Base URLs
FRONTEND_URL=http://localhost:5000
VITE_API_BASE_URL=/api
```
*(Note: If Supabase keys are not set yet, the app automatically runs in local test/demo mode with persistent data so you can test all features immediately!)*

### 4. Start the Application
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser. Both the backend API and frontend application run together seamlessly!

### 5. Run the Automated API Test Suite
```bash
node test/test-endpoints.js
```

---

## 🗄️ Supabase Database Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/schema.sql`](supabase/schema.sql) in this repository, copy its contents, and run it.
4. It will create all 7 required tables with **Row Level Security (RLS)** policies enabled:
   - `profiles`
   - `financial_profiles`
   - `transactions`
   - `savings_goals`
   - `simulations`
   - `ai_conversations`
   - `chat_messages`
5. Copy your **Project URL**, **Anon Key**, and **Service Role Key** into your `.env` file.

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend service & integration health check |
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate existing user |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/finance/summary` | Real-time financial metrics, surplus, and health score |
| `PUT` | `/api/finance/profile` | Update user financial assumptions |
| `GET` | `/api/transactions` | Retrieve all transactions |
| `POST` | `/api/transactions` | Add a new income or expense transaction |
| `DELETE` | `/api/transactions/:id` | Remove a transaction |
| `GET` | `/api/goals` | Retrieve active savings goals |
| `POST` | `/api/goals` | Create a new savings goal |
| `PUT` | `/api/goals/:id` | Update goal target or current savings |
| `DELETE` | `/api/goals/:id` | Remove a savings goal |
| `POST` | `/api/simulate` | Deterministic month-by-month future simulation |
| `POST` | `/api/simulate/compare` | Parallel Futures comparison (Scenarios A, B, C) |
| `POST` | `/api/ai/chat` | Communicate with Gemini AI Financial Coach |
| `GET` | `/api/ai/history` | Retrieve conversation history |
| `POST` | `/api/ai/clear` | Clear chat history |

---

## ☁️ Deployment on Render

### Option A: Blueprint Deployment (Recommended)
1. Push your repository to GitHub.
2. In the Render Dashboard, click **New +** &rarr; **Blueprint**.
3. Select your repository. Render will automatically detect [`render.yaml`](render.yaml) and configure the web service.
4. Set your `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` under the Environment Variables section.
5. Click **Apply**.

### Option B: Manual Web Service Deployment
1. In Render, select **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Add the environment variables from your `.env` file.
5. Deploy!
