"""
CreatorPulse AI - Synthetic Data Generator
-------------------------------------------
NOTE: All generated data is 100% SYNTHETIC for prototype testing and demonstration.
It does not represent real platform API telemetry or real social media findings.

Generates:
1. creators.json
2. posts.json (with features for ML training: platform, post_type, title_length, hashtag_count, duration_sec, post_hour, post_weekday, creator_avg_engagement, follower_count, is_breakout)
3. metric_snapshots.json (time-series for dashboard charts)
4. comments.json (with sentiment, themes, audience questions)
5. trends.json (platform trends with 24h, 7d, 30d windows)
6. predictions.json (historical predictions with actual outcomes for calibration scoreboard)
7. drafts.json (content studio saved drafts)
"""

import os
import json
import random
import math
from datetime import datetime, timedelta, timezone

# Ensure reproducible generation
random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

PLATFORMS = ["youtube", "instagram", "twitter", "linkedin"]

CREATOR_PROFILES = [
    # YouTube creators
    {
        "creator_id": "c_yt_01",
        "name": "DevPulse with Alex",
        "handle": "@devpulse_alex",
        "platform": "youtube",
        "follower_count": 84500,
        "baseline_engagement_rate": 0.052,
        "category": "Tech & Coding",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
    },
    {
        "creator_id": "c_yt_02",
        "name": "Mindful Founder",
        "handle": "@mindful_founder",
        "platform": "youtube",
        "follower_count": 210000,
        "baseline_engagement_rate": 0.041,
        "category": "Entrepreneurship",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80"
    },
    # Instagram creators
    {
        "creator_id": "c_ig_01",
        "name": "Sonia | AI & Design",
        "handle": "@sonia.designs.ai",
        "platform": "instagram",
        "follower_count": 62000,
        "baseline_engagement_rate": 0.068,
        "category": "Design & AI",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
    },
    {
        "creator_id": "c_ig_02",
        "name": "Urban Fitness Beats",
        "handle": "@urbanfitnessbeats",
        "platform": "instagram",
        "follower_count": 145000,
        "baseline_engagement_rate": 0.049,
        "category": "Health & Lifestyle",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
    },
    # Twitter / X creators
    {
        "creator_id": "c_tw_01",
        "name": "Rohan Builders",
        "handle": "@rohan_builds",
        "platform": "twitter",
        "follower_count": 48200,
        "baseline_engagement_rate": 0.038,
        "category": "SaaS & Startups",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
    },
    {
        "creator_id": "c_tw_02",
        "name": "DataBytes Daily",
        "handle": "@databytes_hq",
        "platform": "twitter",
        "follower_count": 92300,
        "baseline_engagement_rate": 0.034,
        "category": "Data Science",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80"
    },
    # LinkedIn creators
    {
        "creator_id": "c_li_01",
        "name": "Ananya Sharma",
        "handle": "ananya-sharma-product",
        "platform": "linkedin",
        "follower_count": 38900,
        "baseline_engagement_rate": 0.045,
        "category": "Product Leadership",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    },
    {
        "creator_id": "c_li_02",
        "name": "Marcus Vance",
        "handle": "marcus-vance-b2b",
        "platform": "linkedin",
        "follower_count": 71500,
        "baseline_engagement_rate": 0.039,
        "category": "B2B Growth",
        "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80"
    }
]

