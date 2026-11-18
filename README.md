# CreatorPulse AI ⚡
## ML-Based Social Media Sentiment Analysis System (VibeCheck AI)

> **CreatorPulse AI** is a focused, academic Machine Learning application designed to analyze audience sentiment across **YouTube** and **X (Twitter)** using traditional Machine Learning algorithms.

The application contains **one central feature**: **VibeCheck AI – Social Media Sentiment Analysis**. Its purpose is to analyze audience reactions to YouTube videos and X posts and predict whether the overall sentiment is:
- **Positive**
- **Negative**
- **Neutral**

---

## 🌟 Core Feature: VibeCheck AI

### 1. Two-Platform Scope
- **YouTube**: Ingests real video metadata and top-level viewer comments via the official **YouTube Data API v3**.
- **X (Twitter)**: Validates post URLs and authenticates via official **X API v2** using Bearer Token credentials.
- **Honest Error Handling**: If comments are disabled on a YouTube video or if X developer credits are depleted (HTTP 402 Payment Required), clear and transparent messages are displayed. Fake comments, imaginary engagement, and fabricated sentiment scores are strictly prohibited.
- **Custom Feedback Fallback**: When official API comments cannot be retrieved, users can paste audience comments directly into the system for ML sentiment prediction.

### 2. Traditional Machine Learning Implementation
In accordance with academic Machine Learning standards, the system relies strictly on traditional ML algorithms:

1. **Logistic Regression** (L-BFGS solver, regularized C=1.5)
2. **Multinomial Naive Bayes** (Additive Laplace smoothing alpha=0.5)
3. **Linear Support Vector Machine (Linear SVM)** (Calibrated probability classifier, C=1.0)

**Strict Academic Safeguards**:
- **Zero LLM or Generative AI**: No hallucinations, deep learning, or unnecessary neural networks.
- **Zero Data Leakage**: Stratified 80% train / 20% test split with TF-IDF vectorizer fit strictly on training data.
- **Comprehensive Evaluation**: Every algorithm is evaluated using Accuracy, Precision (Weighted & Macro), Recall (Weighted & Macro), F1-Score (Weighted & Macro), and a 3×3 Confusion Matrix.
- **Automated Winner Selection**: The best-performing model based on F1-score (**Multinomial Naive Bayes**, F1: 96.26%) is persisted and loaded for live inference.

### 3. Model Comparison Benchmark

| Algorithm | Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Multinomial Naive Bayes** | **96.25%** | **96.35%** | **96.25%** | **96.26%** | **Active Winner** |
| **Linear SVM** | 95.42% | 95.45% | 95.42% | 95.43% | Candidate |
| **Logistic Regression** | 95.00% | 95.10% | 95.00% | 95.02% | Candidate |

---

## 📊 VibeCheck Results Interface

After analyzing content, the application displays:

1. **Overall Vibe**:
   - `Positive`: Favorable, supportive, and enthusiastic audience reaction.
   - `Negative`: Dissatisfied, critical, or concerned feedback.
   - `Neutral`: Balanced, objective, or mixed commentary.
2. **Sentiment Distribution**:
   - Visual progress bar and cards showing Positive %, Neutral %, and Negative %.
   - Calculated directly from actual predictions of the analyzed text samples.
3. **Analysis Summary**:
   - Concise explanation synthesizing the audience tone and discussion drivers.
4. **Analysis Information**:
   - Platform (YouTube / X)
   - Source URL
   - Number of text samples successfully analyzed
   - Selected ML Model (e.g., `Multinomial Naive Bayes`)
   - Analysis Status (`Completed successfully`)
5. **Analyzed Comments Feed**:
   - Cleaned text, predicted sentiment tag (`positive`, `negative`, `neutral`), and model confidence score.
   - Interactive sentiment filter (All, Positive, Neutral, Negative).

---

## 🛠️ Architecture & Tech Stack

- **Backend**:
  - FastAPI (Python 3.12)
  - Scikit-Learn (TF-IDF vectorization, MultinomialNB, LogisticRegression, LinearSVC, CalibratedClassifierCV)
  - Joblib (Model persistence)
  - HTTPX / Requests (Official YouTube Data API v3 and X API v2)
  - Python-dotenv (Secure environment configuration)
- **Frontend**:
  - React 19 + Vite 8
  - Tailwind CSS v4
  - Framer Motion (Transitions & animations)
  - Lucide React (Icons)
- **Dataset**:
  - 1,200 balanced social media sentiment samples (400 positive, 400 neutral, 400 negative).

---

## 🚀 Getting Started

### 1. Environment Setup

Create or verify `backend/.env`:
```env
PORT=8000
HOST=127.0.0.1
YOUTUBE_API_KEY=your_youtube_api_key_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
```

### 2. Backend Setup & Model Training

```bash
# Navigate to backend and install dependencies
cd backend
pip install -r requirements.txt

# Train and compare the 3 traditional ML models
python ml/trainer.py

# Start the FastAPI server
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
# Navigate to frontend and install dependencies
cd frontend
npm install

# Start Vite development server
npm run dev
```

The application will be live at `http://localhost:5173`.

### 4. Running Automated Tests

```bash
# Run the 14-point test suite
$env:PYTHONPATH="."
pytest -v tests/test_vibecheck_ml.py
```
