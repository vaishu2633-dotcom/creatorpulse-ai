"""
CreatorPulse AI - Content Studio Generator Service
---------------------------------------------------
Generates platform-tailored, multi-lingual concepts for:
- YouTube (titles, hook, script outline, description, tags)
- Instagram (reel concept, caption, hashtags, carousel outline)
- Twitter/X (single post, 5-tweet thread, hook variants)
- LinkedIn (story post, listicle, interactive poll)

Supports: English, Hindi (हिंदी), Marathi (मराठी).
Includes "Idea Tournament": generates 10 creative hooks/angles, scores each
using the real prediction engine, and returns them ranked by breakout probability.

Supports LLM generation when LLM_API_KEY is configured in .env (Gemini or OpenAI),
with seamless, truthful fallback to curated template frameworks when no key is present.
"""

import os
import json
import re
from typing import Dict, Any, List, Optional
import httpx
from backend.services import prediction


def get_llm_status() -> Dict[str, Any]:
    """Returns current LLM provider configuration status."""
    raw_key = os.getenv("LLM_API_KEY", "").strip()
    has_key = bool(raw_key and not raw_key.startswith("your_"))
    provider = os.getenv("LLM_PROVIDER", "").strip().lower()

    if not provider or provider == "mock":
        if has_key:
            provider = "openai" if raw_key.startswith("sk-") else "gemini"
        else:
            provider = "template"

    return {
        "has_key": has_key,
        "provider": provider if has_key else "template",
        "mode": "ai" if has_key else "template",
        "model_label": "Gemini 1.5 Flash" if provider == "gemini" else ("GPT-4o Mini" if provider == "openai" else "Curated Templates"),
        "supported_languages": ["English", "Hindi", "Marathi"]
    }


def call_external_llm_api(prompt: str, system_prompt: str = "") -> Optional[str]:
    """
    Calls the configured external LLM provider if LLM_API_KEY is available.
    Supports Gemini and OpenAI. Returns raw text response or None on failure/missing key.
    """
    raw_key = os.getenv("LLM_API_KEY", "").strip()
    if not raw_key or raw_key.startswith("your_"):
        return None

    provider = os.getenv("LLM_PROVIDER", "").strip().lower()
    if not provider or provider == "mock":
        provider = "openai" if raw_key.startswith("sk-") else "gemini"

    try:
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={raw_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048
                }
            }
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
        elif provider == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {raw_key}"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt or "You are a master social media content strategist."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[ContentGenerator] External LLM call error: {e}")
        return None

    return None


def _parse_llm_json(raw_text: str) -> Optional[Dict[str, Any]]:
    """Extracts and parses JSON object from an LLM response string."""
    if not raw_text:
        return None
    try:
        # Match ```json ... ``` or first { ... }
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        match_brace = re.search(r"(\{.*\})", raw_text, re.DOTALL)
        if match_brace:
            return json.loads(match_brace.group(1))
    except Exception:
        pass
    return None


