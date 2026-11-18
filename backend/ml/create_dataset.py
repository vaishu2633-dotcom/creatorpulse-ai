"""
CreatorPulse AI - Labeled Sentiment Dataset Builder
---------------------------------------------------
Constructs a balanced, realistic, diverse 3-class social media sentiment dataset:
- Positive (praise, gratitude, excitement, strong recommendations, humor, delight)
- Negative (complaints, bugs, anger, disappointment, bad audio/visuals, clickbait critiques)
- Neutral (technical questions, timestamps, environment inquiries, factual notes, neutral requests)
"""

import os
import csv
import random

POSITIVE_COMMENTS = [
    "This is the clearest explanation of this concept I have ever seen! Thank you so much.",
    "Absolutely fantastic video, the production quality has improved so much.",
    "I was stuck on this exact bug for 3 days and your solution fixed it in 2 minutes!",
    "Subscribed immediately! You deserve way more subscribers for this quality.",
    "Best tutorial on the platform hands down. Clean, concise, and straight to the point.",
    "The hook in the intro was brilliant, hooked me from the first 5 seconds.",
    "Incredible breakdown! Really appreciate you sharing the source code in the description.",
    "I love how you explained the trade-offs instead of just showing the happy path.",
    "This helped me pass my technical interview today! Forever grateful to this channel.",
    "Such an underrated creator, every single upload is pure gold.",
    "Brilliant editing and pacing, kept me engaged throughout the entire 20 minutes.",
    "Thank you for not adding 5 minutes of filler intro, straight to the value!",
    "Amazing work as always! Looking forward to part 2.",
    "This framework changed how our entire team builds apps in production.",
    "Love the honesty and real-world examples, very refreshing to see.",
    "Super clean code architecture, learned a ton of best practices.",
    "Great presentation skills and very well articulated thoughts.",
    "The visual diagrams made the complex architecture so easy to grasp.",
    "Keep up the awesome work, you are doing incredible service to the developer community.",
    "This is literally better than most paid courses I took in college.",
    "Brilliant insight on scaling, especially the caching layer explanation.",
    "Huge fan of your content! Always looking forward to your notifications.",
    "The step by step walkthrough was flawless. Everything worked on the first try.",
    "Very helpful tips for beginners and seniors alike. Top notch!",
    "I really like the new format with timestamps and chapter summaries.",
    "Spectacular video! Sent this to our entire slack channel.",
    "Wonderful tutorial, very patient and detailed explanations.",
    "Love the energy and passion you bring to teaching tech.",
    "Hands down the most practical guide available right now.",
    "Outstanding job breaking down the new features in this release.",
    "Finally someone explains async IO without making it overly academic! Loved it.",
    "The audio was crisp, visuals were stunning, and content was gold. 10/10.",
    "I was skeptical at first but this pattern actually cut our build times by half. Kudos!",
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
    "Phenomenal breakdown! Subscribed and shared with my study group.",
    "The depth of research you put into this video is staggering. Thank you!",
    "Every developer needs to watch this before writing their first microservice.",
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
    "You explained in 10 minutes what my university professor couldn't in an entire semester.",
    "The code examples were extremely readable and well documented.",
    "Instant like and subscribe! Looking forward to your next upload.",
]

NEGATIVE_COMMENTS = [
    "The audio is way too quiet and the background music is deafening. Couldn't watch.",
    "This does not work at all. It completely broke my environment after following step 3.",
    "Total clickbait title and thumbnail, none of that was actually covered in the video.",
    "Waste of 15 minutes. You spent 10 minutes talking about nothing and 5 minutes copying code.",
    "The code in your GitHub repository is full of syntax errors and missing dependencies.",
    "Horrible pacing, you speak way too fast and skipped the most critical configuration steps.",
    "Very disappointed with this upload. The previous video was much better.",
    "Outdated information, this API was deprecated two years ago and doesn't work anymore.",
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
    "Doesn't address the edge cases at all. As soon as you have more than 10 users this crashes.",
    "Over-engineered mess. Nobody needs 15 abstractions for a simple CRUD app.",
    "Frustrating experience trying to follow along with missing files.",
    "Why did you blur out the most important command in the terminal? Completely useless.",
    "This broke my local database and deleted my test migrations. Awful tutorial.",
    "Half the video is just you self-promoting your course. Very annoying.",
    "The title says beginner friendly but you used complex jargon without explaining anything.",
    "Honestly one of the worst tutorials I have seen on this topic.",
    "You forgot to include the requirements.txt file so nothing runs.",
    "Extremely superficial overview. Doesn't explain how anything actually works under the hood.",
    "Can't stand the aggressive jump cuts and loud sound effects every 5 seconds.",
    "This approach has terrible memory leaks. Our production server ran out of memory in an hour.",
    "Misleading thumbnail showing graphs that weren't even mentioned in the video.",
    "The audio sync is completely off by almost two seconds throughout the whole video.",
    "Don't waste your time with this video, the code repository is archived and abandoned.",
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
]

