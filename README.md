# WasteWise AI

WasteWise AI is a responsive, vanilla HTML/CSS/JavaScript and Express application for exploring waste reuse, recycling preparation, and safer disposal.

## Features

- Public browsing for waste categories, reuse ideas, recycling guidance, and learning resources; no account or sign-in is required.
- Image analysis with optional server-side Gemini vision integration, or manual category selection when AI is not configured.
- Image uploads are processed in server memory only. The app does not save uploaded images, scan results, user profiles, feedback, activities, or collection requests.
- Reuse ideas and recycling guidance come from the bundled starter data. No nearby-center locator is included.
- No Firebase Authentication, Firestore, or Cloud Storage integration is used by the running app. Firebase sign-in providers enabled in the Firebase Console do not affect this app.

Images are temporarily held in memory by the app while being analyzed and then discarded. If `GEMINI_API_KEY` is configured, the image is sent to Google's Gemini API for analysis; review Google's data-handling terms for the selected API tier before uploading images.

## Requirements

- Node.js 20 or later
- Optional Gemini API key for image recognition

## Local setup

```powershell
npm install
Copy-Item .env.example .env
```

Set `GEMINI_API_KEY` in `.env` only if image recognition is wanted. The default model is `gemini-3.8-flash`; set `GEMINI_MODEL` only when choosing another supported model. Without a key, users can select a category manually. Do not commit `.env` or API keys.

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

The Render Free plan is intended for hobby projects and testing. Free services spin down when idle and may take about a minute to wake up; usage limits apply. Review [Render's current free-plan limitations](https://render.com/docs/free). No database or persistent disk is required by this stateless version. `GEMINI_API_KEY` is optional; without it, manual category selection works but AI image recognition is unavailable. Add the key in the Render dashboard only if needed, and do not commit API keys or `.env`.

### Configure Gemini image recognition

1. Sign in to [Google AI Studio](https://aistudio.google.com/) and open [API keys](https://aistudio.google.com/apikey).
2. Create an API key in a Google Cloud project. Keep the key private; do not add it to source code or commit it.
3. In the Render dashboard, open the `wastewise-ai` service, select **Environment**, and add `GEMINI_API_KEY` with the key as its value.
4. Save the environment change and redeploy the service. Verify `GET /api/config` reports `"aiConfigured": true`.

The default model is `gemini-3.8-flash`, called through the Gemini Interactions API with structured JSON output. Gemini API free-tier availability and request quotas depend on the model, account, and region; review [current Gemini API pricing and limits](https://ai.google.dev/gemini-api/docs/pricing). Google states that data used on the free tier may be used to improve its products. Do not upload sensitive images unless you have reviewed and accept the applicable terms. API availability and free-tier terms can change. Image analysis may take up to 40 seconds; timed-out requests return an error without saving the image.

If image analysis returns a Gemini `404`, check the Render service's `GEMINI_MODEL` environment variable. Use a model ID available to the Interactions API and your API project, such as `gemini-3.8-flash`, without the `models/` prefix, then redeploy. The app includes Google's provider error details in the response to help diagnose key/project/model access issues.

## API highlights

- `GET /api/health`, `GET /api/config`, `GET /api/waste/categories`
- `POST /api/waste/analyze` (multipart field `image`; optional manual `category`)
- `GET /api/ideas`, `GET /api/recycling/:category`, `GET /api/disposal/:category`
- `GET /api/learn`, `GET /api/recycling`

Account, authentication, scan-history, activity, feedback, collection, notification, and admin endpoints are not available. Unknown `/api` routes return 404.
