# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/824fca43-9578-4c29-bfa2-824899bcf8c4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

For Vercel or another hosted deployment, add `GEMINI_API_KEY` in the project environment variables and redeploy. If the key is missing or the AI service is unavailable, the game displays a local fallback reading and explains how to configure the key.
