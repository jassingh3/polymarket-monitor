import { useState, useEffect, useRef, useCallback } from "react";

// ─── API FETCHER ─────────────────────────────────────────────────────────────
// On Vercel: uses /api/proxy (serverless, no CORS issues)
// Locally / fallback: tries public CORS proxies
const FALLBACK_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];
const BASE = "https://gamma-api.polymarket.com";

async function proxyFetch(path) {
  // 1. Try our own Vercel serverless proxy first (works when deployed)
  try {
    const r = await fetch(`/api/proxy?path=${encodeURIComponent(path.replace(/^\//, ""))}`);
    if (r.ok) return await r.json();
  } catch {}

  // 2. Fallback to public CORS proxies (for local dev)
  const url = BASE + path;
  for (const proxy of FALLBACK_PROXIES) {
    try {
      const r = await fetch(proxy(url), { headers: { "Accept": "application/json" } });
      if (r.ok) return JSON.parse(await r.text());
    } catch {}
  }
  return null;
}

// ─── MOCK DATA shown when API is unreachable ─────────────────────────────────
const MOCK_TRENDING = [
  { id: "m1", label: "Will the US enter a recession in 2025?", prob: 42.3, volume: 8200000, slug: "us-recession-2025" },
  { id: "m2", label: "Will Trump be removed from office in 2025?", prob: 7.1, volume: 6100000, slug: "trump-removed-2025" },
  { id: "m3", label: "Will oil price exceed $100 in 2025?", prob: 18.5, volume: 5400000, slug: "oil-100-2025" },
  { id: "m4", label: "Will Israel strike Iran nuclear facilities?", prob: 31.2, volume: 4900000, slug: "israel-iran-strike" },
  { id: "m5", label: "Will the Fed cut rates before July 2025?", prob: 61.8, volume: 4300000, slug: "fed-cut-july-2025" },
  { id: "m6", label: "Will Iran nuclear deal be signed in 2025?", prob: 22.4, volume: 3800000, slug: "iran-deal-2025" },
  { id: "m7", label: "Will China invade Taiwan in 2025?", prob: 4.2, volume: 3500000, slug: "china-taiwan-2025" },
  { id: "m8", label: "Will OPEC+ extend production cuts?", prob: 55.7, volume: 2900000, slug: "opec-cut-2025" },
  { id: "m9", label: "Will Trump impose 25%+ tariffs on China?", prob: 78.3, volume: 2600000, slug: "trump-china-tariffs" },
  { id: "m10", label: "Will US military attack Iran in 2025?", prob: 14.6, volume: 2100000, slug: "us-iran-attack-2025" },
];

const TRACKED_MARKETS = [
  { id: "iran-strike", label: "Israel strikes Iran nuclear facilities", category: "Iran/War", slug: "will-israel-strike-iran-nuclear-facilities-before-2026", icon: "💣", mockProb: 31.2 },
  { id: "us-iran", label: "US military attacks Iran", category: "Iran/War", slug: "will-the-us-military-attack-iran-in-2025", icon: "🪖", mockProb: 14.6 },
  { id: "iran-deal", label: "Iran nuclear deal signed 2025", category: "Iran/War", slug: "iran-nuclear-deal-2025", icon: "📜", mockProb: 22.4 },
  { id: "oil-100", label: "Oil exceeds $100/bbl in 2025", category: "Oil/Futures", slug: "will-oil-price-exceed-100-in-2025", icon: "🛢️", mockProb: 18.5 },
  { id: "oil-60", label: "Oil drops below $60/bbl in 2025", category: "Oil/Futures", slug: "will-oil-price-drop-below-60-in-2025", icon: "📉", mockProb: 28.9 },
  { id: "opec", label: "OPEC+ extends production cut", category: "Oil/Futures", slug: "opec-production-cut-2025", icon: "⛽", mockProb: 55.7 },
  { id: "trump-impeach", label: "Trump impeached in 2025", category: "Presidency", slug: "will-trump-be-impeached-in-2025", icon: "🏛️", mockProb: 7.1 },
  { id: "trump-tariffs", label: "Trump tariffs >25% on China", category: "Presidency", slug: "trump-china-tariffs-above-25-percent", icon: "🇨🇳", mockProb: 78.3 },
  { id: "recession", label: "US recession declared 2025", category: "Presidency", slug: "us-recession-2025", icon: "📉", mockProb: 42.3 },
  { id: "fed-cut", label: "Fed cuts rates before July 2025", category: "Presidency", slug: "fed-rate-cut-2025", icon: "🏦", mockProb: 61.8 },
];

