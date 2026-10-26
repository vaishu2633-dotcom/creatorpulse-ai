"""
CreatorPulse AI - ReelGenius Studio Content Generator
------------------------------------------------------
Generates platform-tailored, multi-lingual concepts for:
- YouTube (5 titles, hook, script outline, description, tags)
- Instagram (reel concept, caption, hashtags, carousel outline)
- Twitter/X (single post, 5-tweet thread, hook variants)
- LinkedIn (story post, listicle, interactive poll)

Supports: English, Hindi (हिंदी), Marathi (मराठी).
Includes "Idea Tournament": generates 10 creative hooks/angles, scores each
using the ViralScope prediction service, and returns them ranked.

ARCHITECTURAL NOTE:
The function `call_external_llm_api(prompt, model)` is provided below as a direct
hook to swap mock templates for OpenAI, Gemini, or Claude API calls later.
"""

import os
from typing import Dict, Any, List
from backend.services import prediction

# Optional environment variable for future LLM integration
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock")

def call_external_llm_api(prompt: str, system_prompt: str = "") -> str:
    """
    HOOK FOR FUTURE LLM EXPANSION:
    When ready to connect real models (e.g. Gemini 2.5 Flash, GPT-4o, Claude 3.7 Sonnet),
    implement the HTTP client call here. The rest of the application will remain unchanged.
    """
    if LLM_PROVIDER.lower() == "gemini" and LLM_API_KEY:
        # Example: google.generativeai or httpx call
        pass
    # For prototype: return None to fall back to template engine
    return ""

def generate_platform_content(
    platform: str,
    topic: str,
    goal: str = "engagement",
    tone: str = "educational",
    language: str = "English"
) -> Dict[str, Any]:
    """Generates structured content output tailored to each platform."""
    clean_topic = topic.strip() or "Fullstack AI Development"
    lang = language.lower()
    
    # Language prefixes/translations for mock realism
    is_hindi = "hindi" in lang
    is_marathi = "marathi" in lang
    
    if platform == "youtube":
        if is_hindi:
            titles = [
                f"{clean_topic}: 90% डेवलपर्स यह गलती करते हैं (और कैसे बचें)",
                f"मैंने {clean_topic} सीखकर 30 दिनों में क्या बनाया?",
                f"{clean_topic} का पूरा सच: 2026 गाइड",
                f"बिना पैसे खर्च किए {clean_topic} में मास्टर बनें",
                f"अगर मैं आज {clean_topic} शुरू करता, तो क्या करता?"
            ]
            hook = f"अगर आप 2026 में {clean_topic} सीख रहे हैं, तो रुकिए! ज्यादातर लोग इस एक बुनियादी गलती के कारण 6 महीने बर्बाद कर देते हैं।"
            desc = f"इस वीडियो में हम {clean_topic} के सबसे महत्वपूर्ण पहलुओं को समझेंगे।\n\n📌 टाइमस्टैम्प्स:\n00:00 - परिचय\n02:15 - मुख्य अवधारणाएं\n06:40 - प्रैक्टिकल डेमो\n11:20 - प्रो टिप्स\n\n#TechInHindi #CodingGuide"
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
        hook_variants = [
            f"Most people think {clean_topic} takes years to master. They're wrong. Here's the 1-page mental model that changes everything: 🧵👇",
            f"Unpopular opinion: If you can't explain your {clean_topic} strategy in 3 sentences, you don't have one.",
            f"I spent 100+ hours analyzing high-performing {clean_topic} workflows. Here are the 5 insights worth knowing:"
        ]
        
        thread = [
            f"1/7 Most creators and founders overcomplicate {clean_topic}.\n\nThey buy 10 tools, read 50 articles, and produce zero shipped assets.\n\nHere is how to reverse that trap in 4 steps:",
            f"2/7 Step 1: Constraint-based prototyping.\n\nNever start a {clean_topic} session without a timer and a single definition of done.",
            f"3/7 Step 2: Ruthless feedback loops.\n\nTest assumptions with 10 real users before polishing pixels or code.",
            f"4/7 Step 3: Distribution first.\n\nA decent project with 100 active eyes beats a masterpiece in an unindexed folder every single time.",
            f"5/7 Step 4: The compounding effect.\n\nIteration speed > single attempt brilliance.",
            f"6/7 Summary:\n• Narrow scope\n• Validate early\n• Ship daily\n• Iterate relentlessly",
            f"7/7 If you found this useful:\n1. Follow for weekly deep dives\n2. RT the first tweet below to share with your network 👇"
        ]
        
        single_post = f"The biggest secret in {clean_topic} isn't genius or luck.\n\nIt's having the patience to do the boring, fundamental reps when everyone else is chasing the next shiny shortcut."
        
        return {
            "platform": "twitter",
            "topic": clean_topic,
            "language": language,
            "tone": tone,
            "hook_variants": hook_variants,
            "single_post": single_post,
            "thread": thread
        }

    else: # LinkedIn
        story_post = f"Last year, I watched a team spend 4 months and $80,000 trying to 'solve' {clean_topic}.\n\nThe result? Zero measurable impact.\n\nHere is the uncomfortable truth: Most organizations don't fail at {clean_topic} because of lack of talent or budget. They fail because of three silent misalignments:\n\n1. Treating symptoms instead of root causes\n2. Measuring vanity velocity instead of genuine customer value\n3. Asking for permission instead of running small, reversible experiments\n\nWhen we stripped away the corporate theater and focused strictly on the core lever, results improved by 43% in just 3 weeks.\n\nWhat is one practice in your industry that everyone does, but nobody can justify with real data?"
        
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

def run_idea_tournament(platform: str, topic: str, count: int = 10) -> List[Dict[str, Any]]:
    """
    Idea Tournament:
    Generates 10 diverse angles/hooks around the topic, runs each through
    the ViralScope prediction service, and returns them ranked by probability.
    """
    clean_topic = topic.strip() or "Fullstack AI Development"
    
    # 10 distinctive hook styles/angles
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
    
    tournament_results = []
    
    # Map platform default post type
    default_types = {
        "youtube": "long_video",
        "instagram": "reel",
        "twitter": "thread",
        "linkedin": "story_post"
    }
    p_type = default_types.get(platform, "story_post")
    
    for idx, item in enumerate(angle_templates[:count]):
        hook_text = item["hook"]
        # Score idea using ViralScope prediction engine
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
            "predicted_prob_percent": pred_res["predicted_prob_percent"],
            "base_rate_percent": pred_res["base_rate_percent"],
            "probability_ratio": pred_res["probability_ratio"],
            "prob_display": pred_res["prob_display"],
            "confidence_level": pred_res["confidence_level"],
            "top_reasons": pred_res["top_reasons"],
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
