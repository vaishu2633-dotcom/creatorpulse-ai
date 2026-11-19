"""
CreatorPulse AI - Labeled Sentiment Dataset Builder
---------------------------------------------------
Constructs a balanced, realistic, diverse 3-class YouTube comment sentiment dataset:
- Positive (praise, gratitude, excitement, strong recommendations, learning delight)
- Negative (complaints, bugs, anger, disappointment, bad audio/visuals, clickbait critiques)
- Neutral (technical questions, timestamps, environment inquiries, factual notes, neutral requests)

Balanced across domain terms (video, tutorial, channel, this) so no domain noun
acts as an accidental sentiment predictor.
"""

import os
import csv
import random

# Base curated positive comments reflecting real YouTube community praise
BASE_POSITIVE = [
    "This is the clearest explanation of this concept I have ever seen! Thank you so much.",
    "Great explanation! Really helped me understand this difficult topic.",
    "Best video on this topic hands down. Clean, concise, and straight to the point.",
    "I was stuck on this exact bug for 3 days and your tutorial fixed it in 2 minutes!",
    "Subscribed immediately! You deserve way more subscribers for this quality.",
    "The hook in the intro was brilliant, hooked me from the first 5 seconds.",
    "Incredible breakdown! Really appreciate you sharing the source code in the description.",
    "I loved this tutorial so much, really well explained and easy to follow.",
    "Loved this video, straight to the point without filler.",
    "This helped me pass my technical interview today! Forever grateful to this channel.",
    "Nice video bro, loved the pacing and editing style.",
    "Good video, very informative and practical.",
    "Such an underrated creator, every single upload is pure gold.",
    "Brilliant editing and pacing, kept me engaged throughout the entire video.",
    "Thank you for not adding 5 minutes of filler intro, straight to the value!",
    "Amazing work as always! Looking forward to part 2.",
    "Super clean code architecture, learned a ton of best practices.",
    "Great presentation skills and very well articulated thoughts.",
    "The visual diagrams made the complex architecture so easy to grasp.",
    "Keep up the awesome work, you are doing incredible service to the community.",
    "This is literally better than most paid courses I took in college.",
    "Brilliant insight on scaling, especially the caching layer explanation.",
    "Huge fan of your content! Always looking forward to your notifications.",
    "The step by step walkthrough was flawless. Everything worked on the first try.",
    "Very helpful tips for beginners and experienced devs alike. Top notch!",
    "I really like the format with timestamps and clear chapter summaries.",
    "Spectacular video! Shared this with my entire study group.",
    "Wonderful tutorial, very patient and detailed explanations.",
    "Love your channel! Always learn something new from your uploads.",
    "Hands down the most practical guide available right now.",
    "Outstanding job breaking down the new features in this release.",
    "Finally someone explains this concept without making it overly academic! Loved it.",
    "The audio was crisp, visuals were stunning, and content was gold. 10/10 video.",
    "I was skeptical at first but this pattern actually works like a charm. Kudos!",
    "Great creator, great content, always dropping genuine gems.",
    "This saved my weekend project from being scrapped. Massive respect!",
    "Loved the humor sprinkled throughout, made learning complex topics so enjoyable.",
    "Your explanation of database indexes was mind blowing. It finally clicked!",
    "Very well structured presentation. No fluff, just pure actionable engineering.",
    "One of the few YouTube channels where I actually watch every second without skipping.",
    "Thank you for demonstrating testing and edge cases instead of just a toy demo.",
    "Brilliant video! The animated diagrams were especially helpful.",
    "Can confirm this works seamlessly in production. Great advice!",
    "This is pure gold. Deserves at least a million views.",
    "You have a real gift for teaching complex topics simply.",
    "Phenomenal breakdown! Subscribed and shared with my colleagues.",
    "The depth of research you put into this video is staggering. Thank you!",
    "Awesome explanation, your channel is quickly becoming my favorite learning hub.",
    "I have been a senior engineer for 10 years and still learned three new tricks today.",
    "Flawless execution! Thank you for sharing your deep expertise.",
    "Genuinely one of the best technical channels on YouTube right now.",
    "Everything worked smoothly on my local machine. High quality tutorial!",
    "Your content has literally accelerated my career growth. Thank you!",
    "Clear, concise, and incredibly practical. Keep up the great work!",
    "Super useful tips! That shortcut alone was worth watching the entire video.",
    "Incredible pacing and top-notch audio quality. A pleasure to watch.",
    "So refreshing to see real-world edge cases covered so thoroughly.",
    "You explained in 10 minutes what my university professor could not in a semester.",
    "The code examples were extremely readable and well documented.",
    "Instant like and subscribe! Looking forward to your next upload.",
    "Really interesting perspective, thanks for sharing this insight.",
    "Cool video! Love how you broke down the architecture simply.",
    "Enjoyed this video immensely, learned a lot from your walkthrough.",
    "Well done! This answered every single question I had.",
    "Super cool project, works like a charm on Windows.",
    "Very clear explanation, thank you for making this accessible.",
    "Great video!",
    "Good video, very helpful.",
    "Nice video bro, well explained.",
    "Loved this tutorial, thank you!",
    "Loved this video, amazing content.",
    "Super helpful, learned a lot from this.",
    "Awesome content as always!",
    "Clear and concise, brilliant work.",
    "Thanks for sharing this tutorial!",
    "Best video ever on this channel.",
    "Well done video, straight to the point.",
    "Really interesting topic, loved it."
]

