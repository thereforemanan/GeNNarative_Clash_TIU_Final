# Bhasha Bloom — Regional Creators Suite

**An AI content workspace for local businesses and regional creators in India.**

> **50% MVP submission:** This README is the full written project explanation for the prototype. The public repository and demo-video URLs are listed below; replace their placeholders before submitting.

Bhasha Bloom helps a creator turn a business idea into social copy they can review and use: two hooks, two longer stories, two offer-and-call-to-action variations, a caption, and hashtags, written in Indian English for a selected platform. The current submission is the team's functional MVP prototype; it demonstrates the core content-generation and draft-saving flow while clearly marking other areas as upcoming.

## Project overview

### The problem

Small businesses and independent creators often need to post regularly but may not have a copywriter, a marketing team, or confidence writing for different social platforms and local audiences. Generic copy can also miss the business's voice or introduce details the owner never confirmed.

### The solution

Bhasha Bloom gives creators one place to describe what they want to promote, add confirmed business facts, choose a platform, and generate a small set of ready-to-review social copy in Indian English. The signed-in account name is included in every generated hook, story, offer, and caption so the result reflects the creator's workspace.

### Who it is for

- Independent creators and artists
- Local shops, food businesses, and service businesses
- Small teams creating social content for regional audiences

### What makes the concept useful

- **Regional-first direction:** the current MVP generates in Indian English. Hindi and Bengali are displayed as upcoming options and are not enabled yet.
- **Choice of platform:** the creator selects Instagram Reels, YouTube Shorts, or Facebook Reels.
- **Creator control:** the creator provides the brief and optional confirmed business details before generating.
- **Fact-aware generation:** the server asks Gemini to avoid unsupported claims and requests a separate fact-review pass. If that review cannot finish, the app still shows the draft and marks it for manual review.
- **A practical workflow:** hooks, stories, offer lines, captions, and hashtags can be saved to the signed-in user's Drafts library.

## MVP features

### Implemented in the current prototype

1. **Account access** — password-based account registration and sign-in, with user-specific sessions.
2. **AI social-copy generation** — submit a business or content idea and receive:
   - Two distinct hooks
   - Two distinct, longer Story and Craft variations
   - Two distinct Offer and CTA variations
   - One concise caption
   - Three to five relevant hashtags
3. **Business-name personalization** — the signed-in account name is added to every hook, story, offer, and caption, and a matching branded hashtag is included.
4. **Language, platform, and tone selection** — Indian English is enabled; Hindi and Bengali are marked upcoming. The creator can choose Instagram Reels, YouTube Shorts, or Facebook Reels, plus a writing tone.
5. **Optional reference photo** — attach a JPG, PNG, or WebP image up to 2 MB. Gemini may use only clearly visible appearance details; the photo is sent for generation and is not saved with drafts.
6. **Draft saving and management** — save any generated hook, story, offer, caption, or hashtags, then view, copy, and manage saved items in Drafts.
7. **In-app scheduling support** — saved drafts can be scheduled in the workspace calendar. This does not publish content to an external social platform.
8. **Dashboard starter experience** — personalized greeting, daily creator thought, zeroed starter metrics, a getting-started guide, and clearly marked upcoming panels.

### Deliberately outside this MVP scope

- The 30-second video-script panel is currently a placeholder.
- Publishing or dispatching content directly to Instagram, YouTube, Facebook, or WhatsApp is not connected.
- Dashboard trend insights, cultural-opportunity data, and usage summaries are informational placeholders, not live analytics feeds.
- External social-account authentication and performance analytics are not implemented.

These boundaries are stated so reviewers can distinguish working prototype behavior from future product ideas.

## How generation works

1. The signed-in creator enters an idea, chooses a platform and tone, and may add confirmed business details. Generation currently uses Indian English.
2. The app sends the brief, optional confirmed details, account name, selected platform and tone, and optional JPG/PNG/WebP reference photo (up to 2 MB) to a server-side Next.js API route. A photo is used only to describe visible appearance and is not saved with drafts. The current language selection is Indian English.
3. Gemini returns structured JSON containing two hooks, two longer story variations, two offer-and-CTA variations, a caption, and hashtags.
4. Server-side length, English-only, variation, and format checks can trigger one rewrite. Gemini then receives a separate review request to check claims against the supplied brief and details. If that review is unavailable, the app returns the draft with a manual-review notice.
5. The server ensures the account name and branded hashtag are present before returning all variations to the Create page, where the selector switches between Hooks, Story and Craft, and Offer and CTA.
6. The creator can save any hook, story, offer, caption, or hashtag set to their Drafts library.

