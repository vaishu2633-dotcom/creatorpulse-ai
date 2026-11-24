"""
CreatorPulse AI - VibeCheck AI Analysis Pipeline
------------------------------------------------
Analyzes audience sentiment of YouTube video comments using traditional
Machine Learning models (Multinomial Naive Bayes, Logistic Regression, Linear SVM, Random Forest).

Academic ML Principles:
1. Pure Traditional ML: Uses TF-IDF vectorization and classical scikit-learn classifiers.
   Zero deep learning, BERT, transformers, or LLMs.
2. Honest Evaluation: Sentiment percentages are computed directly from actual comment predictions.
3. Empty Content Handling: If no usable comments are available, no sentiment is fabricated.
4. Explainable Functions: Modular, readable helper functions designed for academic presentation.
"""

import re
from typing import List, Dict, Any, Tuple
from collections import Counter

from .base import AnalysisPayload, CommentItem
from backend.ml.classifier import classify_comments, get_model_metadata
from backend.ml.preprocessor import clean_text

# Regex patterns to detect promotional bots and spam comments
SPAM_PATTERNS = [
    r"(?i)\b(telegram|whatsapp|crypto|forex|invest|guaranteed return|dm me|in bio|100x|cash app|signal)\b",
    r"\+\d{10,14}",
    r"(?i)check out my (profile|channel|link|page)",
    r"(?i)free followers|cheap followers"
]

# Standard English stopwords excluded from topic keyword extraction
STOPWORDS = {
    "a", "about", "after", "again", "all", "also", "am", "an", "and", "any", "are",
    "as", "at", "be", "because", "been", "before", "being", "both", "but", "by",
    "can", "could", "did", "do", "does", "doing", "down", "for", "from", "had",
    "has", "have", "he", "her", "here", "him", "his", "how", "i", "if", "in",
    "into", "is", "it", "its", "just", "like", "me", "more", "my", "no", "not",
    "of", "off", "on", "once", "only", "or", "other", "our", "out", "over",
    "so", "some", "such", "than", "that", "the", "their", "them", "then", "there",
    "these", "they", "this", "those", "through", "to", "too", "under", "until",
    "up", "very", "was", "we", "were", "what", "when", "where", "which", "while",
    "who", "whom", "why", "will", "with", "would", "you", "your", "video", "post",
    "channel", "make", "really", "get", "one", "even", "much", "see", "think"
}


def detect_spam(text: str) -> Tuple[bool, str]:
    """
    Checks if a comment matches known spam or promotional bot patterns.
    Returns (is_spam, reason).
    """
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text):
            return True, "Promotional or bot phrase detected"
    return False, ""


def is_audience_question(text: str) -> bool:
    """
    Identifies whether a comment is an inquiry or question from the audience.
    """
    return bool(re.search(
        r"\?|^(how|why|what|when|where|can you|could you|is this|do you|which)\b",
        text,
        re.IGNORECASE
    ))