# Base curated negative comments reflecting real YouTube community complaints
BASE_NEGATIVE = [
    "The audio is way too quiet and the background music is deafening. Could not hear.",
    "This does not work at all. It completely broke my environment after following step 3.",
    "Total clickbait title and thumbnail, none of that was actually covered in the video.",
    "Waste of 15 minutes. You spent 10 minutes talking about nothing and 5 minutes copying code.",
    "The code in your GitHub repository is full of syntax errors and missing dependencies.",
    "Horrible pacing, you speak way too fast and skipped the most critical configuration steps.",
    "Very disappointed with this upload. The previous video was much better.",
    "Outdated information, this API was deprecated two years ago and does not work anymore.",
    "Terrible explanation. If you do not understand the algorithm yourself, do not make a tutorial.",
    "Too many sponsored ads every 2 minutes. The viewing experience is completely ruined.",
    "This solution has a massive security vulnerability that you completely ignored.",
    "I followed every single step and got a 500 internal server error. No help in comments either.",
    "Completely useless video, just read the official documentation instead.",
    "The screen resolution was so blurry I could not read a single line of terminal code.",
    "Very misleading benchmarks, you compared an unoptimized baseline with your cached system.",
    "This is completely wrong. You are teaching bad habits that will fail in production.",
    "Dislike and unsubscribed. Tired of these exaggerated promises that deliver nothing.",
    "Terrible advice for junior engineers, do not listen to this.",
    "The microphone quality hurts my ears, please invest in a decent mic.",
    "Zero original content, literally just copied the popular Medium article from last week.",
    "I regret watching this, absolute waste of time and zero substance.",
    "The camera was out of focus half the time and the cuts were jarring.",
    "You completely dodged the hardest part of the problem in the conclusion.",
    "Not working in 2026. Throws a TypeError on startup. Please delete or update.",
    "Very arrogant tone throughout the video, really put me off.",
    "Boring and repetitive, you repeated the same point 5 times in 10 minutes.",
    "Broken link in description, broken code in repo, zero responses to issues.",
    "Does not address the edge cases at all. As soon as you have more than 10 users this crashes.",
    "Over-engineered mess. Nobody needs 15 abstractions for a simple CRUD app.",
    "Frustrating experience trying to follow along with missing files.",
    "Why did you blur out the most important command in the terminal? Completely useless.",
    "This broke my local database and deleted my test migrations. Awful tutorial.",
    "Half the video is just you self-promoting your course. Very annoying.",
    "The title says beginner friendly but you used complex jargon without explaining anything.",
    "Honestly one of the worst tutorials I have seen on this topic.",
    "You forgot to include the requirements.txt file so nothing runs.",
    "Extremely superficial overview. Does not explain how anything actually works under the hood.",
    "Can not stand the aggressive jump cuts and loud sound effects every 5 seconds.",
    "This approach has terrible memory leaks. Our production server ran out of memory in an hour.",
    "Misleading thumbnail showing graphs that were not even mentioned in the video.",
    "The audio sync is completely off by almost two seconds throughout the whole video.",
    "Do not waste your time with this video, the code repository is archived and abandoned.",
    "Horribly structured. You jumped back and forth between files without telling viewers where you were.",
    "You glossed over the entire authentication setup which was the main reason I clicked.",
    "Terrible performance. This algorithm takes O(n^2) when it could easily be done in O(n).",
    "Not recommended at all. Look elsewhere if you want an accurate explanation.",
    "The fonts in your editor were tiny and unreadable on mobile screens.",
    "Very poor audio mixing, had to constantly adjust my volume.",
    "Your package versions conflict with each other and pip refuses to install.",
    "Waste of time, completely unhelpful and full of factual errors.",
    "Disappointed. Expected a deep dive and got a 5-minute superficial summary.",
    "This does not solve the problem at scale, fails immediately with 100 concurrent requests.",
    "Why make a 25-minute video for something that can be explained in 2 paragraphs?",
    "The instructions in the README are completely different from what you did in the video.",
    "Total failure of a tutorial. Nothing worked as demonstrated.",
    "Your advice directly contradicts the official documentation and best practices.",
    "The intro was so long and tedious I almost closed the tab before the topic even started.",
    "Poor video editing and very sloppy code formatting throughout.",
    "I tried asking for help on your Discord and was immediately banned for asking a basic question.",
    "Unsubscribed. The quality of this channel has really gone downhill lately.",
    "Terrible tutorial, bad audio and full of mistakes.",
    "Awful pacing and zero explanations for why line 12 is needed.",
    "Completely broken code, throws an UnboundLocalError.",
    "Waste of time.",
    "Complete waste of time, totally unhelpful.",
    "Horrible pacing, way too fast to follow.",
    "Terrible video, could not understand anything.",
    "This does not work, got an error immediately.",
    "Total clickbait, did not explain anything.",
    "Broken code in GitHub, nothing runs.",
    "Awful tutorial, full of errors and bugs.",
    "This is horrible, completely unhelpful.",
    "Very disappointing video, waste of time.",
    "Worst tutorial on YouTube, do not recommend."
]

