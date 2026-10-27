"""
VibeCheck AI - Manual & Fallback Input Adapter
----------------------------------------------
Allows creators to analyze:
1. Pasted comments (newline-separated or "Author: text")
2. Video/Audio Transcripts (plain text or SRT subtitle files)
3. Uploaded Comment CSV text
4. Provides guidance for running local, private Whisper audio transcription.
"""

import re
import csv
import io
from typing import Dict, Any, List
from .base import PlatformAdapter, AnalysisPayload, CommentItem, CoverageReport


class ManualAdapter(PlatformAdapter):
    """Adapter for user-provided comments, transcripts, or CSV uploads."""

    def can_handle(self, target: str) -> bool:
        # Handles non-URL inputs or explicitly tagged manual modes
        return True

    def fetch_data(self, input_payload: Dict[str, Any]) -> AnalysisPayload:
        input_type = (input_payload.get("input_type") or "pasted_comments").strip().lower()
        raw_text = (input_payload.get("raw_text") or "").strip()
        platform = (input_payload.get("platform") or "general").strip().lower()
        title = (input_payload.get("title") or "").strip() or "Audience & Content Analysis"
        author = (input_payload.get("author") or "").strip() or "Creator"

        comments: List[CommentItem] = []
        transcript_clean = None
        has_transcript = False

        if input_type == "transcript":
            has_transcript = True
            transcript_clean = self._parse_transcript_or_srt(raw_text)
            # Break transcript into sentences or paragraphs as comment-like segments for sentiment tracking
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', transcript_clean) if len(s.strip()) > 10]
            for idx, s in enumerate(sentences):
                comments.append(
                    CommentItem(
                        comment_id=f"seg_{idx + 1}",
                        author=f"Segment #{idx + 1}",
                        text=s,
                        like_count=0
                    )
                )
            notice = f"Extracted {len(comments)} content segments from uploaded transcript ({len(transcript_clean.split())} total words)."

        elif input_type == "csv_text":
            comments = self._parse_csv_comments(raw_text)
            notice = f"Successfully parsed {len(comments)} user comments from CSV data."

        else:  # "pasted_comments"
            comments = self._parse_pasted_comments(raw_text)
            notice = f"Successfully parsed {len(comments)} user-pasted comments."

        coverage = CoverageReport(
            has_metadata=True,
            has_caption=False,
            has_transcript=has_transcript,
            comments_fetched=len(comments),
            comments_available=len(comments),
            notice=notice,
            source_type=input_type,
            is_sample_data=False  # Real user provided data!
        )

        return AnalysisPayload(
            platform=platform,
            post_url=None,
            title=title,
            author=author,
            thumbnail_url=None,
            caption=None,
            transcript=transcript_clean,
            view_count=None,
            like_count=None,
            comment_count=len(comments),
            comments=comments,
            coverage=coverage
        )

    def _parse_pasted_comments(self, text: str) -> List[CommentItem]:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        items: List[CommentItem] = []

        for idx, line in enumerate(lines):
            # Check for patterns like "Username: comment text" or "@user - comment text"
            match = re.match(r"^@?([a-zA-Z0-9_.\s]{2,25})[:\-]\s*(.+)$", line)
            if match:
                author_name = match.group(1).strip()
                comment_body = match.group(2).strip()
            else:
                author_name = f"Audience #{idx + 1}"
                comment_body = line

            items.append(
                CommentItem(
                    comment_id=f"pasted_{idx + 1}",
                    author=author_name,
                    text=comment_body,
                    like_count=0
                )
            )
        return items

    def _parse_transcript_or_srt(self, text: str) -> str:
        # Strip SRT timestamp blocks:
        # 1
        # 00:00:01,000 --> 00:00:04,000
        # Subtitle text
        cleaned = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
        cleaned = re.sub(r'^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*$', '', cleaned, flags=re.MULTILINE)
        # Collapse extra whitespace
        cleaned = re.sub(r'\n+', ' ', cleaned)
        return cleaned.strip()

    def _parse_csv_comments(self, csv_str: str) -> List[CommentItem]:
        items: List[CommentItem] = []
        try:
            reader = csv.DictReader(io.StringIO(csv_str))
            fieldnames = [f.lower().strip() for f in (reader.fieldnames or [])]
            # Find best candidate for comment text
            text_candidates = ["comment", "text", "body", "content", "comment_text", "message"]
            author_candidates = ["author", "username", "user", "author_name", "creator"]
            likes_candidates = ["likes", "like_count", "reactions", "thumbs_up"]

            text_col = next((f for f in (reader.fieldnames or []) if f.lower().strip() in text_candidates), None)
            author_col = next((f for f in (reader.fieldnames or []) if f.lower().strip() in author_candidates), None)
            likes_col = next((f for f in (reader.fieldnames or []) if f.lower().strip() in likes_candidates), None)

            if not text_col and reader.fieldnames:
                text_col = reader.fieldnames[0]

            for idx, row in enumerate(reader):
                val = row.get(text_col, "").strip() if text_col else ""
                if not val:
                    continue
                author = row.get(author_col, "").strip() if author_col else f"Commenter #{idx + 1}"
                likes = 0
                if likes_col and row.get(likes_col):
                    try:
                        likes = int(float(row[likes_col]))
                    except (ValueError, TypeError):
                        likes = 0

                items.append(
                    CommentItem(
                        comment_id=f"csv_{idx + 1}",
                        author=author or f"Commenter #{idx + 1}",
                        text=val,
                        like_count=likes
                    )
                )
        except Exception:
            # Fallback to line split if CSV parsing fails
            return self._parse_pasted_comments(csv_str)

        return items

    @staticmethod
    def get_whisper_instructions() -> Dict[str, Any]:
        """Provides local, free, private speech-to-text instructions using Whisper."""
        return {
            "title": "Local Audio Transcription (100% Free & Private)",
            "description": "Transcribe any video or audio file directly on your computer without uploading private recordings to cloud servers.",
            "steps": [
                "1. Install OpenAI Whisper: pip install openai-whisper",
                "2. Transcribe your audio or video file: whisper my_video.mp4 --model base --output_format txt",
                "3. Open the resulting .txt or .srt file and paste its contents into VibeCheck's 'Transcript' tab."
            ],
            "command": "whisper \"path/to/video.mp4\" --model base --output_format txt",
            "privacy_guarantee": "All processing happens locally on your CPU/GPU. No video audio ever leaves your machine."
        }
