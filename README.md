# WasteWise AI

WasteWise AI is a responsive, vanilla HTML/CSS/JavaScript and Express application for exploring waste reuse, recycling preparation, and safer disposal.

## Features

- Public browsing for waste categories, reuse ideas, recycling guidance, and learning resources; no account or sign-in is required.
- Image analysis with an optional server-side OpenAI vision integration, or manual category selection when AI is not configured.
- Image uploads are processed in server memory only. The app does not save uploaded images, scan results, user profiles, feedback, activities, or collection requests.
- Reuse ideas and recycling guidance come from the bundled starter data. No nearby-center locator is included.
- No Firebase Authentication, Firestore, or Cloud Storage integration is used by the running app. Firebase sign-in providers enabled in the Firebase Console do not affect this app.

Images are temporarily held in memory by the app while being analyzed and then discarded. If `OPENAI_API_KEY` is configured, the image is sent to the configured AI provider for analysis; review that provider's data-handling terms.

## Requirements

- Node.js 20 or later
- Optional OpenAI API key for image recognition

## Local setup

```powershell
npm install
Copy-Item .env.example .env
```

Set `OPENAI_API_KEY` in `.env` only if image recognition is wanted. Without it, users can select a category manually. Do not commit `.env` or API keys.

Start the application:

```powershell
npm run dev
```

Open `http://localhost:3000`. The app can also be tested with:

```powershell
npm test
```

## Privacy and data

The app has no sign-in routes or account UI and does not persist personal data or analysis results. Image uploads use in-memory processing and are not uploaded to Firebase Storage. Firebase Admin and Firebase Authentication are not initialized by the running server. Existing Firebase project data, if any, is not modified or deleted by this code.

The Firestore rules in `firestore.rules` deny direct client access. They are not needed to run this stateless version of the app.

## Deployment

The app is configured for Render as a single Node.js web service. To deploy, push the project to a GitHub or GitLab repository, sign in to [Render](https://render.com), choose **New > Blueprint**, and connect the repository. Render will use `render.yaml` to build and start the service. The deployed app URL serves both the website and its Express API.

The Render Free plan is intended for hobby projects and testing. Free services spin down when idle and may take about a minute to wake up; usage limits apply. Review [Render's current free-plan limitations](https://render.com/docs/free). No database or persistent disk is required by this stateless version. `OPENAI_API_KEY` is optional; without it, manual category selection works but AI image recognition is unavailable. Add the key in the Render dashboard only if needed, and do not commit API keys or `.env`.

## API highlights

- `GET /api/health`, `GET /api/config`, `GET /api/waste/categories`
- `POST /api/waste/analyze` (multipart field `image`; optional manual `category`)
- `GET /api/ideas`, `GET /api/recycling/:category`, `GET /api/disposal/:category`
- `GET /api/learn`, `GET /api/recycling`

Account, authentication, scan-history, activity, feedback, collection, notification, and admin endpoints are not available. Unknown `/api` routes return 404.