# Base curated neutral comments reflecting real YouTube community inquiries
BASE_NEUTRAL = [
    "What timestamp does the database migration section start at?",
    "Could you share the link to the GitHub repository mentioned at 04:30?",
    "Is this compatible with Python 3.12 or does it require an older version?",
    "Does this approach work with PostgreSQL or is it SQLite specific?",
    "What font and VS Code theme are you using in this demo?",
    "Can you clarify if this requires a paid API subscription or a free tier?",
    "Video length is 18 minutes and covers 5 sections.",
    "Posted on Tuesday at 4 PM GMT.",
    "The documentation link is in the pinned comment below.",
    "Which operating system was used to run these benchmarks?",
    "Are you planning to make a follow-up video on deploying with Docker?",
    "How does the memory footprint compare between these two libraries?",
    "Can someone tell me the name of the tool shown at 12:15?",
    "This feature was introduced in release version 2.4.0 last month.",
    "Has anyone tested this on Windows PowerShell versus bash on Linux?",
    "What is the average latency measured during the test run?",
    "Is there an official Discord or forum for questions regarding this project?",
    "The chapter marks are available in the progress bar.",
    "Where is the configuration file stored by default on MacOS?",
    "Does this support multi-tenant workspaces out of the box?",
    "What is the difference between approach A and approach B in terms of CPU usage?",
    "Could you provide the slides or PDF notes from the presentation?",
    "Is the model running locally or through a remote cloud endpoint?",
    "How long did it take to train the dataset with 5,000 samples?",
    "What was the dataset size used for the benchmark evaluation?",
    "Can this be integrated with Next.js or is it React Vite only?",
    "The audio was recorded at 48kHz stereo.",
    "Please check if the PR has been merged into main.",
    "At 08:45 you mentioned an alternative package, what was the package name?",
    "Are there any rate limits on the public endpoint for this API?",
    "What is the recommended RAM for running this model locally?",
    "Can this be deployed on AWS Lambda without exceeding execution timeouts?",
    "Where in the settings can we find the API key generation tab?",
    "The video was uploaded on November 15, 2026.",
    "Are you using npm, yarn, or pnpm for managing dependencies in this project?",
    "Does this require an SSL certificate when testing in local development?",
    "What version of Ubuntu was used for the server environment?",
    "Is there a changelog for the latest version update?",
    "How many epochs were used during the training phase?",
    "Can this model handle tabular data or text data only?",
    "Which port does the FastAPI server listen to by default?",
    "Is there a Dockerfile provided in the root directory of the repository?",
    "What is the maximum file upload size supported by the endpoint?",
    "Does the API return JSON or XML by default?",
    "Are there any open pull requests addressing the dependency updates?",
    "How do you configure CORS for multiple frontend origins?",
    "Is the SQLite database file created automatically on initial startup?",
    "What was the batch size used during model evaluation?",
    "Can you share the link to the official documentation page?",
    "What is the schema definition for the user profile table?",
    "Does this tutorial cover unit tests or just integration tests?",
    "How many requests per second can this endpoint handle before rate limiting?",
    "Is the background task handled asynchronously with celery or background tasks?",
    "Where can we find the color palette hex codes used in this UI?",
    "What is the default timeout for the HTTP request client?",
    "Does this support dark mode out of the box with Tailwind CSS?",
    "Can you clarify whether the migration script runs before or after the seeder?",
    "What command is used to start the Vite development server?",
    "Is there a pre-commit hook configured for linting and code formatting?",
    "What is the exact license for the starter template code?",
    "How long did it take to build this project from scratch?",
    "Where can I find the source code for part 1 of this tutorial?",
    "What timestamp does the second part start at?",
    "Where is the link to the GitHub repository?",
    "Does this work on Windows and Mac?",
    "Can you do a video on PyTorch next?",
    "How long did it take to build this?",
    "Where can I find the slides or notes?",
    "What version of Python is required for this?",
    "Is this tutorial free or does it require a subscription?"
]

