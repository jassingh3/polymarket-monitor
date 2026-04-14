// Vercel serverless function — proxies Polymarket API to avoid CORS
export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path" });

  const url = `https://gamma-api.polymarket.com/${path}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "polymarket-monitor/1.0",
      },
    });

    const data = await upstream.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Upstream fetch failed", detail: err.message });
  }
}