SAMPLE_TITLES = {
    "youtube": [
        "Why 90% of Junior Devs Fail Technical Interviews (And How to Fix It)",
        "I Built a Full-Stack AI SaaS in 48 Hours with Cursor",
        "The Death of Clean Code: What Tech Leads Actually Care About",
        "How I Automated My Entire YouTube Workflow Using Python",
        "Stop Learning Frameworks First: The Fundamentals Masterclass",
        "Day in the Life of a Senior Backend Architect at 30",
        "Microservices vs Monolith: What 5 Years of Scaling Taught Us",
        "Top 7 System Design Mistakes Every Senior Engineer Makes",
        "The Complete Docker & Kubernetes Roadmap for 2026",
        "Why Rust is Replacing C++ in Modern Infrastructure"
    ],
    "instagram": [
        "Stop scrolling if you want to double your UI design speed! ⚡",
        "3 Figma plugins that feel illegal to know in 2026 🎨✨",
        "The 15-minute morning routine that rebuilt my focus and energy",
        "How color theory actually drives $100k e-commerce conversions 💡",
        "Save this carousel before your next client pitch deck! 📌",
        "Dark mode vs Light mode: What eye tracking studies actually prove",
        "5 typography rules top brands never break 🖋️",
        "From burned out freelancer to agency owner: 3 brutal lessons",
        "Watch this before buying another design course! 🚨",
        "The micro-habit that fixed my posture while desk working 🧘‍♂️"
    ],
    "twitter": [
        "Most engineers overcomplicate caching. Here is the 1-page mental model that scales to 1M req/s: 🧵👇",
        "Unpopular opinion: If your MVP needs Kubernetes, your problem isn't infrastructure, it's focus.",
        "The best tech stack for a solo developer in 2026: Fast, cheap, and zero maintenance headache.",
        "10 prompts I use every single day to write production-grade code 3x faster:",
        "Why early-stage startups fail at distribution (and how to find your first 100 paying customers):",
        "Stop writing 50-line pull request descriptions. Write this 3-bullet template instead.",
        "The difference between junior and staff engineers in one screenshot:",
        "Cold outreach that doesn't feel spammy: The 4-sentence framework that gets 68% reply rate.",
        "Simple database index mistake that cost a FinTech startup $14,000 in cloud bills last month.",
        "The smartest people in tech don't have better brains. They just have better search queries."
    ],
    "linkedin": [
        "After interviewing 120+ Product Managers, here is the exact difference between the top 1% and the rest.",
        "We almost killed our best-selling B2B feature last quarter. Here is the customer research that saved it.",
        "Why the 40-hour work week is obsolete for knowledge workers (and what high-performing teams do instead).",
        "Promotion isn't about working harder. It is about solving problems your manager does not even know exist yet.",
        "3 uncomfortable truths every first-time tech manager needs to hear before their first 1:1:",
        "If you want to build trust with executive leadership, never give a metric without these 2 companion data points.",
        "The biggest career mistake I made in my 20s was confusing loyalty with growth.",
        "How we reduced our customer churn from 4.8% to 1.1% without lowering prices or hiring more support agents.",
        "A leader's job is not to have all the answers. It is to ask the question that reveals the blind spot.",
        "Framework for saying 'No' to stakeholder requests without damaging cross-functional relationships."
    ]
}

POST_TYPES = {
    "youtube": ["long_video", "short", "livestream"],
    "instagram": ["reel", "carousel", "single_image", "story_highlight"],
    "twitter": ["thread", "single_tweet", "poll", "image_tweet"],
    "linkedin": ["story_post", "carousel", "article", "poll"]
}