def generate_platform_content(
    platform: str,
    topic: str,
    goal: str = "engagement",
    tone: str = "educational",
    language: str = "English"
) -> Dict[str, Any]:
    """
    Generates structured content output tailored to each platform.
    Uses external LLM if key is configured; otherwise uses high-retention template engine.
    Always transparently indicates whether output was generated via 'ai' or 'template'.
    """
    clean_topic = topic.strip() or "Fullstack AI Development"
    lang = language.lower()
    is_hindi = "hindi" in lang
    is_marathi = "marathi" in lang

    status = get_llm_status()
    ai_content = None

    if status["has_key"]:
        # Build prompt for LLM
        schema_guide = ""
        if platform == "youtube":
            schema_guide = '{"titles": ["5 titles"], "hook": "cold open text", "script_outline": [{"section": "name", "content": "desc"}], "description": "video desc with timestamps", "tags": ["tag1", "tag2"]}'
        elif platform == "instagram":
            schema_guide = '{"reel_concept": "visual action", "caption": "engaging caption", "hashtags": ["#tag1", "#tag2"], "carousel_outline": [{"slide": 1, "heading": "title", "sub": "subtext"}]}'
        elif platform == "twitter":
            schema_guide = '{"hook_variants": ["hook1", "hook2", "hook3"], "single_post": "punchy tweet", "thread_tweets": ["tweet 1", "tweet 2", "tweet 3", "tweet 4", "tweet 5"]}'
        else: # linkedin
            schema_guide = '{"story_post": "full narrative", "listicle": ["point 1", "point 2", "point 3", "point 4", "point 5"], "poll_idea": {"question": "...", "options": ["opt1", "opt2"]}}'

        system_prompt = (
            f"You are CreatorPulse AI's content engine. Output strictly valid JSON matching this schema: {schema_guide}. "
            f"Generate all copy in {language}. Keep the tone {tone} and focus on {goal}."
        )
        user_prompt = f"Create a comprehensive {platform} publishing package for topic: '{clean_topic}' in {language}."

        raw_llm = call_external_llm_api(user_prompt, system_prompt)
        if raw_llm:
            parsed = _parse_llm_json(raw_llm)
            if parsed and isinstance(parsed, dict):
                ai_content = parsed

    if ai_content:
        ai_content["platform"] = platform
        ai_content["topic"] = clean_topic
        ai_content["language"] = language
        ai_content["tone"] = tone
        ai_content["generation_mode"] = "ai"
        ai_content["provider"] = status["provider"]
        ai_content["model_label"] = status["model_label"]
        return ai_content

    # Fallback to high-quality curated template engine
    result = _generate_template_content(
        platform=platform,
        clean_topic=clean_topic,
        goal=goal,
        tone=tone,
        language=language,
        is_hindi=is_hindi,
        is_marathi=is_marathi
    )
    result["generation_mode"] = "template"
    result["provider"] = "template"
    result["model_label"] = "Curated Templates"
    return result