const UPCOMING_IPOS = [
  { name: "Anthropic", ticker: "ANTH?", sector: "AI", status: "Rumored 2026", valuation: "$61B+", hot: true, notes: "Maker of Claude. Series E at $61.5B. No S-1 filed yet." },
  { name: "OpenAI", ticker: "OAI?", sector: "AI", status: "Rumored 2026", valuation: "$300B+", hot: true, notes: "Restructuring to for-profit. IPO path unclear but likely." },
  { name: "xAI (Grok)", ticker: "XAI?", sector: "AI", status: "Rumored", valuation: "$50B+", hot: true, notes: "Elon Musk's AI lab. Raised $6B in 2024. No timeline." },
  { name: "Cerebras Systems", ticker: "CBRS", sector: "AI Chips", status: "S-1 Filed", valuation: "$8B", hot: true, notes: "S-1 filed 2024. Awaiting SEC review. WSE-3 wafer chip." },
  { name: "Databricks", ticker: "DBRK?", sector: "AI/Data", status: "Rumored 2025", valuation: "$62B+", hot: true, notes: "AI data platform. $10B raised Dec 2024. IPO talk active." },
  { name: "Klarna", ticker: "KLAR", sector: "Fintech", status: "Filed 2025", valuation: "$15B", hot: false, notes: "BNPL leader. NYSE listing targeted for 2025." },
  { name: "Chime", ticker: "CHYM?", sector: "Fintech", status: "Rumored 2025", valuation: "$25B", hot: false, notes: "Digital bank. Confidential S-1 reportedly filed." },
  { name: "Scale AI", ticker: "SCLE?", sector: "AI Data", status: "Rumored 2025", valuation: "$14B", hot: false, notes: "AI training data. Key DoD contractor. IPO 2025 possible." },
  { name: "Starlink", ticker: "STLK?", sector: "Space/Tech", status: "Rumored 2025–26", valuation: "$200B+", hot: true, notes: "SpaceX's satellite internet. Musk has hinted at spinout." },
  { name: "Perplexity AI", ticker: "PRPL?", sector: "AI Search", status: "Early Stage", valuation: "$9B", hot: false, notes: "AI search engine. $73.6B raised in 2024. IPO 2026+." },
];

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}

const CAT = {
  "Iran/War":    { bg: "#200d0d", text: "#ff7070", border: "#5a1818" },
  "Oil/Futures": { bg: "#0d1a0d", text: "#5dffaa", border: "#1a5028" },
  "Presidency":  { bg: "#0d0d22", text: "#7fb3ff", border: "#1a2860" },
  "Trending":    { bg: "#1a150a", text: "#ffd166", border: "#4a3a10" },
  "IPO":         { bg: "#160d22", text: "#c77dff", border: "#3d1a5a" },
};

function Badge({ cat }) {
  const c = CAT[cat] || { bg: "#111", text: "#888", border: "#222" };
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 3, padding: "2px 7px", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, whiteSpace: "nowrap" }}>{cat.toUpperCase()}</span>;
}

