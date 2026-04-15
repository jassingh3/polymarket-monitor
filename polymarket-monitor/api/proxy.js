// Vercel serverless function — proxies Polymarket API to bypass CORS
module.exports = async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path param" });

  const decoded = decodeURIComponent(path);
  const url = `https://gamma-api.polymarket.com/${decoded}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; polymarket-monitor/1.0)",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
    }

    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: "Upstream fetch failed", detail: err.message });
  }
};
