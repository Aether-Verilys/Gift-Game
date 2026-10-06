# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/824fca43-9578-4c29-bfa2-824899bcf8c4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and set `DEEPSEEK_API_KEY` to your DeepSeek API key. `.env.local` is ignored by Git and must never be committed.
3. Run the app:
   `npm run dev`

## Deployment

For Vercel or another hosted deployment, add `DEEPSEEK_API_KEY` in the project environment variables and redeploy. You can optionally set `DEEPSEEK_MODEL` (defaults to `deepseek-chat`) and `DEEPSEEK_API_URL` (defaults to `https://api.deepseek.com`). If the key is missing or the AI service is unavailable, the game displays a local fallback reading and explains how to configure the key.