def generate_synthetic_dataset():
    """Generates synthetic creators, posts, comments, snapshots, trends, predictions, drafts."""
    now = datetime.now(timezone.utc)
    posts = []
    post_counter = 1

    # Generate 1800 historical posts across 8 creators spanning 180 days
    for creator in CREATOR_PROFILES:
        platform = creator["platform"]
        base_rate = creator["baseline_engagement_rate"]
        followers = creator["follower_count"]
        
        # 225 posts per creator = 1800 total posts
        num_posts = 225
        
        creator_posts = []
        for i in range(num_posts):
            # Days ago: spread smoothly across 180 days
            days_ago = (180 * (num_posts - i)) / num_posts + random.uniform(-0.4, 0.4)
            days_ago = max(0.1, days_ago)
            pub_date = now - timedelta(days=days_ago)
            
            p_type = random.choice(POST_TYPES[platform])
            base_title = random.choice(SAMPLE_TITLES[platform])
            # slight variation in title
            title = f"{base_title} #{i+1}" if (i % 3 == 0) else base_title
            title_length = len(title)
            
            # Platform specific hashtags & duration
            if platform == "youtube":
                hashtag_count = random.randint(2, 6)
                duration_sec = random.randint(30, 60) if p_type == "short" else random.randint(300, 1500)
            elif platform == "instagram":
                hashtag_count = random.randint(4, 18)
                duration_sec = random.randint(15, 60) if p_type == "reel" else 0
            elif platform == "twitter":
                hashtag_count = random.randint(0, 4)
                duration_sec = 0
            else: # linkedin
                hashtag_count = random.randint(2, 6)
                duration_sec = 0

            post_hour = pub_date.hour
            post_weekday = pub_date.weekday()
            
            # Compute a synthetic engagement multiplier based on features
            # This creates a realistic, learnable latent structure without deterministic leakage
            score = 1.0
            
            # Hour effect: 9-11 or 17-20 is good
            if (9 <= post_hour <= 12) or (17 <= post_hour <= 20):
                score += 0.25
            elif post_hour < 6 or post_hour > 22:
                score -= 0.35
                
            # Weekday effect: Tue-Thu or Sun evening
            if post_weekday in [1, 2, 3]:
                score += 0.15
            elif post_weekday == 5: # Saturday
                score -= 0.20
                
            # Content format affinity
            if platform == "youtube" and p_type in ["long_video", "short"]:
                score += 0.20
            elif platform == "instagram" and p_type in ["reel", "carousel"]:
                score += 0.30
            elif platform == "twitter" and p_type == "thread":
                score += 0.25
            elif platform == "linkedin" and p_type in ["carousel", "story_post"]:
                score += 0.25
                
            # Hashtag moderation
            if platform == "twitter" and hashtag_count > 3:
                score -= 0.25
            elif platform == "instagram" and (5 <= hashtag_count <= 12):
                score += 0.20
                
            # Title length sweet spot (40-85 characters)
            if 40 <= title_length <= 85:
                score += 0.18
                
            # Random volatility (log-normal heavy tail like real social media)
            noise = math.exp(random.gauss(0, 0.45))
            final_mult = max(0.15, score * noise)
            
            simulated_er = base_rate * final_mult
            
            # Calculate views, likes, comments, shares, impressions
            base_impressions = int(followers * random.uniform(0.15, 0.55) * final_mult)
            impressions = max(50, base_impressions)
            views = int(impressions * random.uniform(0.6, 0.95))
            likes = int(views * simulated_er * 0.75)
            comments_count = int(views * simulated_er * 0.15)
            shares_count = int(views * simulated_er * 0.10)
            
            post_item = {
                "post_id": f"p_{platform[:2]}_{post_counter:04d}",
                "creator_id": creator["creator_id"],
                "creator_name": creator["name"],
                "platform": platform,
                "post_type": p_type,
                "title": title,
                "title_length": title_length,
                "hashtag_count": hashtag_count,
                "duration_sec": duration_sec,
                "post_hour": post_hour,
                "post_weekday": post_weekday,
                "creator_avg_engagement": round(base_rate, 4),
                "follower_count": followers,
                "published_at": pub_date.isoformat(),
                "views": views,
                "likes": likes,
                "comments": comments_count,
                "shares": shares_count,
                "impressions": impressions,
                "engagement_rate": round(simulated_er, 4),
                "is_breakout": False # will be set via percentile threshold
            }
            creator_posts.append(post_item)
            post_counter += 1
            
        # Determine breakout label: top 10% of that creator's own recent posts (realistic imbalance ~10%)
        creator_posts.sort(key=lambda x: x["engagement_rate"], reverse=True)
        breakout_count = int(len(creator_posts) * 0.10)
        for idx, p in enumerate(creator_posts):
            p["is_breakout"] = (idx < breakout_count)
            
        posts.extend(creator_posts)

    # Sort all posts chronologically by published_at
    posts.sort(key=lambda x: x["published_at"])
    
    # Generate Metric Snapshots (last 30 days time series for dashboard charts)
    snapshots = []
    for d in range(30, -1, -1):
        snapshot_date = (now - timedelta(days=d)).date().isoformat()
        for plat in PLATFORMS:
            # Aggregate stats
            plat_posts = [p for p in posts if p["platform"] == plat and p["published_at"].startswith(snapshot_date)]
            day_views = sum(p["views"] for p in plat_posts) if plat_posts else random.randint(12000, 35000)
            day_likes = sum(p["likes"] for p in plat_posts) if plat_posts else int(day_views * 0.045)
            day_shares = sum(p["shares"] for p in plat_posts) if plat_posts else int(day_views * 0.008)
            day_comments = sum(p["comments"] for p in plat_posts) if plat_posts else int(day_views * 0.006)
            avg_er = (day_likes + day_comments + day_shares) / max(1, day_views)
            
            snapshots.append({
                "date": snapshot_date,
                "platform": plat,
                "views": day_views,
                "likes": day_likes,
                "comments": day_comments,
                "shares": day_shares,
                "engagement_rate": round(avg_er, 4),
                "followers_gained": random.randint(15, 120)
            })

    # Generate Trends
    trends = [
        # YouTube
        {"trend_id": "tr_yt_01", "platform": "youtube", "topic": "Cursor AI Fullstack Build", "category": "AI & Software", "time_window": "24h", "volume": 142000, "growth_rate": "+84%", "strength_score": 92, "sentiment": "bullish", "sample_hooks": ["I built an entire startup in 48 hours without writing boilerplate"]},
        {"trend_id": "tr_yt_02", "platform": "youtube", "topic": "Clean Architecture Reality Check", "category": "Software Engineering", "time_window": "7d", "volume": 310000, "growth_rate": "+45%", "strength_score": 78, "sentiment": "critical", "sample_hooks": ["Why strict Clean Architecture might be destroying your velocity"]},
        {"trend_id": "tr_yt_03", "platform": "youtube", "topic": "Local LLM Running on Mac M4", "category": "Hardware & ML", "time_window": "30d", "volume": 680000, "growth_rate": "+31%", "strength_score": 85, "sentiment": "curious", "sample_hooks": ["Can an M4 Max replace AWS inference entirely?"]},
        
        # Instagram
        {"trend_id": "tr_ig_01", "platform": "instagram", "topic": "Minimalist Glassmorphism UI", "category": "Design & Aesthetics", "time_window": "24h", "volume": 98000, "growth_rate": "+112%", "strength_score": 95, "sentiment": "inspirational", "sample_hooks": ["Stop using flat grey borders. Try this 3-layer blur instead."]},
        {"trend_id": "tr_ig_02", "platform": "instagram", "topic": "Deep Work Desk Setup 2026", "category": "Productivity", "time_window": "7d", "volume": 240000, "growth_rate": "+52%", "strength_score": 81, "sentiment": "lifestyle", "sample_hooks": ["Everything in my zero-distraction workspace that actually improved focus"]},
        {"trend_id": "tr_ig_03", "platform": "instagram", "topic": "Micro-habits for Solopreneurs", "category": "Mindset", "time_window": "30d", "volume": 410000, "growth_rate": "+28%", "strength_score": 74, "sentiment": "motivational", "sample_hooks": ["The 10-minute daily review that saves 10 hours every week"]},

        # Twitter / X
        {"trend_id": "tr_tw_01", "platform": "twitter", "topic": "Agentic Workflows in Production", "category": "AI Systems", "time_window": "24h", "volume": 185000, "growth_rate": "+95%", "strength_score": 94, "sentiment": "optimistic", "sample_hooks": ["Forget single prompt chatbots. 2026 is all about autonomous multi-agent loops."]},
        {"trend_id": "tr_tw_02", "platform": "twitter", "topic": "PostgreSQL vs Specialized Vector DBs", "category": "Databases", "time_window": "7d", "volume": 120000, "growth_rate": "+41%", "strength_score": 79, "sentiment": "debate", "sample_hooks": ["pgvector quietly ate 80% of specialized vector startups. Here is the benchmark."]},
        {"trend_id": "tr_tw_03", "platform": "twitter", "topic": "Solo Founder Revenue Milestones", "category": "Bootstrapping", "time_window": "30d", "volume": 290000, "growth_rate": "+22%", "strength_score": 76, "sentiment": "transparent", "sample_hooks": ["What hit $10k MRR felt like vs what nobody tells you about churn"]},

        # LinkedIn
        {"trend_id": "tr_li_01", "platform": "linkedin", "topic": "Async Communication & Meeting Audits", "category": "Workplace Culture", "time_window": "24h", "volume": 115000, "growth_rate": "+76%", "strength_score": 88, "sentiment": "actionable", "sample_hooks": ["We eliminated 14 hours of recurring meetings. Here is the async format we replaced them with."]},
        {"trend_id": "tr_li_02", "platform": "linkedin", "topic": "Staff PM vs Senior PM Expectations", "category": "Career Growth", "time_window": "7d", "volume": 195000, "growth_rate": "+63%", "strength_score": 83, "sentiment": "educational", "sample_hooks": ["The skill matrix that separates Senior Product Managers from Directors"]},
        {"trend_id": "tr_li_03", "platform": "linkedin", "topic": "B2B Retention in AI Software", "category": "Business Strategy", "time_window": "30d", "volume": 320000, "growth_rate": "+38%", "strength_score": 80, "sentiment": "analytical", "sample_hooks": ["Why 90-day churn is the truest test of product-market fit in enterprise AI"]}
    ]

    # Generate Mock Comments
    comments = [
        {"comment_id": "c_001", "platform": "youtube", "author": "dev_vikram", "text": "This saved me hours of debugging the memory leak! Could you cover how to profile memory in production next?", "sentiment": "positive", "sentiment_score": 0.92, "theme": "how-to & requests", "is_question": True, "published_at": (now - timedelta(hours=3)).isoformat()},
        {"comment_id": "c_002", "platform": "youtube", "author": "sarah_codes", "text": "Great breakdown, but what about latency trade-offs with SQLite vs Postgres in local mode?", "sentiment": "neutral", "sentiment_score": 0.45, "theme": "architecture comparison", "is_question": True, "published_at": (now - timedelta(hours=7)).isoformat()},
        {"comment_id": "c_003", "platform": "youtube", "author": "kunal_t", "text": "Finally someone who admits clean code can be over-engineered. Best tech video this month!", "sentiment": "positive", "sentiment_score": 0.96, "theme": "praise & validation", "is_question": False, "published_at": (now - timedelta(hours=14)).isoformat()},
        {"comment_id": "c_004", "platform": "youtube", "author": "code_critic99", "text": "Audio was a bit too quiet in the intro section around 2:15.", "sentiment": "negative", "sentiment_score": -0.62, "theme": "production quality", "is_question": False, "published_at": (now - timedelta(days=1)).isoformat()},
        {"comment_id": "c_005", "platform": "instagram", "author": "priya_ux", "text": "Where can I find the link to the design tokens spreadsheet? Bio link is broken!", "sentiment": "neutral", "sentiment_score": 0.10, "theme": "resources & access", "is_question": True, "published_at": (now - timedelta(hours=2)).isoformat()},
        {"comment_id": "c_006", "platform": "instagram", "author": "design_rookie", "text": "Slide 4 blew my mind. Color contrast ratios make so much more sense now.", "sentiment": "positive", "sentiment_score": 0.88, "theme": "learning value", "is_question": False, "published_at": (now - timedelta(hours=8)).isoformat()},
        {"comment_id": "c_007", "platform": "twitter", "author": "dan_founder", "text": "How do you handle schema migrations without downtime when scaling this setup?", "sentiment": "neutral", "sentiment_score": 0.35, "theme": "technical depth", "is_question": True, "published_at": (now - timedelta(hours=5)).isoformat()},
        {"comment_id": "c_008", "platform": "twitter", "author": "elena_v", "text": "Disagree on point 3. In enterprise contracts, SOC2 compliance mandates the exact reverse.", "sentiment": "negative", "sentiment_score": -0.55, "theme": "compliance critique", "is_question": False, "published_at": (now - timedelta(hours=12)).isoformat()},
        {"comment_id": "c_009", "platform": "linkedin", "author": "rajiv_leadership", "text": "Spot on Ananya. Managing up is rarely taught in business school but dictates 80% of project momentum.", "sentiment": "positive", "sentiment_score": 0.91, "theme": "leadership insight", "is_question": False, "published_at": (now - timedelta(hours=4)).isoformat()},
        {"comment_id": "c_010", "platform": "linkedin", "author": "meera_talent", "text": "Are you hiring for remote senior PMs in Q3? Would love to share this with our network.", "sentiment": "positive", "sentiment_score": 0.79, "theme": "careers & networking", "is_question": True, "published_at": (now - timedelta(hours=18)).isoformat()}
    ]

    # Generate Mock Predictions History (for accuracy scoreboard & calibration)
    predictions_history = [
        {
            "prediction_id": "pred_001",
            "created_at": (now - timedelta(days=14)).isoformat(),
            "platform": "youtube",
            "post_type": "long_video",
            "title": "Why Senior Engineers Reject Microservices in 2026",
            "predicted_prob": 0.24,
            "base_rate": 0.052,
            "probability_ratio": 4.6,
            "strictness": "top_10%",
            "confidence_level": "medium",
            "top_reasons": ["Optimal title length (52 chars)", "Peak Thursday 18:00 release", "High-interest architecture topic"],
            "actual_outcome": True,
            "actual_views": 84200,
            "actual_engagement_rate": 0.089
        },
        {
            "prediction_id": "pred_002",
            "created_at": (now - timedelta(days=12)).isoformat(),
            "platform": "instagram",
            "post_type": "reel",
            "title": "3 UI Typography Rules You Must Never Break ⚡",
            "predicted_prob": 0.19,
            "base_rate": 0.068,
            "probability_ratio": 2.8,
            "strictness": "top_10%",
            "confidence_level": "medium",
            "top_reasons": ["Reel format format affinity", "Moderate hashtag density (8)", "Strong action hook"],
            "actual_outcome": True,
            "actual_views": 42100,
            "actual_engagement_rate": 0.094
        },
        {
            "prediction_id": "pred_003",
            "created_at": (now - timedelta(days=10)).isoformat(),
            "platform": "twitter",
            "post_type": "single_tweet",
            "title": "Quick update on our website deployment fix",
            "predicted_prob": 0.04,
            "base_rate": 0.038,
            "probability_ratio": 1.05,
            "strictness": "top_10%",
            "confidence_level": "low",
            "top_reasons": ["Short non-hook title", "Off-peak Saturday midnight", "Low shareability factor"],
            "actual_outcome": False,
            "actual_views": 3200,
            "actual_engagement_rate": 0.021
        },
        {
            "prediction_id": "pred_004",
            "created_at": (now - timedelta(days=8)).isoformat(),
            "platform": "linkedin",
            "post_type": "story_post",
            "title": "The exact script I used to negotiate a $40k counter-offer without burning bridges",
            "predicted_prob": 0.28,
            "base_rate": 0.045,
            "probability_ratio": 6.2,
            "strictness": "top_10%",
            "confidence_level": "high",
            "top_reasons": ["Actionable career narrative", "Tuesday 8:30 AM optimal slot", "High bookmark potential"],
            "actual_outcome": True,
            "actual_views": 59000,
            "actual_engagement_rate": 0.078
        },
        {
            "prediction_id": "pred_005",
            "created_at": (now - timedelta(days=6)).isoformat(),
            "platform": "youtube",
            "post_type": "short",
            "title": "Python vs Rust in 30 Seconds",
            "predicted_prob": 0.16,
            "base_rate": 0.052,
            "probability_ratio": 3.1,
            "strictness": "top_10%",
            "confidence_level": "medium",
            "top_reasons": ["Snappy short format", "Comparative polarizing topic", "High initial retention rate"],
            "actual_outcome": False,
            "actual_views": 18200,
            "actual_engagement_rate": 0.048
        },
        {
            "prediction_id": "pred_006",
            "created_at": (now - timedelta(days=4)).isoformat(),
            "platform": "twitter",
            "post_type": "thread",
            "title": "10 mental models from naval that changed how I view software leverage: 🧵👇",
            "predicted_prob": 0.22,
            "base_rate": 0.038,
            "probability_ratio": 5.8,
            "strictness": "top_10%",
            "confidence_level": "high",
            "top_reasons": ["Proven thread hook template", "Zero spam hashtags", "Wednesday lunch peak"],
            "actual_outcome": True,
            "actual_views": 78000,
            "actual_engagement_rate": 0.065
        },
        {
            "prediction_id": "pred_007",
            "created_at": (now - timedelta(days=2)).isoformat(),
            "platform": "instagram",
            "post_type": "single_image",
            "title": "Desk photo on a rainy morning",
            "predicted_prob": 0.05,
            "base_rate": 0.068,
            "probability_ratio": 0.73,
            "strictness": "top_10%",
            "confidence_level": "low",
            "top_reasons": ["Single static image format", "Low informational depth", "Vague caption"],
            "actual_outcome": False,
            "actual_views": 8400,
            "actual_engagement_rate": 0.039
        },
        {
            "prediction_id": "pred_008",
            "created_at": (now - timedelta(days=1)).isoformat(),
            "platform": "linkedin",
            "post_type": "poll",
            "title": "Do you prefer 100% remote, hybrid 2 days, or full office in 2026?",
            "predicted_prob": 0.31,
            "base_rate": 0.045,
            "probability_ratio": 6.9,
            "strictness": "top_10%",
            "confidence_level": "high",
            "top_reasons": ["Poll engagement flywheel", "Broad professional relevance", "Low barrier to interact"],
            "actual_outcome": None, # Pending evaluation
            "actual_views": None,
            "actual_engagement_rate": None
        }
    ]

    # Generate Mock Drafts
    drafts = [
        {
            "draft_id": "draft_001",
            "platform": "youtube",
            "title": "How to Build a Production Agentic Loop with Python & FastAPI",
            "status": "scheduled",
            "scheduled_date": (now + timedelta(days=2, hours=4)).isoformat(),
            "tags": ["python", "ai", "fastapi", "agents"],
            "language": "English",
            "hook": "95% of AI tutorials build a toy chatbot that breaks in production. Let's build a real agent that recovers from errors.",
            "created_at": (now - timedelta(days=2)).isoformat()
        },
        {
            "draft_id": "draft_002",
            "platform": "instagram",
            "title": "5 Glassmorphism Mistakes Designers Still Make in 2026",
            "status": "drafted",
            "scheduled_date": None,
            "tags": ["uidesign", "figma", "webdesign", "uxdesign"],
            "language": "English",
            "hook": "Your glassmorphism looks cheap because of this one missing inner shadow. Fix it in 10 seconds.",
            "created_at": (now - timedelta(days=1)).isoformat()
        },
        {
            "draft_id": "draft_003",
            "platform": "twitter",
            "title": "The Solo Founder Playbook: 0 to 10k MRR Without VC Money",
            "status": "idea",
            "scheduled_date": None,
            "tags": ["saas", "indiehackers", "buildinpublic"],
            "language": "English",
            "hook": "Raising VC is buying fuel before building the engine. Here is how 6 founders bootstrapped to profitability:",
            "created_at": (now - timedelta(hours=16)).isoformat()
        },
        {
            "draft_id": "draft_004",
            "platform": "linkedin",
            "title": "Why I Stopped Doing 30-Minute Status Calls With My Team",
            "status": "published",
            "scheduled_date": (now - timedelta(days=3)).isoformat(),
            "tags": ["management", "productivity", "leadership"],
            "language": "English",
            "hook": "If your team needs a daily call to know what to work on, you have a documentation problem, not a communication problem.",
            "created_at": (now - timedelta(days=4)).isoformat()
        }
    ]

    # Save to disk
    files_to_save = {
        "creators.json": CREATOR_PROFILES,
        "posts.json": posts,
        "metric_snapshots.json": snapshots,
        "comments.json": comments,
        "trends.json": trends,
        "predictions.json": predictions_history,
        "drafts.json": drafts
    }

    for filename, content in files_to_save.items():
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        print(f"Saved: {filepath} ({len(content)} items)")

    print(f"\n[OK] Synthetic generation complete! Total posts generated: {len(posts)}")
    breakouts = sum(1 for p in posts if p["is_breakout"])
    print(f"Total breakouts: {breakouts} ({breakouts/len(posts)*100:.1f}%)")

if __name__ == "__main__":
    generate_synthetic_dataset()
