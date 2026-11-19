"""
CreatorPulse AI - ML Text Preprocessor
--------------------------------------
Applies standard NLP cleaning and normalization for social media comments:
- URL and mention removal
- Contraction expansion
- Emoticon / emoji sentiment mapping
- Punctuation & noise normalization
- Lowercasing and whitespace trimming
"""

import re
import html
from typing import List

CONTRACTIONS = {
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "can't": "cannot",
    "won't": "will not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "n't": " not",
    "'re": " are",
    "'s": " is",
    "'d": " would",
    "'ll": " will",
    "'t": " not",
    "'ve": " have",
    "'m": " am",
    "u": "you",
    "ur": "your",
    "r": "are",
    "plz": "please",
    "pls": "please",
    "thx": "thanks",
    "ty": "thank you",
    "imo": "in my opinion",
    "imho": "in my humble opinion",
    "tbh": "to be honest",
    "idk": "i do not know",
}

POSITIVE_EMOJIS = {
    "❤️": " love ",
    "💖": " love ",
    "🔥": " fire awesome ",
    "👍": " thumbs up good ",
    "👏": " applause great ",
    "🙌": " praise excellent ",
    "🎉": " celebrate great ",
    "💯": " perfect excellent ",
    "✨": " sparkle amazing ",
    "😍": " love awesome ",
    "🥰": " love great ",
    "🚀": " rocket awesome ",
    "💪": " strong great ",
    ":)": " happy smile ",
    ":-)": " happy smile ",
    ":D": " laugh great ",
    ";)": " wink good ",
}

NEGATIVE_EMOJIS = {
    "👎": " thumbs down bad ",
    "💩": " poop awful ",
    "😡": " angry terrible ",
    "😠": " mad bad ",
    "🤮": " vomit disgust ",
    "🤢": " gross bad ",
    "😢": " sad crying ",
    "😭": " crying bad ",
    "💔": " broken heart sad ",
    "🤦": " facepalm terrible ",
    "🤡": " clown stupid ",
    ":(": " sad unhappy ",
    ":-(": " sad unhappy ",
    ":'(": " crying sad ",
    ":/": " skeptical disappointed ",
}


def clean_text(text: str) -> str:
    """
    Cleans and normalizes a social media comment or tweet.
    Returns cleaned text string ready for TF-IDF vectorization.
    """
    if not text or not isinstance(text, str):
        return ""

    # 0. Unescape HTML entities (e.g. &#39; -> ', &quot; -> ", &amp; -> &)
    text = html.unescape(text).lower()

    # 1. Remove URLs first so emoticons like ":/" don't corrupt "https://"
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # 2. Remove user mentions (@username)
    text = re.sub(r"@\w+", " ", text)

    # 3. Remove HTML tags
    text = re.sub(r"<.*?>", " ", text)

    # 4. Replace known emoticons and emojis with sentiment words
    for emoji, word in POSITIVE_EMOJIS.items():
        text = text.replace(emoji, word)
    for emoji, word in NEGATIVE_EMOJIS.items():
        text = text.replace(emoji, word)

    # 5. Expand contractions and slang
    for contraction, expansion in CONTRACTIONS.items():
        text = re.sub(r"\b" + re.escape(contraction) + r"\b", expansion, text)

    # 6. Replace hashtags: keep the word without the hash symbol
    text = re.sub(r"#(\w+)", r"\1", text)

    # 7. Normalize repeated characters (e.g. "sooooo goooood" -> "soo good")
    text = re.sub(r"(.)\1{2,}", r"\1\1", text)

    # 8. Remove non-alphanumeric characters (keep basic letters, numbers, spaces)
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)

    # 9. Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def clean_texts(texts: List[str]) -> List[str]:
    """Applies clean_text to a list of strings."""
    return [clean_text(t) for t in texts]
