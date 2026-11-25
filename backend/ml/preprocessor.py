"""
creatorPulse - ML Text Preprocessor
-----------------------------------
Applies standard NLP cleaning and normalization for social media comments:
- URL, HTML entity, and mention removal
- Contraction & slang expansion (including Hinglish and YouTube acronyms)
- Emoticon and emoji sentiment mapping (laugh, hearts, fire, praise, disapproval)
- Timestamp normalization (e.g. 15:06 -> timestamp)
- Number and noise normalization
- Punctuation removal and whitespace trimming
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
    "bcoz": "because",
    "coz": "because",
    "cuz": "because",
    "bcz": "because",
    "bcuz": "because",
    "fav": "favorite",
    "fave": "favorite",
    "never fails to": "always",
    "never fail to": "always",
    "never fails": "always",
    "can't stop laughing": "hilarious laugh",
    "cannot stop laughing": "hilarious laugh",
    "bro": "brother friend",
    "bhai": "brother friend",
}

POSITIVE_EMOJIS = {
    # Laugh / Humor / Fun (most popular on YouTube)
    "😂": " laugh funny ",
    "🤣": " laugh funny ",
    "😆": " laugh funny ",
    "😄": " happy smile ",
    "😃": " happy smile ",
    "😀": " happy smile ",
    "😁": " happy smile ",
    "😅": " laugh funny ",
    # Playful / Cheeky
    "😛": " playful funny smile ",
    "😜": " playful funny smile ",
    "😝": " playful funny smile ",
    "😋": " delicious happy smile ",
    # Hearts / Love (both U+2764 with and without variation selector-16)
    "❤️": " love heart ",
    "❤": " love heart ",
    "💖": " love heart ",
    "💕": " love heart ",
    "💗": " love heart ",
    "💓": " love heart ",
    "💞": " love heart ",
    "💘": " love heart ",
    "💝": " love heart ",
    "❣️": " love heart ",
    "❣": " love heart ",
    "💙": " love heart ",
    "💚": " love heart ",
    "💛": " love heart ",
    "💜": " love heart ",
    "🧡": " love heart ",
    "🤍": " love heart ",
    "🤎": " love heart ",
    # Adoration / Wonder
    "😍": " love amazing awesome ",
    "🥰": " love great sweet ",
    "🤩": " star amazing awesome ",
    "😻": " love great ",
    # Praise / Approval / Clapping
    "👍": " thumbs up good ",
    "👏": " applause great praise ",
    "🙌": " praise excellent ",
    "👌": " perfect good ",
    "✌️": " peace victory good ",
    "✌": " peace victory good ",
    "🙏": " grateful praise thank you ",
    # Excitement / Best / Legend
    "🔥": " fire awesome epic ",
    "🎉": " celebrate great ",
    "🥳": " celebrate party great ",
    "💯": " perfect excellent ",
    "✨": " sparkle amazing ",
    "🌟": " star amazing ",
    "🚀": " rocket awesome ",
    "💪": " strong great ",
    "👑": " king legend best ",
    "🐐": " goat best legend ",
    # Friendly / Cool
    "😊": " smile happy good ",
    "🙂": " smile friendly ",
    "😇": " angel sweet good ",
    "😌": " peaceful happy ",
    "😎": " cool awesome ",
    # Text emoticons
    ":)": " happy smile ",
    ":-)": " happy smile ",
    ":D": " laugh great ",
    ":-D": " laugh great ",
    ";)": " wink good ",
    ";-)": " wink good ",
    "<3": " love heart ",
    "xd": " laugh funny ",
    "XD": " laugh funny ",
    "xD": " laugh funny ",
}

NEGATIVE_EMOJIS = {
    "👎": " thumbs down bad ",
    "💩": " poop awful terrible ",
    "😡": " angry terrible mad ",
    "😠": " mad bad angry ",
    "🤬": " angry swearing bad ",
    "🤮": " vomit disgust gross ",
    "🤢": " gross bad nausea ",
    "😢": " sad crying ",
    "😭": " crying sad unhappy ",
    "💔": " broken heart sad ",
    "🤦": " facepalm terrible ",
    "🤦‍♂️": " facepalm terrible ",
    "🤦‍♀️": " facepalm terrible ",
    "🤡": " clown stupid fool ",
    "🙄": " eye roll annoyed bored ",
    "😒": " annoyed bored bad ",
    "😩": " tired frustrated bad ",
    "😫": " tired frustrated bad ",
    "🗑️": " trash garbage bad ",
    "🗑": " trash garbage bad ",
    "🖕": " offensive rude bad ",
    ":(": " sad unhappy ",
    ":-(": " sad unhappy ",
    ":'(": " crying sad ",
    ":/": " skeptical disappointed ",
    ":-/": " skeptical disappointed ",
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

    # 4. Normalize timestamps (e.g. 15:06, 4:36, 1:45) to a clean 'timestamp' token
    text = re.sub(r"\b\d{1,2}:\d{2}(?::\d{2})?\b", " timestamp ", text)

    # 5. Replace known emoticons and emojis with sentiment words
    for emoji, word in POSITIVE_EMOJIS.items():
        text = text.replace(emoji, word)
    for emoji, word in NEGATIVE_EMOJIS.items():
        text = text.replace(emoji, word)

    # 6. Expand contractions and slang
    for contraction, expansion in CONTRACTIONS.items():
        text = re.sub(r"\b" + re.escape(contraction) + r"\b", expansion, text)

    # 7. Replace hashtags: keep the word without the hash symbol
    text = re.sub(r"#(\w+)", r"\1", text)

    # 8. Remove standalone digits (e.g. 2023, 15) so they don't form spurious TF-IDF features
    text = re.sub(r"\b\d+\b", " ", text)

    # 9. Normalize repeated characters (e.g. "sooooo goooood" -> "soo good")
    text = re.sub(r"(.)\1{2,}", r"\1\1", text)

    # 10. Remove non-alphabetic characters (keep basic letters and spaces)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)

    # 11. Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def clean_texts(texts: List[str]) -> List[str]:
    """Applies clean_text to a list of strings."""
    return [clean_text(t) for t in texts]