def _generate_template_content(
    platform: str,
    clean_topic: str,
    goal: str,
    tone: str,
    language: str,
    is_hindi: bool,
    is_marathi: bool
) -> Dict[str, Any]:
    """Curated multi-lingual template generator for English, Hindi, and Marathi."""
    if platform == "youtube":
        if is_hindi:
            titles = [
                f"{clean_topic}: 90% डेवलपर्स यह गलती करते हैं (और कैसे बचें)",
                f"मैंने {clean_topic} सीखकर 30 दिनों में क्या बनाया?",
                f"{clean_topic} का पूरा सच: 2026 गाइड",
                f"बिना पैसे खर्च किए {clean_topic} में मास्टर बनें",
                f"अगर मैं आज {clean_topic} शुरू करता, तो क्या करता?"
            ]
            hook = f"अगर आप 2026 में {clean_topic} सीख रहे हैं, तो रुकिए! ज्यादातर लोग इस एक बुनियादी गलती के कारण महीनों बर्बाद कर देते हैं।"
            desc = f"इस वीडियो में हम {clean_topic} के सबसे महत्वपूर्ण पहलुओं को समझेंगे।\n\n📌 टाइमस्टैम्प्स:\n00:00 - परिचय\n02:15 - मुख्य सिद्धांत\n06:40 - प्रैक्टिकल डेमो\n11:20 - प्रो टिप्स\n\n#TechInHindi #CodingGuide"
        elif is_marathi:
            titles = [
                f"{clean_topic}: ९०% लोक कुठे चुकतात? संपूर्ण विश्लेषण",
                f"२०२६ मध्ये {clean_topic} शिकण्याची सर्वात सोपी पद्धत",
                f"मी {clean_topic} वापरून काय साध्य केले?",
                f"{clean_topic} शिकण्यापूर्वी हे नक्की जाणून घ्या",
                f"नवीन सुरवात करणाऱ्यांसाठी {clean_topic} चा मास्टरक्लास"
            ]
            hook = f"जर तुम्ही {clean_topic} शिकण्याचा विचार करत असाल, तर हा व्हिडिओ शेवटपर्यंत नक्की पहा. एक चूक तुमचा भरपूर वेळ वाया घालवू शकते."
            desc = f"या व्हिडिओमध्ये {clean_topic} ची संपूर्ण माहिती मराठीतून स्पष्ट केली आहे.\n\n📌 महत्त्वाचे मुद्दे:\n००:०० - प्रस्तावना\n०३:०० - मुख्य पद्धत\n०८:०० - प्रत्यक्ष उदाहरण\n\n#MarathiTech #LearnInMarathi"
        else: # English
            titles = [
                f"Why 90% of People Fail at {clean_topic} (And How to Fix It)",
                f"I Tested {clean_topic} for 30 Days: Here Is What Happened",
                f"The 2026 Blueprint for Mastering {clean_topic} from Scratch",
                f"Stop Doing {clean_topic} Like a Beginner: 5 Pro Shifts",
                f"What Nobody Tells You About {clean_topic} in Production"
            ]
            hook = f"Most people approach {clean_topic} completely backwards. In the next 8 minutes, I'll break down the counter-intuitive framework top performers use."
            desc = f"A step-by-step masterclass on {clean_topic}. Whether you're a beginner or scaling your workflow, this framework will save you months of trial and error.\n\nTimestamps:\n0:00 - The Core Trap\n2:10 - The 3 Pillars\n6:45 - Live Walkthrough\n9:15 - Key Takeaways\n\nSubscribe for weekly insights!"

        return {
            "platform": "youtube",
            "topic": clean_topic,
            "language": language,
            "tone": tone,
            "titles": titles,
            "hook": hook,
            "script_outline": [
                {"section": "The Cold Open (0-30s)", "content": hook},
                {"section": "The Stakes & Agitation (30s-1m30s)", "content": f"Explain why conventional wisdom around {clean_topic} causes burnout or slow results."},
                {"section": "The Core Framework (1m30s-6m)", "content": f"Deliver 3 actionable steps with real-world examples in {clean_topic}."},
                {"section": "The Nuance & Trap (6m-8m)", "content": "What breaks when you scale this up? How to handle edge cases."},
                {"section": "The CTA & Next Step (8m-9m)", "content": "Direct viewers to the comments or companion guide."}
            ],
            "description": desc,
            "tags": [clean_topic.lower().replace(" ", ""), "tutorial", "guide2026", "techtips", "productivity"]
        }

    elif platform == "instagram":
        if is_hindi:
            caption = f"Stop scrolling! 🚨 अगर आप {clean_topic} में बेहतर बनना चाहते हैं, तो यह 3 स्टेप्स आज ही सेव कर लें।\n\n१. पहले बेसिक्स पक्के करें।\n२. रोज १५ मिनट प्रैक्टिस करें।\n३. फीडबैक लेकर इम्प्रूव करें।\n\nअपने उस दोस्त को शेयर करें जिसे इसकी जरूरत है! 👇"
            reel_concept = f"कैमरा की तरफ पॉइंट करते हुए शुरू करें: 'क्या आप भी {clean_topic} में स्ट्रगल कर रहे हैं?' फिर स्क्रीन पर 3 फास्ट कट ट्रांसिशन्स के साथ टिप्स दिखाएं।"
        elif is_marathi:
            caption = f"थांबा आणि नक्की वाचा! 📌 {clean_topic} मध्ये प्रगती करण्यासाठी हे ३ महत्त्वाचे नियम लक्षात ठेवा.\n\n१. मूलभूत तत्त्वे समजावून घ्या.\n२. सातत्य ठेवा.\n३. अनुभवी लोकांचे मार्गदर्शन घ्या.\n\nहा पोस्ट नक्की सेव्ह करा आणि मित्रांसोबत शेअर करा! 💡"
            reel_concept = f"फास्ट पेस रील: स्क्रीनवर 'हे ३ नियम कधीही विसरू नका' असा टेक्स्ट आणि ३ सेकंदात मुख्य टिप्सचे व्हिज्युअल रिव्हिल."
        else:
            caption = f"Save this before you plan your next {clean_topic} sprint! 📌⚡\n\nHere are 3 subtle mistakes keeping you from breakthrough results:\n\n1️⃣ Over-complicating the setup\n2️⃣ Focusing on vanity metrics instead of core retention\n3️⃣ Quitting right before the inflection curve\n\nWhich of these 3 hits closest to home? Drop a 1, 2, or 3 below! 👇"
            reel_concept = f"Hook frame: Text on screen: 'The {clean_topic} mistake nobody talks about.' Rapid cut to 3 visual before/after proofs, ending with a call to save."

        return {
            "platform": "instagram",
            "topic": clean_topic,
            "language": language,
            "tone": tone,
            "reel_concept": reel_concept,
            "caption": caption,
            "hashtags": [f"#{clean_topic.lower().replace(' ', '')}", "#creatortips", "#growthmindset", "#learninpublic", "#reelsindia", "#workflowdesign"],
            "carousel_outline": [
                {"slide": 1, "heading": f"The 2026 {clean_topic} Guide", "sub": "Swipe to see the 3 rules that change everything ➡️"},
                {"slide": 2, "heading": "Mistake #1: The Shiny Object Trap", "sub": "Why jumping between tools resets your momentum."},
                {"slide": 3, "heading": "The 80/20 Solution", "sub": "Double down on the 2 levers that drive 80% of actual output."},
                {"slide": 4, "heading": "Before vs After", "sub": "Side-by-side metric comparison showing 2.8x leverage."},
                {"slide": 5, "heading": "Save & Share", "sub": "Bookmark this for your weekly workflow check-in!"}
            ]
        }

    elif platform == "twitter":
        if is_hindi:
            hook_variants = [
                f"ज्यादातर लोगों को लगता है {clean_topic} मुश्किल है। यह बिल्कुल गलत है। 1 पेज का फ्रेमवर्क समझें: 🧵👇",
                f"अनपॉपुलर ओपिनियन: अगर आप {clean_topic} को 3 वाक्यों में नहीं समझा सकते, तो आपकी रणनीति अधूरी है।",
                f"मैंने {clean_topic} पर 100+ घंटे रिसर्च की। यहाँ हैं 5 सबसे जरूरी बातें:"
            ]
            single_post = f"{clean_topic} में सफलता का कोई गुप्त शॉर्टकट नहीं है।\n\nबस रोजाना बेसिक्स को लगातार सही तरीके से करते रहना है जब बाकी लोग नए शॉर्टकट ढूंढ रहे हों।"
            thread_tweets = [
                f"1/5 {clean_topic} को ज्यादातर लोग जरूरत से ज्यादा जटिल बना देते हैं।\n\n10 टूल्स खरीदते हैं, 50 वीडियो देखते हैं, पर शुरुआत नहीं करते।\n\nइसे 3 आसान स्टेप्स में बदलें:",
                f"2/5 पहला नियम: सीमित दायरा तय करें।\n\nस्पष्ट लक्ष्य के बिना {clean_topic} पर काम न शुरू करें।",
                f"3/5 दूसरा नियम: जल्दी फीडबैक लें।\n\nअसली लोगों से अपनी समझ परखें।",
                f"4/5 तीसरा नियम: निरंतरता।\n\nएक दिन की मेहनत से ज्यादा रोज की 20 मिनट की प्रैक्टिस असरदार होती है।",
                f"5/5 अगर यह थ्रेड उपयोगी लगा तो शेयर करें और फॉलो करें!"
            ]
        elif is_marathi:
            hook_variants = [
                f"{clean_topic} शिकणे अवघड आहे असा अनेकांचा समज असतो. पण तो चुकीचा आहे. हा १ पानाचा फॉर्म्युला नक्की पहा: 🧵👇",
                f"महत्त्वाचा विचार: जर तुम्ही {clean_topic} ३ वाक्यांत मांडू शकत नसाल, तर तुमच्याकडे योग्य पद्धत नाही.",
                f"{clean_topic} चा बारकाईने अभ्यास केल्यानंतर मिळालेले ५ महत्त्वाचे धडे:"
            ]
            single_post = f"{clean_topic} मध्ये यशस्वी होण्याचे रहस्य मोठे नसून सातत्याचे आहे.\n\nप्रत्येक दिवशी मूलभूत गोष्टींवर मेहनत घेणे हीच खरी प्रगतीची गुरुकिल्ली आहे."
            thread_tweets = [
                f"१/५ बरेच जण {clean_topic} खूप किचकट करतात.\n\n१० साधने वापरतात पण प्रत्यक्ष काम शून्य असते.\n\nहे सोपे करण्याचे ३ नियम:",
                f"२/५ पहिला नियम: स्पष्ट उद्दिष्ट ठेवा.\n\n{clean_topic} सुरू करताना नेमके काय करायचे आहे हे नक्की करा.",
                f"३/५ दुसरा नियम: त्वरित अभिप्राय घ्या.\n\nतुमचे काम तज्ज्ञांना दाखवून सुधारा.",
                f"४/५ तिसरा नियम: सातत्य.\n\nदररोज थोडा वेळ दिलेला प्रयत्न मोठा बदल घडवून आणतो.",
                f"५/५ माहिती आवडल्यास नक्की रिट्विट करा आणि फॉलो करा!"
            ]
        else: # English
            hook_variants = [
                f"Most people think {clean_topic} takes years to master. They're wrong. Here's the 1-page mental model that changes everything: 🧵👇",
                f"Unpopular opinion: If you can't explain your {clean_topic} strategy in 3 sentences, you don't have one.",
                f"I spent 100+ hours analyzing high-performing {clean_topic} workflows. Here are the 5 insights worth knowing:"
            ]
            single_post = f"The biggest secret in {clean_topic} isn't genius or luck.\n\nIt's having the patience to do the boring, fundamental reps when everyone else is chasing the next shiny shortcut."
            thread_tweets = [
                f"1/5 Most creators and founders overcomplicate {clean_topic}.\n\nThey buy 10 tools, read 50 articles, and produce zero shipped assets.\n\nHere is how to reverse that trap in 3 steps:",
                f"2/5 Step 1: Constraint-based prototyping.\n\nNever start a {clean_topic} session without a timer and a single definition of done.",
                f"3/5 Step 2: Ruthless feedback loops.\n\nTest assumptions with real people before polishing pixels or code.",
                f"4/5 Step 3: Distribution first.\n\nA decent project with 100 active eyes beats a masterpiece in an unindexed folder every single time.",
                f"5/5 Summary: Narrow scope, validate early, iterate relentlessly. If you found this useful, share and follow!"
            ]

        return {
            "platform": "twitter",
            "topic": clean_topic,
            "language": language,
            "tone": tone,
            "hook_variants": hook_variants,
            "single_post": single_post,
            "thread_tweets": thread_tweets
        }

    else: # LinkedIn
        if is_hindi:
            story_post = (
                f"पिछले महीने, मैंने एक टीम को {clean_topic} को समझने के लिए हफ़्तों जूझते देखा।\n\n"
                f"परिणाम? बहुत कम प्रगति।\n\n"
                f"सच्चाई यह है कि {clean_topic} में असफलता जानकारी की कमी से नहीं, बल्कि इन ३ कारणों से होती है:\n"
                f"१. असली समस्या को समझे बिना काम शुरू करना\n"
                f"२. बिना किसी स्पष्ट मेट्रिक के समय बिताना\n"
                f"३. छोटे-छोटे प्रयोगों से डरना\n\n"
                f"जब हमने इन बुनियादी गलतियों को सुधारा, तो ३ हफ्तों में नतीजे ४०% बेहतर हो गए।\n\n"
                f"आपकी इंडस्ट्री में {clean_topic} को लेकर सबसे बड़ी गलतफहमी क्या है? कमेंट में बताएं।"
            )
            listicle = [
                f"{clean_topic} में महारत हासिल करने के ५ व्यावहारिक सबक:",
                "१. मौखिक बातचीत से बेहतर है लिखित योजना।",
                "२. यदि फीडबैक लूप ४८ घंटे से लंबा है, तो गति धीमी हो जाती है।",
                "३. स्पष्ट लक्ष्यों के साथ साधारण योजना हमेशा अस्पष्ट बड़ी रणनीति से बेहतर होती है।",
                "४. बार-बार होने वाले छोटे कामों को ऑटोमेट करें।",
                "५. जो सीखें उसे खुलकर साझा करें, इससे विश्वास बढ़ता है।"
            ]
            poll_idea = {
                "question": f"{clean_topic} को अपनाते समय आपके लिए सबसे बड़ी चुनौती क्या है?",
                "options": [
                    "स्पष्ट रोडमैप की कमी",
                    "टूल्स और तकनीकी समझ",
                    "टीम अलाइनमेंट",
                    "समय की कमी"
                ]
            }
        elif is_marathi:
            story_post = (
                f"गेल्या महिन्यात, एका चमूने {clean_topic} वर बरेच प्रयत्न केले परंतु समाधानकारक निकाल मिळाले नाहीत.\n\n"
                f"याचे मुख्य कारण म्हणजे:\n"
                f"१. मूळ समस्येकडे दुर्लक्ष करणे\n"
                f"२. स्पष्ट मोजमाप नसणे\n"
                f"३. लहान प्रयोगांचा अभाव\n\n"
                f"जेव्हा मूळ नियमांवर लक्ष केंद्रित केले गेले, तेव्हा अवघ्या ३ आठवड्यांत प्रगती ४०% वाढली.\n\n"
                f"{clean_topic} बद्दल तुमचा सर्वात मोठा अनुभव काय आहे? खालील कमेंट्समध्ये नक्की सांगा."
            )
            listicle = [
                f"{clean_topic} मध्ये यशस्वी होण्याचे ५ महत्त्वाचे नियम:",
                "१. प्रत्येक गोष्टीचे योग्य नियोजन आणि नोंद ठेवा.",
                "२. त्रुटी वेळेत शोधून दुरुस्त करा.",
                "३. अस्पष्ट मोठ्या योजनांपेक्षा अचूक लहान पावले अधिक प्रभावी ठरतात.",
                "४. नियमितपणे पुनरावलोकन करा.",
                "५. अनुभवातून शिकणे सुरू ठेवा."
            ]
            poll_idea = {
                "question": f"{clean_topic} वापरताना तुम्हाला येणारी मुख्य अडचण कोणती?",
                "options": [
                    "योग्य मार्गदर्शनाचा अभाव",
                    "तांत्रिक साधने",
                    "वेळेची मर्यादा",
                    "इतर साधने"
                ]
            }
        else: # English
            story_post = (
                f"Last year, I watched a team spend 4 months and $80,000 trying to 'solve' {clean_topic}.\n\n"
                f"The result? Zero measurable impact.\n\n"
                f"Here is the uncomfortable truth: Most teams don't fail at {clean_topic} because of lack of talent or budget. They fail because of three silent misalignments:\n\n"
                f"1. Treating symptoms instead of root causes\n"
                f"2. Measuring vanity velocity instead of genuine customer value\n"
                f"3. Asking for permission instead of running small, reversible experiments\n\n"
                f"When we stripped away the corporate theater and focused strictly on the core lever, results improved by 43% in just 3 weeks.\n\n"
                f"What is one practice in your industry that everyone does, but nobody can justify with real data?"
            )
            listicle = [
                f"5 Lessons from Scaling {clean_topic} in 2026:",
                "1. Documentation beats verbal alignment every single time.",
                "2. If your feedback loop takes longer than 48 hours, momentum dies.",
                "3. Great execution with clear metrics > Perfect strategy with vague KPIs.",
                "4. Automate the low-variance tasks so your team can do high-leverage thinking.",
                "5. Build in public: transparency creates unmatched customer trust."
            ]
            poll_idea = {
                "question": f"What is your biggest blocker when executing {clean_topic} today?",
                "options": [
                    "Lack of clear roadmap",
                    "Tooling & infrastructure",
                    "Cross-team alignment",
                    "Time / resource bandwidth"
                ]
            }

        return {
            "platform": "linkedin",
            "topic": clean_topic,
            "language": language,
            "tone": tone,
            "story_post": story_post,
            "listicle": listicle,
            "poll_idea": poll_idea
        }


