# Polymarket Monitor

Live political odds tracker — Iran/War, Oil/Futures, Presidency, IPO Watch, Top 10 Trending.

## Deploy to Vercel (3 steps)

1. **Upload to GitHub**
   - Go to github.com → New repository → name it `polymarket-monitor`
   - Upload all these files (drag & drop the folder)

2. **Connect to Vercel**
   - Go to vercel.com → "Add New Project"
   - Import your GitHub repo
   - Framework: **Vite** (auto-detected)
   - Click **Deploy** — done in ~60 seconds

3. **Your live URL**
   - Vercel gives you: `https://polymarket-monitor-xxx.vercel.app`
   - Share it with anyone!

## Features
- 🔥 Top 10 trending markets by 24h volume
- 💣 Iran/War odds
- 🛢️ Oil & futures odds  
- 🏛️ Presidency & policy odds
- 🚀 Upcoming IPO watch (Anthropic, OpenAI, xAI, Cerebras...)
- 🚨 Email alerts via SendGrid when odds move >0.5σ
- Auto-refreshes every 60s
- Live data via Polymarket API (no CORS issues on Vercel)

## Local development
```
npm install
npm run dev
```
