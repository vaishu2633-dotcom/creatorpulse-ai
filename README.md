# CreatorPulse AI ⚡

> **CreatorPulse AI** is an intelligent, privacy-first decision studio and social media analytics web platform designed for content creators across YouTube, Instagram, X (formerly Twitter), and LinkedIn. Built around a closed optimization cycle—**Discover → Predict → Create → Publish → Learn**—the application unifies channel telemetry, forecasts calibrated breakout hit probabilities against creators' historical baselines, and generates audience-targeted, multi-lingual creative concepts.

---

> ⚠️ **IMPORTANT NOTE ON DATA & RESULTS (SYNTHETIC PROTOTYPE)**  
> All creator profiles, posts, engagement metrics, comment sentiment, and trend telemetry used in this prototype are **100% SYNTHETIC / MOCK DATA** generated strictly for system architecture demonstration, user interface testing, and machine learning pipeline benchmarking. The statistical outcomes, hit rates, and model performance scores reflect simulated mathematical distributions and **are not real empirical findings from commercial social media algorithms**.

---

## 🌟 Key Features & Core Pillars

CreatorPulse AI delivers three main pillars tailored specifically for modern creators:

1. **Creator Intelligence (Dashboard, Trends & Audience Voice)**
   - **Cross-Platform Dashboard**: Aggregated summary cards (followers, impressions, engagement rates, breakout count) and an interactive 30-day engagement trajectory area chart.
   - **Data Provenance & Freshness**: Every card explicitly reports data origin (`Data source: mock data`) and a last-refreshed timestamp.
   - **Trend Explorer**: Detect emerging conversation angles across platforms with 24-hour, 7-day, and 30-day velocity filters and narrative strength gauges. One-click sends trending topics directly into the Content Studio.
   - **Audience Voice (Comment Insights)**: Community mood breakdown (positive, neutral, critiques) paired with repeated viewer questions that can be transformed into content ideas with a single click.

2. **ViralScope Prediction Engine**
   - **Calibrated Hit Probability**: Predicts the likelihood that a draft post achieves a "breakout" hit status (e.g., `"18% (usual baseline: 5%)"`), never promising certainty.
   - **Contextual Anchoring & Diagnostics**: Displays realistic performance bounds (ranges), confidence ratings (low/medium/high), top algorithmic reasoning factors, and 3 comparable past posts.
   - **Customizable Percentile Strictness**: Adjust performance thresholds (`Top 20%`, `Top 10%`, `Top 5%`, or `Top 1% rare breakout`).
   - **Prediction Results & Scoreboard**: Comprehensive historical audit table tracking past predictions against actual post views, featuring a Brier score accuracy loss meter and calibration chart.

3. **ReelGenius Content Studio & Operations**
   - **Platform-Tailored Formats**:
     - *YouTube*: 5 click-worthy title options, 30-second cold hook, script retention outline, video description, and search tags.
     - *Instagram*: Reel concept, caption with CTA, hashtags, and a 5-slide carousel outline.
     - *X (Twitter)*: Opening hook variants and 7-tweet thread drafts.
     - *LinkedIn*: Narrative story post and actionable 5-point listicle.
   - **Multi-Lingual Generation**: Seamlessly outputs scripts and copy in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
   - **Best Ideas Tournament**: Automatically generates 10 creative angles, scores each with the ViralScope prediction service, and ranks them by hit potential.
   - **Calendar & Drafts**: Kanban-style board and list views to track ideas through the creator lifecycle (`Idea`, `Drafted`, `Scheduled`, `Published`).
   - **Model Tests (Imbalance Lab)**: Interactive benchmark comparison of 8 class-imbalance mitigation techniques (class weights, ROS, SMOTE, SMOTE-Tomek, Balanced Random Forest, XGBoost, and Threshold Tuning) across 4 extreme rarity ratios (80:20, 90:10, 95:5, 99:1).

---

## 🛠️ Tech Stack

* **Frontend**:
  - React 19 + Vite 8
  - Tailwind CSS v4 (with `@tailwindcss/vite`)
  - Framer Motion (slide-over inspection panels, fluid tab indicators, page transitions)
  - Lucide React (creator-focused iconography)
  - Recharts (responsive trajectory area charts, calibration bar charts, and mood donut visualizations)
  - React Router v7
* **Backend**:
  - Python 3.10+ / 3.12
  - FastAPI (REST API with CORS and modular routers)
  - Pydantic v2 (data schema contracts)
  - Uvicorn (high-performance ASGI web server)
* **Machine Learning & Analytics**:
  - scikit-learn (CalibratedClassifierCV, RandomForest, LogisticRegression, time-based splits)
  - imbalanced-learn (SMOTE, SMOTE-Tomek, BalancedRandomForestClassifier, RandomOverSampler)
  - XGBoost (gradient boosting with weighted loss)