def run_idea_tournament(platform: str, topic: str, count: int = 10, language: str = "English") -> List[Dict[str, Any]]:
    """
    Idea Tournament:
    Generates 10 diverse angles/hooks around the topic (adapting to language),
    scores each using the calibrated ViralScope prediction engine, and returns
    them ranked by predicted breakout probability.
    """
    clean_topic = topic.strip() or "Fullstack AI Development"
    lang = language.lower()
    is_hindi = "hindi" in lang
    is_marathi = "marathi" in lang

    if is_hindi:
        angle_templates = [
            {"style": "The Contrarian Angle", "hook": f"90% लोग {clean_topic} में असफल क्यों होते हैं (और शीर्ष 1% क्या अलग करते हैं)"},
            {"style": "The Hard Metric Case Study", "hook": f"हमने बिना बजट बढ़ाए {clean_topic} में 3.4 गुना परिणाम कैसे हासिल किए"},
            {"style": "The Step-by-Step Blueprint", "hook": f"{clean_topic} के लिए 2026 का पूरा रोडमैप: शुरुआत से प्रोडक्शन तक"},
            {"style": "The Uncomfortable Truth", "hook": f"{clean_topic} का वह कड़वा सच जिसे टेक इंडस्ट्री में कोई स्वीकार नहीं करता"},
            {"style": "The Tooling & Stack Breakdown", "hook": f"2026 में {clean_topic} के लिए आवश्यक केवल 3 टूल्स (बाकी सब छोड़ें)"},
            {"style": "The Costly Mistake Warning", "hook": f"{clean_topic} में यह गलती तुरंत रोकें: महीनों बर्बाद करने वाली भारी भूल"},
            {"style": "The 30-Day Experiment", "hook": f"मैंने 30 दिनों तक लगातार {clean_topic} पर काम किया। ये हैं असली आंकड़े:"},
            {"style": "The 1-Page Framework", "hook": f"वह 1 पेज का फॉर्म्युला जो {clean_topic} को हमेशा के लिए आसान बना देता है: 🧵👇"},
            {"style": "The Beginner vs Pro Contrast", "hook": f"{clean_topic} में शुरुआती बनाम अनुभवी का नजरिया एक सरल चित्र में"},
            {"style": "The Future Outlook", "hook": f"2027 तक {clean_topic} कैसा दिखेगा (और अपना करियर आज ही कैसे तैयार करें)"}
        ]
    elif is_marathi:
        angle_templates = [
            {"style": "The Contrarian Angle", "hook": f"९०% लोक {clean_topic} मध्ये का अपयशी ठरतात (आणि अव्वल १% काय वेगळे करतात)"},
            {"style": "The Hard Metric Case Study", "hook": f"आम्ही कोणताही अतिरिक्त खर्च न करता {clean_topic} मध्ये ३.४ पट परिणाम कसे मिळवले"},
            {"style": "The Step-by-Step Blueprint", "hook": f"{clean_topic} चा २०२६ चा संपूर्ण रोडमॅप: सुरवातीपासून कौशल्यापर्यंत"},
            {"style": "The Uncomfortable Truth", "hook": f"{clean_topic} बाबतचे कटू सत्य जे कोणीही उघडपणे सांगत नाही"},
            {"style": "The Tooling & Stack Breakdown", "hook": f"२०२६ मध्ये {clean_topic} साठी आवश्यक असलेली फक्त ३ साधने"},
            {"style": "The Costly Mistake Warning", "hook": f"{clean_topic} करताना ही मोठी चूक ताबडतोब थांबवा: वेळ वाचवा"},
            {"style": "The 30-Day Experiment", "hook": f"मी सलग ३० दिवस {clean_topic} चा वापर केला. हे आहेत प्रत्यक्ष आकडे:"},
            {"style": "The 1-Page Framework", "hook": f"तो १ पानाचा आराखडा जो {clean_topic} कायमचा सोपा करतो: 🧵👇"},
            {"style": "The Beginner vs Pro Contrast", "hook": f"{clean_topic} मध्ये नवशिक्या विरुद्ध तज्ज्ञ दृष्टिकोन एका तक्त्यात"},
            {"style": "The Future Outlook", "hook": f"२०२७ पर्यंत {clean_topic} चे स्वरूप कसे असेल (आणि आजच कशी तयारी करावी)"}
        ]
    else:
        angle_templates = [
            {"style": "The Contrarian Angle", "hook": f"Why 90% of people fail at {clean_topic} (and what the top 1% do differently)"},
            {"style": "The Hard Metric Case Study", "hook": f"How we achieved 3.4x results in {clean_topic} without increasing budget"},
            {"style": "The Step-by-Step Blueprint", "hook": f"The 2026 complete roadmap for {clean_topic}: From beginner to production ready"},
            {"style": "The Uncomfortable Truth", "hook": f"The brutal truth about {clean_topic} nobody in tech wants to admit"},
            {"style": "The Tooling & Stack Breakdown", "hook": f"The only 3 tools you actually need for {clean_topic} in 2026 (ignore the rest)"},
            {"style": "The Costly Mistake Warning", "hook": f"Stop doing {clean_topic} like this: The $10k mistake costing developers months"},
            {"style": "The 30-Day Experiment", "hook": f"I tested {clean_topic} for 30 days straight. Here are the raw unedited numbers:"},
            {"style": "The 1-Page Framework", "hook": f"The 1-page mental model that simplifies {clean_topic} forever: 🧵👇"},
            {"style": "The Beginner vs Pro Contrast", "hook": f"Junior vs Senior approaches to {clean_topic} in one simple diagram"},
            {"style": "The Future Outlook", "hook": f"What {clean_topic} will look like by 2027 (and how to prepare your career right now)"}
        ]

    default_types = {
        "youtube": "long_video",
        "instagram": "reel",
        "twitter": "thread",
        "linkedin": "story_post"
    }
    p_type = default_types.get(platform, "story_post")

    tournament_results = []
    for idx, item in enumerate(angle_templates[:count]):
        hook_text = item["hook"]
        # Score idea using calibrated ViralScope prediction engine
        pred_res = prediction.predict_breakout(
            platform=platform,
            post_type=p_type,
            title=hook_text,
            hashtag_count=4 if platform in ["instagram", "youtube"] else 1,
            duration_sec=600 if platform == "youtube" else (35 if platform == "instagram" else 0),
            post_hour=17,
            post_weekday=2,
            strictness="top_10%"
        )

        tournament_results.append({
            "rank": idx + 1,
            "angle_name": item["style"],
            "title": hook_text,
            "predicted_prob_percent": pred_res.get("predicted_prob_percent", 12.0),
            "base_rate_percent": pred_res.get("base_rate_percent", 10.0),
            "probability_ratio": pred_res.get("probability_ratio", 1.2),
            "prob_display": pred_res.get("prob_display", "12%"),
            "confidence_level": pred_res.get("confidence_level", "Medium"),
            "top_reasons": pred_res.get("top_reasons", []),
            "is_winner": False
        })

    # Sort descending by predicted probability
    tournament_results.sort(key=lambda x: x["predicted_prob_percent"], reverse=True)

    # Re-assign ranks and mark winner
    for i, item in enumerate(tournament_results):
        item["rank"] = i + 1
        if i == 0:
            item["is_winner"] = True

    return tournament_results