def extract_topics(classified_comments: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Extracts the most frequent topic keywords from comments and calculates
    the sentiment distribution for each keyword.
    """
    word_counts = Counter()
    for c in classified_comments:
        words = c.get("clean_text", "").split()
        for w in words:
            if len(w) > 3 and w not in STOPWORDS and not w.isdigit():
                word_counts[w] += 1

    top_words = word_counts.most_common(top_n)
    topics = []
    for word, count in top_words:
        matched = [c for c in classified_comments if word in c.get("clean_text", "")]
        pos = sum(1 for m in matched if m["sentiment"] == "positive")
        neu = sum(1 for m in matched if m["sentiment"] == "neutral")
        neg = sum(1 for m in matched if m["sentiment"] == "negative")
        total = max(1, len(matched))

        topics.append({
            "keyword": word.capitalize(),
            "count": count,
            "sentiment_distribution": {
                "positive": round((pos / total) * 100, 1),
                "neutral": round((neu / total) * 100, 1),
                "negative": round((neg / total) * 100, 1)
            }
        })
    return topics


def calculate_sentiment_percentages(pos_count: int, neu_count: int, neg_count: int, total: int) -> Dict[str, float]:
    """
    Computes exact sentiment percentages from class counts.
    Ensures percentages sum to 100.0%.
    """
    if total == 0:
        return {"positive_percentage": 0.0, "neutral_percentage": 0.0, "negative_percentage": 0.0}

    pos_pct = round((pos_count / total) * 100, 1)
    neg_pct = round((neg_count / total) * 100, 1)
    neu_pct = round(100.0 - pos_pct - neg_pct, 1)
    if neu_pct < 0:
        neu_pct = round((neu_count / total) * 100, 1)

    return {
        "positive_percentage": pos_pct,
        "negative_percentage": neg_pct,
        "neutral_percentage": neu_pct
    }


def determine_overall_vibe(pos_count: int, neu_count: int, neg_count: int) -> str:
    """
    Determines the overall audience reaction: 'Positive', 'Negative', or 'Neutral'.
    Uses majority voting among the predicted classes.
    """
    if pos_count > neg_count and pos_count >= neu_count:
        return "Positive"
    elif neg_count > pos_count and neg_count >= neu_count:
        return "Negative"
    else:
        return "Neutral"


def build_analysis_summary(
    overall_vibe: str,
    percentages: Dict[str, float],
    total_analyzed: int,
    topics: List[Dict[str, Any]],
    model_name: str
) -> str:
    """
    Builds a concise, student-friendly explanation of the sentiment results.
    """
    pos_pct = percentages["positive_percentage"]
    neg_pct = percentages["negative_percentage"]
    neu_pct = percentages["neutral_percentage"]

    if overall_vibe == "Positive":
        tone_desc = f"predominantly Positive ({pos_pct}% positive feedback). Viewers responded enthusiastically with minimal criticism ({neg_pct}%)."
    elif overall_vibe == "Negative":
        tone_desc = f"predominantly Negative ({neg_pct}% negative feedback). Viewers expressed notable concern, disappointment, or constructive critiques."
    else:
        tone_desc = f"predominantly Neutral/Balanced ({neu_pct}% neutral, {pos_pct}% positive, {neg_pct}% negative). Audience reactions were informative and mixed."

    topic_str = f" Key discussion themes included {', '.join([t['keyword'] for t in topics[:3]])}." if topics else ""
    return f"Audience reaction for this content is {tone_desc}{topic_str} Analyzed {total_analyzed} text samples using {model_name}."


class VibeAnalyzer:
    """
    Core ML Sentiment Analysis Engine.
    Coordinates text preprocessing, batch ML classification, metric computation,
    and report generation.
    """

    @staticmethod
    def get_selected_model_name() -> str:
        """Returns the winning ML model name from saved training benchmarks."""
        meta = get_model_metadata()
        return meta.get("best_model", "Multinomial Naive Bayes")

    @staticmethod
    def _detect_spam(text: str) -> Tuple[bool, str]:
        """Backward-compatible helper method for spam detection."""
        return detect_spam(text)

    @staticmethod
    def _extract_topics(classified_comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Backward-compatible helper method for topic extraction."""
        return extract_topics(classified_comments)

    @staticmethod
    def analyze(payload: AnalysisPayload) -> Dict[str, Any]:
        """
        Runs the full sentiment analysis pipeline:
        1. Validates that comments exist (handles empty state).
        2. Applies TF-IDF vectorization and best ML model prediction.
        3. Tallies Positive, Negative, and Neutral comments.
        4. Calculates exact percentages and determines Overall Vibe.
        5. Extracts key topics, questions, and flags spam.
        """
        # =====================================================================
        # 8-STEP SENTIMENT ANALYSIS WORKFLOW (ACADEMIC ML PIPELINE)
        # =====================================================================

        # Step 1: Get comments from payload (YouTube comments or pasted comments)
        comments = payload.comments or []
        selected_model = VibeAnalyzer.get_selected_model_name()

        # Handle empty content case: never predict sentiment on empty text
        if not comments:
            return VibeAnalyzer._empty_analysis(payload, selected_model)

        raw_texts = [c.text for c in comments]

        # Step 2, 3, 4, 5: Clean comments, convert with TF-IDF, load model, predict sentiment
        # (Executed in classify_comments: clean_text -> TF-IDF transform -> model.predict)
        ml_classifications = classify_comments(raw_texts)

        analyzed_comments = []
        spam_comments = []
        questions = []
        pos_count = 0
        neu_count = 0
        neg_count = 0

        for idx, (c, ml_res) in enumerate(zip(comments, ml_classifications)):
            sentiment = ml_res["sentiment"].lower()
            confidence = ml_res["confidence"]
            cleaned = ml_res["clean_text"]

            # Step 6: Count occurrences of each sentiment (Positive, Negative, Neutral)
            if sentiment == "positive":
                pos_count += 1
            elif sentiment == "negative":
                neg_count += 1
            else:
                sentiment = "neutral"
                neu_count += 1

            # Spam & bot check
            is_spam, spam_reason = detect_spam(c.text)
            if is_spam:
                spam_comments.append({
                    "comment_id": c.comment_id,
                    "author": c.author,
                    "text": c.text,
                    "reason": spam_reason
                })

            # Audience question check
            is_q = is_audience_question(c.text)
            if is_q and not is_spam:
                questions.append({
                    "author": c.author,
                    "text": c.text,
                    "like_count": c.like_count
                })

            analyzed_comments.append({
                "comment_id": c.comment_id or f"c_{idx+1}",
                "author": c.author or f"User #{idx+1}",
                "text": c.text,
                "clean_text": cleaned,
                "like_count": c.like_count,
                "published_at": c.published_at,
                "sentiment": sentiment,
                "confidence": confidence,
                "is_question": is_q,
                "is_spam": is_spam
            })

        total_analyzed = len(analyzed_comments)

        # Step 7: Calculate exact sentiment percentages (sum to 100%)
        percentages = calculate_sentiment_percentages(pos_count, neu_count, neg_count, total_analyzed)

        # Determine dominant audience vibe (Positive, Negative, or Neutral)
        overall_vibe = determine_overall_vibe(pos_count, neu_count, neg_count)

        # Extract top keywords and themes from analyzed comments
        topics = extract_topics(analyzed_comments)

        # Generate summary description for presentation
        analysis_summary = build_analysis_summary(
            overall_vibe, percentages, total_analyzed, topics, selected_model
        )

        # Step 8: Assemble final result dictionary to return to the frontend
        return {
            "metadata": {
                "platform": payload.platform,
                "title": payload.title or "Untitled Post",
                "author": payload.author or "Unknown Creator",
                "post_url": payload.post_url,
                "thumbnail_url": payload.thumbnail_url,
                "published_at": payload.published_at,
                "caption": payload.caption,
                "view_count": payload.view_count,
                "like_count": payload.like_count,
                "comment_count": payload.comment_count,
                "comments_analyzed": total_analyzed,
                "data_source": payload.coverage.source_type if payload.coverage else "url",
                "analyzed_at": getattr(payload, "analyzed_at", None)
            },
            "coverage": payload.coverage.model_dump() if payload.coverage else {},
            "vibecheck_results": {
                "has_prediction": True,
                "overall_vibe": overall_vibe,
                "sentiment_distribution": percentages,
                "counts": {
                    "positive": pos_count,
                    "negative": neg_count,
                    "neutral": neu_count,
                    "total": total_analyzed
                },
                "analysis_summary": analysis_summary,
                "analysis_information": {
                    "platform": "YouTube",
                    "url": payload.post_url,
                    "samples_analyzed": total_analyzed,
                    "selected_ml_model": selected_model,
                    "analysis_status": "Completed successfully"
                }
            },
            "topics": topics,
            "questions": questions,
            "spam_comments": spam_comments,
            "comments": analyzed_comments
        }

    @staticmethod
    def _empty_analysis(payload: AnalysisPayload, selected_model: str) -> Dict[str, Any]:
        """
        Returns structured empty payload when no comments are available.
        Ensures has_prediction is False and no sentiment is displayed.
        """
        notice = payload.coverage.notice if payload.coverage else "No audience comments could be retrieved."
        return {
            "metadata": {
                "platform": payload.platform,
                "title": payload.title or "Untitled Post",
                "author": payload.author or "Unknown Creator",
                "post_url": payload.post_url,
                "thumbnail_url": payload.thumbnail_url,
                "published_at": payload.published_at,
                "caption": payload.caption,
                "view_count": payload.view_count,
                "like_count": payload.like_count,
                "comment_count": 0,
                "comments_analyzed": 0,
                "data_source": payload.coverage.source_type if payload.coverage else "url"
            },
            "coverage": payload.coverage.model_dump() if payload.coverage else {},
            "vibecheck_results": {
                "has_prediction": False,
                "overall_vibe": None,
                "sentiment_distribution": None,
                "counts": {
                    "positive": 0,
                    "negative": 0,
                    "neutral": 0,
                    "total": 0
                },
                "analysis_summary": "No usable text was retrieved for sentiment analysis. " + notice,
                "analysis_information": {
                    "platform": "YouTube",
                    "url": payload.post_url,
                    "samples_analyzed": 0,
                    "selected_ml_model": selected_model,
                    "analysis_status": "No usable comments retrieved"
                }
            },
            "topics": [],
            "questions": [],
            "spam_comments": [],
            "comments": []
        }