NEUTRAL_COMMENTS = [
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
]

# Variations and perturbations to generate 1,200 unique, realistic social media samples
SUBJECTS = [
    "FastAPI backend", "React frontend", "Docker container", "PostgreSQL database",
    "SQLite setup", "Tailwind styling", "Machine learning pipeline", "TF-IDF vectorizer",
    "Linear SVM model", "Naive Bayes classifier", "Logistic regression", "OAuth 2.0 flow",
    "YouTube API integration", "X Twitter adapter", "Sentiment analysis engine", "Vite build",
    "WebSocket connection", "REST API endpoint", "State management", "Unit test suite"
]

POS_MODIFIERS = [
    "Works like a charm", "Super smooth and reliable", "Truly impressed by this",
    "Clean and well documented", "Saved me tons of debugging time", "Absolute masterpiece",
    "Great work by the team", "Super easy to get started with", "Highly recommended for everyone",
    "Hands down the best approach"
]

NEG_MODIFIERS = [
    "Constantly throws unhandled errors", "Fails to run on modern versions", "Extremely slow and buggy",
    "Completely broke my local setup", "Worst documentation I have seen", "Very poor performance",
    "Cannot recommend this to anyone", "Full of syntax errors and bugs", "Zero error handling provided",
    "Total waste of time and effort"
]

NEU_MODIFIERS = [
    "What is the recommended configuration for", "Is there official documentation available for",
    "Can you provide more details regarding", "How does this compare to standard alternatives for",
    "What version was used during the demo of", "Does this require special permissions for",
    "Where is the source code located for", "Are there benchmarks available for",
    "What is the default port used by", "Has anyone tested this on Windows for"
]


def build_sentiment_dataset(output_path: str, count_per_class: int = 400):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    random.seed(1337)

    samples = []

    pos_set = set(POSITIVE_COMMENTS)
    neg_set = set(NEGATIVE_COMMENTS)
    neu_set = set(NEUTRAL_COMMENTS)

    for subj in SUBJECTS:
        for pmod in POS_MODIFIERS:
            pos_set.add(f"{subj}: {pmod}! Really appreciate the clear guidance.")
            pos_set.add(f"Just tried the {subj}. {pmod}, great job!")
        for nmod in NEG_MODIFIERS:
            neg_set.add(f"{subj}: {nmod}. Disappointed by this guide.")
            neg_set.add(f"Tried using {subj} and it {nmod.lower()}. Needs serious fixes.")
        for numod in NEU_MODIFIERS:
            neu_set.add(f"{numod} {subj}?")
            neu_set.add(f"Quick question: {numod.lower()} {subj}?")

    pos_list = list(pos_set)[:count_per_class]
    neg_list = list(neg_set)[:count_per_class]
    neu_list = list(neu_set)[:count_per_class]

    for text in pos_list:
        samples.append((text, "positive"))
    for text in neg_list:
        samples.append((text, "negative"))
    for text in neu_list:
        samples.append((text, "neutral"))

    random.shuffle(samples)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "sentiment"])
        for text, sentiment in samples:
            writer.writerow([text, sentiment])

    print(f"Sentiment dataset successfully written to {output_path}")
    print(f"Total samples: {len(samples)} (Positive: {len(pos_list)}, Negative: {len(neg_list)}, Neutral: {len(neu_list)})")


if __name__ == "__main__":
    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "dataset", "sentiment_dataset.csv"))
    build_sentiment_dataset(out_file, count_per_class=400)