The idea field accepts up to 500 characters and confirmed business details up to 1,000 characters. The server checks output length and format, can request one rewrite when copy misses those checks, and asks Gemini for a separate factuality review against the supplied brief. If the review cannot complete, the generated copy is returned as unreviewed so the creator can inspect it manually. These checks reduce common errors but cannot prove a business claim is true. Generation depends on a valid Gemini API key, network access, and available Gemini quota. The generator is intended for prompts about a business, product, service, event, or creator offer; it is not a general-purpose assistant. It returns two hooks, two longer stories, two offer-and-CTA options, a caption, and hashtags in a single generation. Results can vary, and even checked copy can miss context, so creators should verify every claim before publishing.

**The sample prompt about nolen gur is only an example.** The brief is sent to Gemini as entered; the generation code is not hard-coded to nolen gur. Other relevant business and creator briefs should produce hooks, stories, offer-and-CTA options, captions, and hashtags for the selected platform. The app cannot guarantee an equally strong result for every prompt, so the creator should review each draft and use confirmed business facts.

## Architecture

~~~text
Browser
  └─ Stitch-designed screens in public/stitch/
       └─ Next.js pages load the screens and connect UI interactions
            ├─ /api/auth/*      account and session routes
            ├─ /api/generate    Gemini content generation and fact review
            ├─ /api/drafts/*   per-user draft storage and management
            ├─ /api/calendar   in-app scheduling for saved drafts
            └─ /api/dashboard  workspace summary data

Next.js server
  ├─ Gemini API (server-side key)
  └─ SQLite database (users, sessions, drafts)
~~~

### Main project folders

- **app/** — Next.js pages and API route handlers.
- **lib/** — authentication, database, draft, and HTTP helpers.
- **public/stitch/** — Stitch-generated screens and browser-side wiring.
- **data/** — local SQLite database created at runtime; excluded from Git.

### Technology

- Next.js 16 App Router
- React 19
- Node.js built-in SQLite module
- SQLite for local account, session, and draft storage
- Google Gemini API for AI generation and fact review
- Stitch-generated HTML screens integrated with the existing Next.js project structure

## Run locally

### For reviewers

After the public repository is published, clone it and follow the setup below. The project uses Gemini for content generation, so add your own Gemini API key to the local environment file; the key must never be committed to GitHub.

The development server is local to the computer where it is started. The localhost address (http://localhost:3000) is not a public website link. Reviewers can use the public demo video to see the prototype, or run the code locally using these steps.

### Requirements

- Node.js 22.13 or later is recommended because the project uses the built-in <code>node:sqlite</code> module. The module was added in Node 22.5 and no longer requires the experimental flag starting in Node 22.13; it remains experimental in those Node releases. See the [Node.js SQLite documentation](https://nodejs.org/api/sqlite.html).
- npm

### 1. Get the project files and install dependencies

Clone the public repository, open its project folder in a terminal, then install dependencies:

~~~bash
git clone <PUBLIC_GITHUB_REPOSITORY_URL>
cd <repository-folder>
npm ci
~~~

If you downloaded the repository ZIP instead, open the extracted project folder and run npm install.

### 2. Create the local environment file

On macOS or Linux:

~~~bash
cp .env.example .env.local
~~~

On Windows PowerShell:

~~~powershell
Copy-Item .env.example .env.local
~~~

Open <code>.env.local</code> and set your own Gemini API key:

~~~dotenv
GEMINI_API_KEY=your_gemini_api_key_here
~~~

<code>DATABASE_PATH</code> is optional. If omitted, the app creates the database at <code>./data/creatorpilot.sqlite3</code>.

If you need to expose your development server through a tunnel, you can also set <code>NEXT_ALLOWED_DEV_ORIGINS</code> to comma-separated hostnames (without <code>https://</code> or a port). It is optional for normal localhost use.

**Never commit <code>.env.local</code> or share your Gemini API key.** The key is read by the server-side generation route. The repository's <code>.gitignore</code> excludes local environment files and the local database; <code>.env.example</code> is the safe template to commit.

### 3. Start the development server

~~~bash
npm run dev
~~~

Open [http://localhost:3000](http://localhost:3000). The screens load Tailwind CSS and fonts from online CDNs, so an internet connection is needed for the intended styling and for Gemini generation.

### Other project commands

~~~bash
npm run build
npm run start
npm run lint
~~~

<code>npm run start</code> serves a production build, so run <code>npm run build</code> first.

## Main screens

| URL | Screen |
| --- | --- |
| <code>/</code> | Landing page |
| <code>/auth</code> | Sign up and sign in |
| <code>/dashboard</code> | Personalized creator dashboard |
| <code>/studio</code> | Create hooks, captions, and hashtags |
| <code>/drafts</code> | Saved content library |
| <code>/calendar</code> | Workspace scheduling calendar |

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | <code>/api/auth/register</code> | Create an account and start a session |
| POST | <code>/api/auth/login</code> | Sign in and start a session |
| GET | <code>/api/auth/me</code> | Return the current signed-in user |
| POST | <code>/api/auth/logout</code> | End the current session |
| POST | <code>/api/generate</code> | Generate and fact-review social copy |
| GET, POST | <code>/api/drafts</code> | List or save the current user's drafts |
| GET, PATCH, DELETE | <code>/api/drafts/[id]</code> | Read, update, or delete one of the current user's drafts |
| GET, POST, DELETE | <code>/api/calendar</code> | List scheduled drafts, schedule a draft, or return it to drafts |
| GET | <code>/api/dashboard</code> | Return the signed-in user's workspace counts and recent items |
| GET, PATCH | <code>/api/profile</code> | Read or update the current user's profile |

Protected API routes require a signed-in session. Draft operations are scoped to the current user.

## Data and security notes

- Passwords are stored as salted scrypt hashes, not plaintext.
- Sessions use a random token in an HTTP-only cookie; only a hash of the token is stored in SQLite.
- Gemini API calls are made by the server so the API key is not embedded in browser code.
- Local account and draft data is stored in the SQLite file at <code>DATABASE_PATH</code>.
- For a public deployment, configure the Gemini key in the hosting provider's server-side environment settings. Use persistent database storage or migrate to a managed database before deploying to an environment with an ephemeral filesystem.

## Submission links

Add the final public URLs here before submitting:

- **Public GitHub repository:** TODO — add the repository URL after publishing it.
- **Public 50% MVP demo video:** TODO — add a viewable video URL after recording and publishing the demo.

Replace both placeholders with the final public URLs before submitting. Make sure the demo video link opens without requiring the committee to request access.

## Suggested MVP demo walkthrough

A concise demo can show the complete working path:

1. Create a demo account or sign in to the account prepared for the demonstration.
2. Open Create and choose English plus one supported platform.
3. Enter a real business idea and only confirmed facts.
4. Generate and review both hooks, switch between Story and Craft and Offer and CTA to show their two variations, then review the caption and hashtags.
5. Save a hook, a story, and an offer, then open Drafts to show the selected content was retained.
6. Briefly point out the dashboard's zero metrics and the panels marked for future functionality.

Use a prompt based on a real product or service. Do not show API keys, private account information, or unconfirmed product claims in a public recording.

## Evaluation focus

This prototype is designed to demonstrate a focused part of the larger Bhasha Bloom vision: helping regional creators and small businesses move from an idea to reviewable, business-aware social copy. It emphasizes:

- Working end-to-end functionality for the included MVP flow
- A regional content-generation concept
- Clear separation between implemented features and future scope
- A maintainable Next.js structure with server-side AI calls and per-user data handling

## Roadmap

Future work may include:

- More Indian languages and additional platforms
- Video-script generation
- Live cultural calendar and trend data
- Direct publishing and WhatsApp integrations
- Social performance analytics
- Managed database and deployment hardening

## Acknowledgements

- UI layout and visual design began in Stitch.
- AI generation uses the Google Gemini API.
- The project uses Next.js, React, Node.js, and SQLite.