# Vocabulary components for systematic, balanced augmentation up to 400 per class
TOPICS = [
    "Python scripting", "machine learning pipeline", "FastAPI backend", "React frontend",
    "Docker container", "database indexing", "system design", "data structures",
    "REST API endpoint", "Tailwind styling", "algorithm analysis", "web development",
    "backend architecture", "frontend design", "cloud computing", "SQL queries",
    "async programming", "unit testing", "TF-IDF feature extraction", "code optimization",
    "authentication flow", "state management", "WebSocket server", "microservices setup"
]

POS_TEMPLATES = [
    ("Great video on {topic}! Really appreciate the clear explanation.", "good"),
    ("Awesome tutorial covering {topic}. Learned a lot from this walkthrough!", "good"),
    ("Loved this video about {topic}! Very helpful and easy to follow.", "good"),
    ("Such a good explanation of {topic}. Best guide on YouTube hands down!", "good"),
    ("Super clear and concise breakdown of {topic}. Thank you so much!", "good"),
    ("Nice video bro! The {topic} section was brilliantly explained.", "good"),
    ("Cool project! Everything about {topic} works like a charm on my end.", "good"),
    ("Really interesting perspective on {topic}. Thanks for sharing your insights!", "good"),
    ("Fantastic video! Your walkthrough on {topic} saved me tons of time.", "good"),
    ("Subscribed immediately! Wonderful tutorial on {topic}, very well done.", "good"),
    ("I finally understand {topic} after watching this video. Great creator!", "good"),
    ("Incredible quality tutorial on {topic}. Highly recommended for everyone!", "good"),
    ("Enjoyed this video about {topic}. Looking forward to part 2!", "good"),
    ("Outstanding presentation on {topic}. Clean code and great examples.", "good"),
    ("The explanation of {topic} was pure gold. Thank you for making this video!", "good"),
    ("Love this channel and this video on {topic}! Always learn so much.", "good"),
    ("Very informative and helpful tutorial on {topic}. Learned a lot!", "good"),
    ("Well done video on {topic}! Everything was super clear and easy to follow.", "good"),
    ("I love how you explained {topic}. Clean, practical, and very helpful!", "good"),
    ("Fascinating breakdown of {topic}! One of the best videos I have watched.", "good")
]

