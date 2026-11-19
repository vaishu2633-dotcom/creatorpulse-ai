"""
CreatorPulse AI - VibeCheck AI Analysis Pipeline
------------------------------------------------
Analyzes audience sentiment of YouTube video comments
using traditional Machine Learning algorithms (TF-IDF + Best ML Model).

Strictly adheres to academic Machine Learning principles:
- No LLM-based sentiment prediction
- No Generative AI or Deep Learning / neural networks
- Transparent, truthful evaluation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)
- Actual sentiment distribution percentages calculated directly from ML predictions
- If no usable text is retrieved, does not display a sentiment prediction.
"""

import os
import re
from typing import List, Dict, Any, Tuple
from collections import Counter

from .base import AnalysisPayload, CommentItem
from backend.ml.classifier import classify_comments, get_model_metadata
from backend.ml.preprocessor import clean_text

SPAM_PATTERNS = [
    r"(?i)\b(telegram|whatsapp|crypto|forex|invest|guaranteed return|dm me|in bio|100x|cash app|signal)\b",
    r"\+\d{10,14}",
    r"(?i)check out my (profile|channel|link|page)",
    r"(?i)free followers|cheap followers"
]


class VibeAnalyzer:
    """Core ML sentiment analysis engine for CreatorPulse VibeCheck AI."""

    @staticmethod
    def get_selected_model_name() -> str:
        """Returns the name of the winning traditional ML model from training evaluation."""
        meta = get_model_metadata()
        return meta.get("best_model", "Multinomial Naive Bayes")

    @staticmethod
    def _detect_spam(text: str) -> Tuple[bool, str]:
        """Flags promotional spam or bots using regex pattern rules."""
        for pattern in SPAM_PATTERNS:
            if re.search(pattern, text):
                return True, "Promotional or bot phrase detected"
        return False, ""

    @staticmethod
    def _extract_topics(classified_comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extracts high-frequency keywords mentioned in comments."""
        stopwords = {
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
        word_counts = Counter()
        for c in classified_comments:
            words = c.get("clean_text", "").split()
            for w in words:
                if len(w) > 3 and w not in stopwords and not w.isdigit():
                    word_counts[w] += 1

        top_words = word_counts.most_common(5)
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

    @staticmethod
    def analyze(payload: AnalysisPayload) -> Dict[str, Any]:
        """
        Runs full sentiment analysis pipeline using traditional ML algorithms:
        1. Preprocesses text samples.
        2. Feeds processed text to trained ML model (MultinomialNB / LinearSVC / LogisticRegression).
        3. Computes positive, neutral, negative counts and percentages.
        4. Determines Overall Vibe.
        5. Generates Analysis Summary and metadata.
        """
        comments = payload.comments or []
        model_meta = get_model_metadata()
        selected_model = model_meta.get("best_model", "Multinomial Naive Bayes")

        # Handle empty content case: If no usable text is retrieved, do not display a sentiment prediction
        if not comments:
            return VibeAnalyzer._empty_analysis(payload, selected_model)

        raw_texts = [c.text for c in comments]

        # Machine Learning batch classification (TF-IDF + Best ML model)
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

            if sentiment == "positive":
                pos_count += 1
            elif sentiment == "negative":
                neg_count += 1
            else:
                sentiment = "neutral"
                neu_count += 1

            is_spam, spam_reason = VibeAnalyzer._detect_spam(c.text)
            if is_spam:
                spam_comments.append({
                    "comment_id": c.comment_id,
                    "author": c.author,
                    "text": c.text,
                    "reason": spam_reason
                })

            is_question = bool(re.search(
                r"\?|^(how|why|what|when|where|can you|could you|is this|do you|which)\b",
                c.text,
                re.IGNORECASE
            ))
            if is_question and not is_spam:
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
                "is_question": is_question,
                "is_spam": is_spam
            })

        total_analyzed = len(analyzed_comments)

        # Calculate exact percentages from actual predictions
        pos_pct = round((pos_count / total_analyzed) * 100, 1)
        neg_pct = round((neg_count / total_analyzed) * 100, 1)
        # Ensure percentages sum nicely to 100
        neu_pct = round(100.0 - pos_pct - neg_pct, 1)
        if neu_pct < 0:
            neu_pct = round((neu_count / total_analyzed) * 100, 1)

        # Determine Overall Vibe: Positive, Negative, or Neutral
        if pos_count > neg_count and pos_count >= neu_count:
            overall_vibe = "Positive"
        elif neg_count > pos_count and neg_count >= neu_count:
            overall_vibe = "Negative"
        else:
            overall_vibe = "Neutral"

        # Topic Extraction
        topics = VibeAnalyzer._extract_topics(analyzed_comments)

        # Analysis Summary
        if overall_vibe == "Positive":
            tone_desc = f"predominantly Positive ({pos_pct}% positive feedback). Viewers responded enthusiastically with minimal criticism ({neg_pct}%)."
        elif overall_vibe == "Negative":
            tone_desc = f"predominantly Negative ({neg_pct}% negative feedback). Viewers expressed notable concern, disappointment, or constructive critiques."
        else:
            tone_desc = f"predominantly Neutral/Balanced ({neu_pct}% neutral, {pos_pct}% positive, {neg_pct}% negative). Audience reactions were informative and mixed."

        topic_str = f" Key discussion themes included {', '.join([t['keyword'] for t in topics[:3]])}." if topics else ""
        analysis_summary = f"Audience reaction for this content is {tone_desc}{topic_str} Analyzed {total_analyzed} text samples using {selected_model}."

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
                "sentiment_distribution": {
                    "positive_percentage": pos_pct,
                    "negative_percentage": neg_pct,
                    "neutral_percentage": neu_pct
                },
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
        Returns structured payload when no usable text could be retrieved.
        Adheres to requirement: 'If no usable text is retrieved, do not display a sentiment prediction.'
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