function Spark({ data }) {
  if (!data || data.length < 2) return null;
  const W = 70, H = 24;
  const lo = Math.min(...data), hi = Math.max(...data), rng = hi - lo || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - lo) / rng) * (H - 2) - 1}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={up ? "#5dffaa" : "#ff7070"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function VolBar({ v, max }) {
  const pct = max > 0 ? Math.min((v / max) * 100, 100) : 0;
  return <div style={{ height: 3, background: "#151520", borderRadius: 2, overflow: "hidden", marginTop: 5 }}><div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#ffd166,#ff9a00)", transition: "width 0.6s" }} /></div>;
}

function MktCard({ m, thr }) {
  const up = m.prob !== null && m.prevProb !== null && m.prob > m.prevProb;
  const dn = m.prob !== null && m.prevProb !== null && m.prob < m.prevProb;
  const ac = CAT[m.category]?.text || "#ff7070";
  return (
    <div style={{ background: m.alert ? "#160808" : "#0c0c18", border: `1px solid ${m.alert ? "#5a1818" : "#181828"}`, borderRadius: 8, padding: 15, position: "relative", overflow: "hidden", transition: "all 0.3s", boxShadow: m.alert ? `0 0 18px #6a101044` : "none" }}>
      {m.alert && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ac},#ffb347)`, animation: "pulse 1s infinite alternate" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span>{m.icon}</span><Badge cat={m.category} /></div>
        {m.alert && <span style={{ fontSize: 10, color: "#ff7070", animation: "blink 0.8s step-start infinite" }}>🚨 ALERT</span>}
      </div>
      <div style={{ fontSize: 12, color: "#a8a898", lineHeight: 1.45, marginBottom: 11, minHeight: 32 }}>{m.label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          {m.loading ? <span style={{ color: "#222", fontSize: 20 }}>· · ·</span>
            : m.error ? <span style={{ color: "#2a2a2a", fontSize: 11 }}>no data</span>
            : <>
              <span style={{ fontSize: 28, fontWeight: 700, color: m.alert ? "#ff7070" : "#e0e0d8" }}>{m.prob?.toFixed(1)}<span style={{ fontSize: 12, color: "#3a3a4a" }}>%</span></span>
              {m.prevProb !== null && <div style={{ fontSize: 10, marginTop: 1, color: up ? "#5dffaa" : dn ? "#ff7070" : "#2a2a3a" }}>{up ? "▲" : dn ? "▼" : "─"} {m.delta?.toFixed(2)}%</div>}
            </>}
        </div>
        <Spark data={m.history} />
      </div>
      {m.sd > 0 && <div style={{ marginTop: 7, fontSize: 9, color: "#222" }}>σ={m.sd.toFixed(2)} · fires@{(m.sd * thr).toFixed(2)}%</div>}
      {m.isMock && <div style={{ fontSize: 9, color: "#2a2a1a", marginTop: 4 }}>⚠ estimated (API unreachable)</div>}
    </div>
  );
}

function IPOCard({ ipo }) {
  return (
    <div style={{ background: "#0c0c18", border: `1px solid ${ipo.hot ? "#3d1a5a" : "#181828"}`, borderRadius: 8, padding: 15, position: "relative", overflow: "hidden", boxShadow: ipo.hot ? "0 0 12px #3d1a5a44" : "none" }}>
      {ipo.hot && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#c77dff,#7b2fff)" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div><span style={{ fontSize: 14, fontWeight: 700, color: "#e0e0d8" }}>{ipo.name}</span><span style={{ fontSize: 9, color: "#2a2a3a", marginLeft: 7 }}>{ipo.ticker}</span></div>
        {ipo.hot && <span style={{ fontSize: 11, color: "#c77dff" }}>🔥</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 9 }}><Badge cat="IPO" /><span style={{ fontSize: 10, background: "#0d1a0d", color: "#5dffaa", border: "1px solid #1a4a20", borderRadius: 3, padding: "2px 7px", fontFamily: "monospace" }}>{ipo.sector}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 10, color: "#555" }}>{ipo.status}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#ffd166" }}>{ipo.valuation}</span>
      </div>
      <div style={{ fontSize: 10, color: "#3a3a3a", lineHeight: 1.55 }}>{ipo.notes}</div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("trending");
  const [markets, setMarkets] = useState(
    TRACKED_MARKETS.map(m => ({ ...m, prob: null, prevProb: null, history: [], alert: false, loading: true, error: false, delta: 0, sd: 0, isMock: false }))
  );
  const [trending, setTrending] = useState([]);
  const [trendLoad, setTrendLoad] = useState(true);
  const [apiStatus, setApiStatus] = useState("connecting"); // connecting | live | mock | error
  const [alerts, setAlerts] = useState([]);
  const [sgKey, setSgKey] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [thr, setThr] = useState(0.5);
  const [lastMkt, setLastMkt] = useState(null);
  const [lastTrend, setLastTrend] = useState(null);
  const [sending, setSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);
  const histRef = useRef({});
  const mktRef = useRef(markets);
  mktRef.current = markets;

  // ── Trending ──────────────────────────────────────────────────────────────
  const loadTrending = useCallback(async () => {
    setTrendLoad(true);
    const data = await proxyFetch("/markets?order=volume24hr&ascending=false&limit=20&active=true");
    if (data && Array.isArray(data) && data.length > 0) {
      const items = data.slice(0, 10).map((m, i) => {
        let prob = null;
        try {
          const p = typeof m.outcomePrices === "string" ? JSON.parse(m.outcomePrices) : m.outcomePrices;
          if (p?.length) prob = parseFloat(p[0]) * 100;
        } catch {}
        return { id: String(m.id || i), label: m.question || m.title || "—", prob, volume: parseFloat(m.volume24hr || m.volumeNum || 0), slug: m.slug, isMock: false };
      });
      setTrending(items);
      setApiStatus("live");
    } else {
      setTrending(MOCK_TRENDING.map(m => ({ ...m, isMock: true })));
      setApiStatus("mock");
    }
    setLastTrend(new Date());
    setTrendLoad(false);
  }, []);

  // ── Per-market fetch ──────────────────────────────────────────────────────
  const fetchOne = useCallback(async (slug, mockProb) => {
    const data = await proxyFetch(`/markets?slug=${slug}`);
    if (data && Array.isArray(data) && data.length > 0) {
      const m = data[0];
      try {
        const p = typeof m.outcomePrices === "string" ? JSON.parse(m.outcomePrices) : m.outcomePrices;
        if (p?.length) return { prob: parseFloat(p[0]) * 100, isMock: false };
      } catch {}
    }
    // Fallback: mock with small random walk so sparklines animate
    const walk = mockProb + (Math.random() - 0.5) * 1.2;
    return { prob: Math.max(0.5, Math.min(99.5, walk)), isMock: true };
  }, []);

  // ── Refresh all tracked ───────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    const cur = mktRef.current;
    const updated = await Promise.all(cur.map(async (m) => {
      const { prob, isMock } = await fetchOne(m.slug, m.mockProb);
      const history = [...(histRef.current[m.id] || []), prob].slice(-40);
      histRef.current[m.id] = history;
      const sd = stdDev(history);
      const prevProb = m.prob;
      const delta = prevProb !== null ? Math.abs(prob - prevProb) : 0;
      const triggered = prevProb !== null && sd > 0 && delta >= sd * thr && !isMock;
      return { ...m, prob, prevProb, history, alert: triggered, loading: false, error: false, delta, sd, isMock };
    }));
    setMarkets(updated);
    setLastMkt(new Date());
    const fired = updated.filter(m => m.alert).map(m => ({ ...m, time: new Date().toLocaleTimeString() }));
    if (fired.length) setAlerts(p => [...fired, ...p].slice(0, 60));
  }, [fetchOne, thr]);

  useEffect(() => {
    loadTrending();
    refreshAll();
    const t1 = setInterval(loadTrending, 120000);
    const t2 = setInterval(refreshAll, 60000);
    return () => { clearInterval(t1); clearInterval(t2); };
    // eslint-disable-next-line
  }, []);

  // ── Email ─────────────────────────────────────────────────────────────────
  const sendEmail = async () => {
    if (!sgKey || !userEmail) return;
    setSending(true); setEmailMsg(null);
    const fired = markets.filter(m => m.alert);
    const snap = trending.slice(0, 5).map(m => `  • ${m.label}: ${m.prob?.toFixed(1) ?? "?"}%  |  $${(m.volume / 1e6).toFixed(2)}M vol`).join("\n");
    const body = ["=== POLYMARKET MONITOR ===", `${new Date().toLocaleString()}`, "",
      fired.length ? "🚨 ALERTS:\n" + fired.map(m => `  • ${m.label}\n    ${m.prevProb?.toFixed(1)}% → ${m.prob?.toFixed(1)}%  Δ${m.delta?.toFixed(2)}%`).join("\n") : "No active alerts.",
      "", "🔥 TOP 5 TRENDING:\n" + snap, "", "polymarket.com"
    ].join("\n");
    try {
      const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { "Authorization": `Bearer ${sgKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ personalizations: [{ to: [{ email: userEmail }] }], from: { email: userEmail }, subject: `🚨 Polymarket: ${fired.length} alert(s) · ${new Date().toLocaleTimeString()}`, content: [{ type: "text/plain", value: body }] }),
      });
      setEmailMsg(r.ok ? "✅ Sent!" : `❌ Error ${r.status}`);
    } catch (e) { setEmailMsg("❌ " + e.message); }
    setSending(false);
  };

  const activeAlerts = markets.filter(m => m.alert).length;
  const maxVol = Math.max(...trending.map(m => m.volume || 0), 1);

  const TABS = [
    { id: "trending", label: "🔥 TOP 10" },
    { id: "war",      label: "💣 IRAN/WAR" },
    { id: "oil",      label: "🛢️ OIL" },
    { id: "politics", label: "🏛️ PRESIDENCY" },
    { id: "ipo",      label: "🚀 IPO WATCH" },
    { id: "alerts",   label: `🚨 ALERTS${alerts.length ? ` (${alerts.length})` : ""}` },
  ];

  const statusColor = { live: "#5dffaa", mock: "#ffd166", connecting: "#7fb3ff", error: "#ff7070" }[apiStatus];
  const statusLabel = { live: "● LIVE", mock: "◐ ESTIMATED", connecting: "○ CONNECTING", error: "✕ ERROR" }[apiStatus];

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#deded6", fontFamily: "'Courier New', monospace", boxSizing: "border-box" }}>

      {/* HEADER */}
      <div style={{ background: "#08081a", borderBottom: "1px solid #141424", padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.3, background: "linear-gradient(90deg,#ff7070,#ffd166,#5dffaa,#7fb3ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              POLYMARKET MONITOR
            </h1>
            <div style={{ fontSize: 9, color: "#282838", letterSpacing: 3, marginTop: 3 }}>WAR · OIL · PRESIDENCY · IPO · TRENDING</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10 }}>
            <div style={{ color: statusColor, letterSpacing: 1, marginBottom: 3 }}>{statusLabel}</div>
            <div style={{ color: "#222" }}>Mkt: {lastMkt ? lastMkt.toLocaleTimeString() : "—"}</div>
            <div style={{ color: "#222" }}>Trend: {lastTrend ? lastTrend.toLocaleTimeString() : "—"}</div>
            {activeAlerts > 0 && <div style={{ color: "#ff7070", animation: "blink 1s step-start infinite", marginTop: 3 }}>🚨 {activeAlerts} ALERT{activeAlerts !== 1 ? "S" : ""}</div>}
          </div>
        </div>
        {apiStatus === "mock" && (
          <div style={{ marginTop: 10, background: "#1a1400", border: "1px solid #3a2a00", borderRadius: 5, padding: "7px 12px", fontSize: 10, color: "#ffd166", lineHeight: 1.6 }}>
            ⚠️ <strong>API blocked by CORS</strong> — showing estimated data based on recent known odds. To get live data, run this locally or deploy to your own server where CORS isn't restricted.
          </div>
        )}
      </div>

      {/* EMAIL BAR */}
      <div style={{ background: "#08081a", borderBottom: "1px solid #101018", padding: "9px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
          <input value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="your@email.com"
            style={{ background: "#0e0e20", border: "1px solid #1e1e30", color: "#ccc", padding: "5px 9px", borderRadius: 4, fontFamily: "monospace", fontSize: 11, width: 160 }} />
          <input value={sgKey} onChange={e => setSgKey(e.target.value)} type="password" placeholder="SendGrid key SG.xxx"
            style={{ background: "#0e0e20", border: "1px solid #1e1e30", color: "#ccc", padding: "5px 9px", borderRadius: 4, fontFamily: "monospace", fontSize: 11, width: 185 }} />
          <select value={thr} onChange={e => setThr(parseFloat(e.target.value))}
            style={{ background: "#0e0e20", border: "1px solid #1e1e30", color: "#ccc", padding: "5px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>
            <option value={0.25}>Alert ≥0.25σ</option>
            <option value={0.5}>Alert ≥0.5σ</option>
            <option value={1.0}>Alert ≥1.0σ</option>
          </select>
          <button onClick={sendEmail} disabled={!sgKey || !userEmail || sending}
            style={{ background: sgKey && userEmail ? "#0a1e10" : "#0e0e20", border: `1px solid ${sgKey && userEmail ? "#1a4a28" : "#1e1e30"}`, color: sgKey && userEmail ? "#5dffaa" : "#222", padding: "5px 13px", borderRadius: 4, cursor: sgKey && userEmail ? "pointer" : "default", fontFamily: "monospace", fontSize: 11, letterSpacing: 1 }}>
            {sending ? "…" : "📧 TEST"}
          </button>
          {emailMsg && <span style={{ fontSize: 10, color: emailMsg.startsWith("✅") ? "#5dffaa" : "#ff7070" }}>{emailMsg}</span>}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid #101018", overflowX: "auto", background: "#07070f" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "#0c0c1e" : "transparent", border: "none", borderBottom: tab === t.id ? "2px solid #ffd166" : "2px solid transparent", color: tab === t.id ? "#ffd166" : "#303040", padding: "10px 15px", cursor: "pointer", fontFamily: "monospace", fontSize: 10, letterSpacing: 1, whiteSpace: "nowrap", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>

        {/* TOP 10 TRENDING */}
        {tab === "trending" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#303040" }}>TOP 10 BY 24H VOLUME · AUTO-REFRESHES EVERY 2 MIN</div>
              <button onClick={loadTrending} style={{ background: "#0e0e20", border: "1px solid #1e1e30", color: "#ffd166", padding: "4px 11px", borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 10 }}>↻</button>
            </div>
            {trendLoad ? (
              <div style={{ color: "#181828", textAlign: "center", padding: 50, fontSize: 11 }}>Loading…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {trending.map((m, i) => (
                  <div key={m.id} style={{ background: "#0c0c18", border: "1px solid #161626", borderRadius: 7, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: i < 3 ? 18 : 13, fontWeight: 700, color: i === 0 ? "#ffd166" : i === 1 ? "#a8a898" : i === 2 ? "#c87941" : "#202030", minWidth: 24 }}>#{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 12, color: "#a8a898", lineHeight: 1.4, marginBottom: 4 }}>{m.label}</div>
                      <VolBar v={m.volume} max={maxVol} />
                      <div style={{ fontSize: 9, color: "#2a2a18", marginTop: 2 }}>24h Vol: <span style={{ color: "#3a3a22" }}>${(m.volume / 1e6).toFixed(2)}M</span>{m.isMock && " (est.)"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#deded6" }}>{m.prob?.toFixed(1) ?? "—"}<span style={{ fontSize: 10, color: "#303040" }}>%</span></div>
                      <div style={{ fontSize: 9, color: "#282828" }}>YES</div>
                    </div>
                    {m.slug && (
                      <a href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 9, color: "#202030", border: "1px solid #181828", padding: "3px 7px", borderRadius: 3, textDecoration: "none", letterSpacing: 1 }}>↗</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WAR */}
        {tab === "war" && (
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#303040", marginBottom: 14 }}>IRAN · MIDDLE EAST WAR MARKETS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 11 }}>
              {markets.filter(m => m.category === "Iran/War").map(m => <MktCard key={m.id} m={m} thr={thr} />)}
            </div>
          </div>
        )}

        {/* OIL */}
        {tab === "oil" && (
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#303040", marginBottom: 14 }}>CRUDE OIL · ENERGY · FUTURES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 11 }}>
              {markets.filter(m => m.category === "Oil/Futures").map(m => <MktCard key={m.id} m={m} thr={thr} />)}
            </div>
          </div>
        )}

        {/* PRESIDENCY */}
        {tab === "politics" && (
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#303040", marginBottom: 14 }}>US PRESIDENCY · POLICY · ECONOMY</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 11 }}>
              {markets.filter(m => m.category === "Presidency").map(m => <MktCard key={m.id} m={m} thr={thr} />)}
            </div>
          </div>
        )}

        {/* IPO */}
        {tab === "ipo" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#303040" }}>UPCOMING IPO WATCH · AI · TECH · FINTECH · SPACE</div>
              <div style={{ fontSize: 9, color: "#1a1a1a" }}>Not financial advice · verify with latest news</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 11 }}>
              {UPCOMING_IPOS.map(ipo => <IPOCard key={ipo.name} ipo={ipo} />)}
            </div>
            <div style={{ marginTop: 16, background: "#0c0c18", border: "1px solid #161626", borderRadius: 7, padding: 12 }}>
              <div style={{ fontSize: 9, color: "#202020", lineHeight: 1.8 }}>⚠️ IPO data sourced from public filings and news as of April 2025. Valuations and timelines are estimates. Not financial advice.</div>
            </div>
          </div>
        )}

        {/* ALERTS */}
        {tab === "alerts" && (
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#303040", marginBottom: 14 }}>σ-TRIGGERED ALERT LOG · LIVE MOVES ONLY</div>
            {alerts.length === 0
              ? <div style={{ color: "#181828", textAlign: "center", padding: 60, fontSize: 11 }}>No alerts yet — fires when a market moves ≥{thr}σ between checks.</div>
              : <div style={{ background: "#0c0c18", border: "1px solid #161626", borderRadius: 7, overflow: "hidden" }}>
                  {alerts.map((a, i) => (
                    <div key={i} style={{ padding: "8px 14px", borderBottom: "1px solid #101018", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 11 }}>
                      <span style={{ color: "#202030", fontSize: 9, minWidth: 58 }}>{a.time}</span>
                      <Badge cat={a.category} />
                      <span style={{ color: "#989888", flex: 1 }}>{a.label}</span>
                      <span style={{ color: "#444" }}>{a.prevProb?.toFixed(1)}% → <span style={{ color: a.prob > a.prevProb ? "#5dffaa" : "#ff7070", fontWeight: 700 }}>{a.prob?.toFixed(1)}%</span></span>
                      <span style={{ color: "#ff7070", fontSize: 10 }}>Δ{a.delta?.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.05}}
        @keyframes pulse{from{opacity:0.4}to{opacity:1}}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#08080f}
        ::-webkit-scrollbar-thumb{background:#181828;border-radius:2px}
      `}</style>
    </div>
  );
}