NEG_TEMPLATES = [
    ("Terrible video on {topic}. The audio is quiet and explanation is confusing.", "bad"),
    ("This tutorial on {topic} does not work at all. Got an unhandled error on startup.", "bad"),
    ("Total clickbait video about {topic}. None of the promised features were shown.", "bad"),
    ("Waste of time. The {topic} code in GitHub is completely broken and outdated.", "bad"),
    ("Horrible pacing in this video covering {topic}. Way too fast and skipped vital steps.", "bad"),
    ("Very disappointed with this tutorial on {topic}. Bad explanations throughout.", "bad"),
    ("Unsubscribed. The {topic} tutorial is full of syntax errors and bugs.", "bad"),
    ("Worst guide on {topic} I have seen. Completely unhelpful and full of mistakes.", "bad"),
    ("Does not work for {topic}. Throws a runtime error and crashes immediately.", "bad"),
    ("Awful tutorial about {topic}. Extremely superficial and zero practical value.", "bad"),
    ("The code for {topic} does not run on modern versions. Broken dependencies.", "bad"),
    ("Misleading title regarding {topic}. You spent 10 minutes talking about nothing.", "bad"),
    ("Poor video quality and very sloppy code formatting in the {topic} section.", "bad"),
    ("Cannot recommend this video on {topic}. Full of factual errors and bad advice.", "bad"),
    ("Frustrating experience trying to follow the {topic} tutorial. Missing files in repo.", "bad")
]

NEU_TEMPLATES = [
    ("What timestamp does the {topic} section start at in this video?", "question"),
    ("Does this tutorial on {topic} support Python 3.12 or an older version?", "question"),
    ("Is the source code for {topic} available in the GitHub repository?", "question"),
    ("Can this approach for {topic} be deployed on Windows and Linux?", "question"),
    ("What is the difference between approach A and B for {topic}?", "question"),
    ("Could you share the slides or notes from the {topic} presentation?", "question"),
    ("Which operating system was used during the demo of {topic}?", "question"),
    ("Are there any rate limits or memory constraints when running {topic}?", "question"),
    ("Does this video cover unit testing for {topic} or just the basics?", "question"),
    ("What version of the library was used for {topic} in this tutorial?", "question"),
    ("Can someone clarify if {topic} requires a paid subscription or free tier?", "question"),
    ("How long did it take to train the benchmark model for {topic}?", "question"),
    ("Are you planning to make a follow-up video covering advanced {topic}?", "question"),
    ("Where is the configuration file stored by default for {topic}?", "question"),
    ("Is there an official documentation link for {topic} in the description?", "question")
]


def build_sentiment_dataset(output_path: str, count_per_class: int = 400):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    random.seed(42)

    pos_samples = list(BASE_POSITIVE)
    neg_samples = list(BASE_NEGATIVE)
    neu_samples = list(BASE_NEUTRAL)

    # Augment Positive to exactly count_per_class
    pos_set = set(pos_samples)
    for topic in TOPICS:
        for tpl, _ in POS_TEMPLATES:
            text = tpl.format(topic=topic)
            pos_set.add(text)
            if len(pos_set) >= count_per_class:
                break
        if len(pos_set) >= count_per_class:
            break
    pos_final = list(pos_set)[:count_per_class]

    # Augment Negative to exactly count_per_class
    neg_set = set(neg_samples)
    for topic in TOPICS:
        for tpl, _ in NEG_TEMPLATES:
            text = tpl.format(topic=topic)
            neg_set.add(text)
            if len(neg_set) >= count_per_class:
                break
        if len(neg_set) >= count_per_class:
            break
    neg_final = list(neg_set)[:count_per_class]

    # Augment Neutral to exactly count_per_class
    neu_set = set(neu_samples)
    for topic in TOPICS:
        for tpl, _ in NEU_TEMPLATES:
            text = tpl.format(topic=topic)
            neu_set.add(text)
            if len(neu_set) >= count_per_class:
                break
        if len(neu_set) >= count_per_class:
            break
    neu_final = list(neu_set)[:count_per_class]

    all_samples = []
    for text in pos_final:
        all_samples.append((text, "positive"))
    for text in neg_final:
        all_samples.append((text, "negative"))
    for text in neu_final:
        all_samples.append((text, "neutral"))

    random.shuffle(all_samples)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "sentiment"])
        for text, sentiment in all_samples:
            writer.writerow([text, sentiment])

    print(f"Sentiment dataset successfully written to {output_path}")
    print(f"Total samples: {len(all_samples)} (Positive: {len(pos_final)}, Negative: {len(neg_final)}, Neutral: {len(neu_final)})")


if __name__ == "__main__":
    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "dataset", "sentiment_dataset.csv"))
    build_sentiment_dataset(out_file, count_per_class=400)
