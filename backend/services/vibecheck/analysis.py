"""
VibeCheck AI - Analysis Pipeline
--------------------------------
Provides:
- VADER sentiment analysis with sarcasm disclaimer
- 8-category Vibe classification
- Topic clustering and theme extraction
- Spam & bot detection
- Engagement metrics & insights
- Evidence-backed recommendations strictly citing actual comment counts
"""

import os
import re
from typing import List, Dict, Any, Tuple
from collections import Counter
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .base import AnalysisPayload, CommentItem

# Initialize VADER analyzer once
analyzer = SentimentIntensityAnalyzer()
_xlm_roberta_pipeline = None
_xlm_roberta_attempted = False

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through",
    "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
    "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who",
    "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
    "you're", "you've", "your", "yours", "yourself", "yourselves", "video", "content", "post", "channel"
}

SPAM_PATTERNS = [
    r"(?i)\b(telegram|whatsapp|crypto|forex|invest|guaranteed return|dm me|in bio|100x|cash app|signal)\b",
    r"\+\d{10,14}",
    r"(?i)check out my (profile|channel|link|page)",
    r"(?i)free followers|cheap followers"
]


class VibeAnalyzer:
    """Core analysis engine for CreatorPulse VibeCheck AI."""

    @staticmethod
    def get_sentiment_engine() -> Tuple[str, str, bool]:
        """
        Multilingual sentiment engine resolver.
        Checks for XLM-RoBERTa availability; falls back cleanly to VADER.
        """
        global _xlm_roberta_pipeline, _xlm_roberta_attempted
        use_transformer = os.getenv("USE_TRANSFORMER_SENTIMENT", "false").lower() in ("true", "1")
        if use_transformer and not _xlm_roberta_attempted:
            _xlm_roberta_attempted = True
            try:
                from transformers import pipeline
                _xlm_roberta_pipeline = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
                    max_length=512,
                    truncation=True
                )
            except Exception:
                _xlm_roberta_pipeline = None

        if _xlm_roberta_pipeline:
            return "XLM-RoBERTa (Multilingual)", "Multilingual sentiment active across 100+ languages via XLM-RoBERTa.", True
        else:
            return "VADER (Rule-based)", "Sentiment works best for English comments", False

    @staticmethod
    def _score_sentiment(text: str) -> Tuple[float, str]:
        """
        Classifies sentiment using XLM-RoBERTa transformer if active,
        or falls back cleanly to VADER polarity analyzer.
        Returns: (compound_score [-1.0, 1.0], sentiment_label ['positive', 'neutral', 'negative'])
        """
        global _xlm_roberta_pipeline
        if _xlm_roberta_pipeline is not None:
            try:
                clean_text = text[:512]
                res = _xlm_roberta_pipeline(clean_text)
                if res and isinstance(res, list) and len(res) > 0:
                    item = res[0]
                    raw_label = str(item.get("label", "")).lower()
                    conf = float(item.get("score", 0.5))

                    if "pos" in raw_label or raw_label == "label_2":
                        label = "positive"
                        compound = round(conf * 0.85, 3)
                    elif "neg" in raw_label or raw_label == "label_0":
                        label = "negative"
                        compound = round(-conf * 0.85, 3)
                    else:
                        label = "neutral"
                        compound = 0.0

                    return compound, label
            except Exception:
                # Transparent fallback to VADER on any pipeline runtime error
                pass

        # VADER rule-based fallback
        vs = analyzer.polarity_scores(text)
        compound = round(float(vs["compound"]), 3)
        if compound >= 0.15:
            label = "positive"
        elif compound <= -0.15:
            label = "negative"
        else:
            label = "neutral"

        return compound, label

    @staticmethod
    def analyze(payload: AnalysisPayload) -> Dict[str, Any]:
        comments = payload.comments
        total_comments = len(comments)

        model_name, model_notice, is_multilingual = VibeAnalyzer.get_sentiment_engine()

        if total_comments == 0:
            return VibeAnalyzer._empty_analysis(payload, model_name, model_notice, is_multilingual)

        # 1. Analyze Each Comment (Sentiment, Vibe, Spam check)
        analyzed_comments = []
        sentiment_scores = []
        vibes_counter = Counter()
        spam_comments = []
        questions = []
        total_words = 0

        for c in comments:
            text = c.text
            words = text.split()
            total_words += len(words)

            # Sentiment Scoring (Transformer when active, otherwise VADER)
            compound, sentiment_label = VibeAnalyzer._score_sentiment(text)
            sentiment_scores.append(compound)

            # Spam Detection
            is_spam, spam_reason = VibeAnalyzer._detect_spam(text)
            if is_spam:
                spam_comments.append({
                    "comment_id": c.comment_id,
                    "author": c.author,
                    "text": text,
                    "reason": spam_reason
                })

            # Detect Question
            is_question = bool(re.search(r"\?|^(how|why|what|when|where|can you|could you|is this|do you)\b", text, re.IGNORECASE))
            if is_question and not is_spam:
                questions.append({
                    "author": c.author,
                    "text": text,
                    "likes": c.like_count
                })

            # Detect Vibe
            vibe, vibe_conf = VibeAnalyzer._classify_vibe(text, compound, is_question)
            vibes_counter[vibe] += 1

            analyzed_comments.append({
                "comment_id": c.comment_id,
                "author": c.author,
                "text": text,
                "like_count": c.like_count,
                "published_at": c.published_at,
                "sentiment": sentiment_label,
                "compound_score": round(compound, 3),
                "vibe": vibe,
                "vibe_confidence": vibe_conf,
                "is_question": is_question,
                "is_spam": is_spam
            })

        # 2. Overall Sentiment Metrics
        pos_count = sum(1 for c in analyzed_comments if c["sentiment"] == "positive")
        neu_count = sum(1 for c in analyzed_comments if c["sentiment"] == "neutral")
        neg_count = sum(1 for c in analyzed_comments if c["sentiment"] == "negative")

        avg_compound = sum(sentiment_scores) / total_comments
        vibe_score = round(max(0, min(100, (avg_compound + 1.0) / 2.0 * 100)), 1)

        # 3. 8-Category Vibe Breakdown
        vibe_categories = [
            "Enthusiastic",
            "Curious & Inquiring",
            "Supportive & Wholesome",
            "Humorous & Memeing",
            "Neutral & Informative",
            "Critical & Skeptical",
            "Confused & Puzzled",
            "Frustrated & Annoyed"
        ]

        vibe_breakdown = [
            {
                "vibe": cat,
                "count": vibes_counter[cat],
                "percentage": round(vibes_counter[cat] / total_comments * 100, 1)
            }
            for cat in vibe_categories
        ]
        # Sort by count descending
        vibe_breakdown.sort(key=lambda x: x["count"], reverse=True)
        dominant_vibe = vibe_breakdown[0]["vibe"] if vibe_breakdown else "Neutral & Informative"

        # 4. Topic Clustering / Keywords
        topics = VibeAnalyzer._extract_topics(analyzed_comments)

        # 5. Evidence-Backed Actionable Recommendations citing exact numbers
        recommendations = VibeAnalyzer._build_recommendations(
            total_comments=total_comments,
            dominant_vibe=dominant_vibe,
            questions=questions,
            spam_comments=spam_comments,
            neg_count=neg_count,
            topics=topics,
            analyzed_comments=analyzed_comments
        )

        # 6. Content Summary
        summary = VibeAnalyzer._synthesize_summary(
            payload=payload,
            dominant_vibe=dominant_vibe,
            vibe_score=vibe_score,
            pos_count=pos_count,
            neg_count=neg_count,
            total_comments=total_comments,
            topics=topics
        )

        # Top engaged comments
        top_engaged = sorted(analyzed_comments, key=lambda x: x["like_count"], reverse=True)[:5]

        return {
            "metadata": {
                "platform": payload.platform,
                "title": payload.title or "Untitled Post",
                "author": payload.author or "Unknown Creator",
                "post_url": payload.post_url,
                "thumbnail_url": payload.thumbnail_url,
                "published_at": payload.published_at,
                "caption": payload.caption,
                "transcript": payload.transcript,
                "view_count": payload.view_count,
                "like_count": payload.like_count,
                "comment_count": payload.comment_count or total_comments
            },
            "coverage": payload.coverage.model_dump(),
            "sentiment": {
                "vibe_score": vibe_score,
                "dominant_vibe": dominant_vibe,
                "average_compound": round(avg_compound, 3),
                "model_used": model_name,
                "model_notice": model_notice,
                "is_multilingual": is_multilingual,
                "breakdown": {
                    "positive": round(pos_count / total_comments * 100, 1),
                    "neutral": round(neu_count / total_comments * 100, 1),
                    "negative": round(neg_count / total_comments * 100, 1)
                },
                "counts": {
                    "positive": pos_count,
                    "neutral": neu_count,
                    "negative": neg_count,
                    "total": total_comments
                },
                "sarcasm_disclaimer": "Automated sentiment cannot reliably detect heavy sarcasm, irony, or inside jokes without creator context."
            },
            "vibes": vibe_breakdown,
            "topics": topics,
            "questions": questions[:10],
            "engagement": {
                "total_comments": total_comments,
                "question_count": len(questions),
                "question_rate": round(len(questions) / total_comments * 100, 1),
                "average_word_length": round(total_words / total_comments, 1),
                "spam_count": len(spam_comments),
                "spam_rate": round(len(spam_comments) / total_comments * 100, 1),
                "top_engaged_comments": top_engaged
            },
            "spam_detection": {
                "flagged_count": len(spam_comments),
                "spam_percentage": round(len(spam_comments) / total_comments * 100, 1),
                "items": spam_comments
            },
            "summary": summary,
            "recommendations": recommendations,
            "comments": analyzed_comments
        }

    @staticmethod
    def _classify_vibe(text: str, compound: float, is_question: bool) -> Tuple[str, float]:
        text_lower = text.lower()

        # Check Humorous / Memeing
        if any(w in text_lower for w in ["lmao", "lol", "haha", "dead 😂", "skull", "funny", "crying 😭", "rofl", "died"]):
            return "Humorous & Memeing", 0.88

        # Check Frustrated & Annoyed
        if any(w in text_lower for w in ["clickbait", "waste of time", "annoying", "desync", "audio issue", "terrible", "worst", "unsubscribed", "hate"]):
            return "Frustrated & Annoyed", 0.85

        # Check Confused & Puzzled
        if any(w in text_lower for w in ["huh", "wait what", "confused", "don't get it", "what happened", "lost me", "makes no sense"]):
            return "Confused & Puzzled", 0.82

        # Check Curious & Inquiring
        if is_question or any(w in text_lower for w in ["tutorial", "how do you", "which mic", "what software", "can you", "could you", "where can i"]):
            return "Curious & Inquiring", 0.90

        # Check Critical & Skeptical
        if any(w in text_lower for w in ["disagree", "cap", "fake", "misleading", "overhyped", "doubt", "contrast issues", "skeptical"]) or compound <= -0.35:
            return "Critical & Skeptical", 0.80

        # Check Enthusiastic
        if compound >= 0.55 or any(w in text_lower for w in ["amazing", "goat", "masterclass", "perfection", "obsessed", "brilliant", "10/10", "fire 🔥"]):
            return "Enthusiastic", 0.87

        # Check Supportive & Wholesome
        if compound >= 0.20 or any(w in text_lower for w in ["proud", "wholesome", "thanks", "helpful", "saving this", "inspiring", "keep going", "needed this"]):
            return "Supportive & Wholesome", 0.84

        return "Neutral & Informative", 0.75

    @staticmethod
    def _detect_spam(text: str) -> Tuple[bool, str]:
        for pattern in SPAM_PATTERNS:
            if re.search(pattern, text):
                return True, "Promotional or financial bot keyword pattern detected"
        # Check emoji flood
        emojis = re.findall(r"[\U00010000-\U0010ffff]", text)
        if len(emojis) > 6 and len(text) < 40:
            return True, "Repetitive emoji spam sequence"
        return False, ""

    @staticmethod
    def _extract_topics(analyzed_comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Count non-stopword tokens
        word_freq = Counter()
        topic_comments = {}

        for c in analyzed_comments:
            if c.get("is_spam"):
                continue
            words = re.findall(r"[a-zA-Z]{3,}", c["text"].lower())
            seen_in_comment = set()
            for w in words:
                if w not in STOPWORDS and w not in seen_in_comment:
                    seen_in_comment.add(w)
                    word_freq[w] += 1
                    if w not in topic_comments:
                        topic_comments[w] = []
                    topic_comments[w].append(c)

        top_words = word_freq.most_common(6)
        topics = []
        for word, count in top_words:
            matched_comments = topic_comments.get(word, [])
            pos = sum(1 for mc in matched_comments if mc["sentiment"] == "positive")
            neg = sum(1 for mc in matched_comments if mc["sentiment"] == "negative")
            neu = len(matched_comments) - (pos + neg)

            topics.append({
                "keyword": word.capitalize(),
                "mention_count": count,
                "sentiment_distribution": {
                    "positive": round(pos / max(1, len(matched_comments)) * 100, 1),
                    "neutral": round(neu / max(1, len(matched_comments)) * 100, 1),
                    "negative": round(neg / max(1, len(matched_comments)) * 100, 1)
                },
                "sample_quotes": [mc["text"] for mc in matched_comments[:3]]
            })

        return topics

    @staticmethod
    def _build_recommendations(
        total_comments: int,
        dominant_vibe: str,
        questions: List[Dict[str, Any]],
        spam_comments: List[Dict[str, Any]],
        neg_count: int,
        topics: List[Dict[str, Any]],
        analyzed_comments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        recs = []

        # 1. Questions recommendation
        q_count = len(questions)
        if q_count > 0:
            top_q = questions[0]["text"]
            recs.append({
                "type": "content_opportunity",
                "title": f"Turn {q_count} Viewer Questions Into Your Next Short or Reel",
                "evidence": f"{q_count} of {total_comments} comments ({round(q_count/total_comments*100, 1)}%) directly asked questions (e.g., \"{top_q[:80]}...\").",
                "action": "Record a quick 45-second follow-up video answering the most frequently asked questions. This taps directly into proven audience curiosity."
            })

        # 2. Dominant Vibe recommendation
        recs.append({
            "type": "tone_tuning",
            "title": f"Reinforce Your Strong \"{dominant_vibe}\" Audience Resonance",
            "evidence": f"The dominant sentiment cluster is \"{dominant_vibe}\", showing audience emotional buy-in.",
            "action": "Maintain this pacing, visual tone, and conversational angle in your upcoming releases."
        })

        # 3. Topic focus
        if topics:
            top_t = topics[0]
            recs.append({
                "type": "topic_expansion",
                "title": f"Double Down on \"{top_t['keyword']}\"",
                "evidence": f"\"{top_t['keyword']}\" was mentioned in {top_t['mention_count']} comments with {top_t['sentiment_distribution']['positive']}% positive feedback.",
                "action": f"Expand \"{top_t['keyword']}\" into a dedicated deep-dive post or carousel."
            })

        # 4. Critical / spam moderation
        if spam_comments:
            recs.append({
                "type": "community_hygiene",
                "title": f"Moderate {len(spam_comments)} Detected Promotional Spam Comments",
                "evidence": f"{len(spam_comments)} comments ({round(len(spam_comments)/total_comments*100, 1)}%) matched crypto, WhatsApp, or referral spam patterns.",
                "action": "Add keywords like 'WhatsApp', 'telegram', and 'crypto' to your platform's blocked words filter."
            })

        if neg_count > 0 and not spam_comments:
            crit_comments = [c for c in analyzed_comments if c["sentiment"] == "negative"]
            sample_crit = crit_comments[0]["text"] if crit_comments else "Feedback noted"
            recs.append({
                "type": "production_refinement",
                "title": f"Address Constructive Critique from {neg_count} Viewers",
                "evidence": f"{neg_count} comment(s) highlighted specific critique or production notes (e.g., \"{sample_crit[:75]}...\").",
                "action": "Review pacing and technical quality points raised by viewers before publishing your next edit."
            })

        return recs

    @staticmethod
    def _synthesize_summary(
        payload: AnalysisPayload,
        dominant_vibe: str,
        vibe_score: float,
        pos_count: int,
        neg_count: int,
        total_comments: int,
        topics: List[Dict[str, Any]]
    ) -> str:
        topic_str = ", ".join([t["keyword"] for t in topics[:3]]) if topics else "general engagement"
        pct_pos = round(pos_count / total_comments * 100, 1)

        tone_assessment = "overwhelmingly positive" if pct_pos >= 70 else ("balanced" if pct_pos >= 40 else "mixed")
        return (
            f"Audience response is {tone_assessment} with a Vibe Score of {vibe_score}/100. "
            f"The dominant reaction vibe is \"{dominant_vibe}\" ({pct_pos}% positive comments across {total_comments} analyzed). "
            f"Key discussion drivers centered around {topic_str}."
        )

    @staticmethod
    def _empty_analysis(
        payload: AnalysisPayload,
        model_name: str = "VADER (Rule-based)",
        model_notice: str = "Sentiment works best for English comments",
        is_multilingual: bool = False
    ) -> Dict[str, Any]:
        return {
            "metadata": {
                "platform": payload.platform,
                "title": payload.title or "Untitled Post",
                "author": payload.author or "Unknown Creator",
                "post_url": payload.post_url,
                "thumbnail_url": payload.thumbnail_url,
                "published_at": payload.published_at,
                "caption": payload.caption,
                "transcript": payload.transcript,
                "view_count": payload.view_count,
                "like_count": payload.like_count,
                "comment_count": 0
            },
            "coverage": payload.coverage.model_dump(),
            "sentiment": {
                "vibe_score": 50.0,
                "dominant_vibe": "Neutral & Informative",
                "average_compound": 0.0,
                "model_used": model_name,
                "model_notice": model_notice,
                "is_multilingual": is_multilingual,
                "breakdown": {"positive": 0.0, "neutral": 100.0, "negative": 0.0},
                "counts": {"positive": 0, "neutral": 0, "negative": 0, "total": 0},
                "sarcasm_disclaimer": "Automated sentiment cannot reliably detect heavy sarcasm, irony, or inside jokes without creator context."
            },
            "vibes": [],
            "topics": [],
            "questions": [],
            "engagement": {
                "total_comments": 0,
                "question_count": 0,
                "question_rate": 0.0,
                "average_word_length": 0.0,
                "spam_count": 0,
                "spam_rate": 0.0,
                "top_engaged_comments": []
            },
            "spam_detection": {"flagged_count": 0, "spam_percentage": 0.0, "items": []},
            "summary": "No comments available to analyze. Paste comments or import a transcript to view audience vibes.",
            "recommendations": [],
            "comments": []
        }