* **Storage & Persistence**:
  - Zero-database prototype using pure JSON flat files managed strictly through an isolated Data Access Layer (DAL).

---

## 📂 Folder Structure

```
creatorpulse-ai/
├── backend/
│   ├── main.py                     # FastAPI server entry point & CORS configuration
│   ├── .env.example                # Example environment configuration
│   ├── requirements.txt            # Python dependencies (FastAPI, scikit-learn, etc.)
│   ├── ml/
│   │   ├── generate_data.py        # Generates synthetic data across 4 platforms
│   │   ├── train.py                # Time-based split training & imbalance benchmarking
│   │   ├── model.pkl               # Calibrated inference model (recreatable via train.py)
│   │   └── results.json            # Model benchmark results (recreatable via train.py)
│   ├── services/
│   │   ├── data_access.py          # EXCLUSIVE Data Access Layer (DAL) for all reads/writes
│   │   ├── prediction.py           # Calibrated prediction inference & diagnostics
│   │   └── content_generator.py    # Multi-lingual templates & external LLM adapter
│   ├── routers/                    # Feature routers (dashboard, trends, studio, etc.)
│   └── data/                       # Mock data files (posts, creators, snapshots, drafts)
├── frontend/
│   ├── src/
│   │   ├── api/apiClient.js        # Centralized typed API client
│   │   ├── context/                # ThemeContext, ToastContext, PlatformContext
│   │   ├── components/             # Reusable UI cards, slide-overs, badges, navbar
│   │   │   ├── ui/                 # Accessible button, card, tabs, skeleton loaders
│   │   │   └── SocialIcons.jsx     # Official platform brand SVG icons
│   │   ├── assets/illustrations/   # On-brand local SVG illustrations
│   │   └── pages/                  # 9 creator feature pages
│   ├── package.json
│   ├── vite.config.js              # Vite bundler configuration & backend API proxy
│   └── eslint.config.js            # Code hygiene & undefined identifier rules
├── docs/                           # Project reports, whitepapers, and documentation
├── .gitignore                      # Safe multi-stack ignore rules
└── README.md                       # Master project overview and documentation
```

---

## ⚡ Quickstart & Setup Guide

### 1. Prerequisites
- **Python**: Version 3.10, 3.11, or 3.12
- **Node.js**: Version 18+ and `npm`

---

### 2. Backend Setup & ML Data Generation

Open a terminal in the project root:

```bash
# Navigate to the backend directory
cd backend

# (Optional but recommended) Create and activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install required Python dependencies
pip install -r requirements.txt

# Step A: Generate synthetic creator dataset (1,800 posts across YouTube, IG, X, LinkedIn)
python -m backend.ml.generate_data

# Step B: Train the ViralScope model & produce benchmark metrics (saves model.pkl & results.json)
python -m backend.ml.train

# Step C: Start the FastAPI backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

* Backend will be active at: `http://127.0.0.1:8000`
* Interactive OpenAPI Swagger docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

Open a second terminal in the project root:

```bash
# Navigate to the frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the Vite development server (port 5173)
npm run dev
```

* Frontend application will be live at: **`http://localhost:5173`**
* The Vite dev server includes automatic reverse-proxy routing for `/api` requests to `http://127.0.0.1:8000`.

---

## 🗺️ Roadmap & Future Architecture

1. **Database Persistence Layer**:
   - Seamlessly transition from JSON flat files to PostgreSQL / Supabase with SQLAlchemy ORM. Because **all** data reads and writes are strictly encapsulated inside [`backend/services/data_access.py`](file:///C:/Users/vaish/.gemini/antigravity/scratch/creatorpulse-ai/backend/services/data_access.py), no routers or frontend components require changes.
2. **Direct Social Platform Integrations (OAuth 2.0)**:
   - YouTube Data API v3 & YouTube Analytics API.
   - Meta Graph API (Instagram Professional / Reels Insights).
   - X (Twitter) API v2.
   - LinkedIn Community Management & Analytics API.
3. **Channel CSV Analytics Ingestion**:
   - Zero-lock-in direct upload supporting native analytics exports from YouTube Studio and Meta Business Suite.
4. **LLM Studio Expansion**:
   - Connect live Gemini 1.5 Pro and Claude 3.5 Sonnet endpoints via [`backend/services/content_generator.py`](file:///C:/Users/vaish/.gemini/antigravity/scratch/creatorpulse-ai/backend/services/content_generator.py) for dynamic content rewriting and tone personalization.
5. **Advanced Imbalance Experimentation**:
   - Online adaptive learning adjusting decision thresholds dynamically based on shifts in individual creator baseline engagement rates.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
