"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError("Couldn't load recommendations. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return (
    <div style={s.page}>
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Background blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.container}>

        {/* Header */}
        <header style={s.header}>
          <div style={s.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span style={s.logoText}>Discover</span>
          </div>

          {session && (
            <div style={s.userArea}>
              <div style={s.avatar}>
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={s.userName}>{session.user?.name}</span>
              <button style={s.signOutBtn} onClick={() => signOut()}>Sign out</button>
            </div>
          )}
        </header>

        {/* Hero */}
        <section style={s.hero}>
          <p style={s.eyebrow}>AI-Powered Music Discovery</p>
          <h1 style={s.heroTitle}>
            Music made<br />
            <span style={s.heroAccent}>for you.</span>
          </h1>
          <p style={s.heroSub}>
            We analyze your Spotify taste and use AI to find songs you'll love but haven't heard yet.
          </p>

          {!session ? (
            <button style={s.spotifyBtn} onClick={() => signIn("spotify")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{flexShrink:0}}>
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Continue with Spotify
            </button>
          ) : (
            <button
              style={loading ? {...s.discoverBtn, ...s.discoverBtnLoading} : s.discoverBtn}
              onClick={getRecommendations}
              disabled={loading}
            >
              {loading ? (
                <span style={s.btnInner}>
                  <span style={s.btnSpinner} /> Analyzing your taste...
                </span>
              ) : (
                <span style={s.btnInner}>
                  ✦ Discover New Music
                </span>
              )}
            </button>
          )}

          {error && <p style={s.error}>{error}</p>}
        </section>

        {/* Results */}
        {recommendations.length > 0 && (
          <section style={s.results}>
            <h2 style={s.resultsTitle}>Your Picks</h2>
            <p style={s.resultsSubtitle}>Chosen just for you based on your listening history</p>
            <div style={s.grid}>
              {recommendations.map((track, i) => (
                <div key={track.id} style={s.card} onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "#1DB954";
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}>
                  <div style={s.cardTop}>
                    <div style={s.trackNum}>{String(i + 1).padStart(2, "0")}</div>
                    {track.albumArt && (
                      <img src={track.albumArt} alt={track.name} style={s.albumArt} />
                    )}
                    <div style={s.trackInfo}>
                      <p style={s.trackName}>{track.name}</p>
                      <p style={s.artistName}>{track.artist}</p>
                    </div>
                    <a href={track.spotifyUrl} target="_blank" rel="noreferrer" style={s.openBtn}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </a>
                  </div>
                  <p style={s.reason}>"{track.reason}"</p>
                  <iframe
                    src={`https://open.spotify.com/embed/track/${track.id}?theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    style={s.embed}
                  />
                </div>
              ))}
            </div>

            <button style={s.refreshBtn} onClick={getRecommendations} disabled={loading}>
              {loading ? "Loading..." : "↻ Get New Recommendations"}
            </button>
          </section>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Circular+Std:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "fixed",
    top: "-20%",
    left: "-10%",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(29,185,84,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  blob2: {
    position: "fixed",
    bottom: "-20%",
    right: "-10%",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(29,185,84,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "28px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 80,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "-0.3px",
    color: "#fff",
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#1DB954",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#000",
  },
  userName: {
    fontSize: 14,
    color: "#aaa",
  },
  signOutBtn: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#aaa",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  hero: {
    textAlign: "center",
    marginBottom: 80,
    animation: "fadeUp 0.6s ease forwards",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#1DB954",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: "clamp(48px, 8vw, 80px)",
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: "-2px",
    marginBottom: 24,
    color: "#fff",
  },
  heroAccent: {
    color: "#1DB954",
  },
  heroSub: {
    fontSize: 18,
    color: "#888",
    maxWidth: 480,
    margin: "0 auto 40px",
    lineHeight: 1.6,
    fontWeight: 300,
  },
  spotifyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "#1DB954",
    color: "#fff",
    border: "none",
    borderRadius: 50,
    padding: "16px 36px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.2px",
    transition: "all 0.2s",
  },
  discoverBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "#1DB954",
    color: "#000",
    border: "none",
    borderRadius: 50,
    padding: "16px 36px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: "-0.2px",
  },
  discoverBtnLoading: {
    background: "#158a3e",
    cursor: "not-allowed",
  },
  btnInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  btnSpinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(0,0,0,0.3)",
    borderTopColor: "#000",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  error: {
    color: "#ff4444",
    marginTop: 16,
    fontSize: 14,
  },
  loadingScreen: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(29,185,84,0.2)",
    borderTopColor: "#1DB954",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  results: {
    animation: "fadeUp 0.5s ease forwards",
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: "-0.8px",
    marginBottom: 8,
  },
  resultsSubtitle: {
    color: "#666",
    fontSize: 14,
    marginBottom: 40,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 20,
    transition: "transform 0.2s ease, border-color 0.2s ease",
    cursor: "default",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  trackNum: {
    fontSize: 12,
    fontWeight: 600,
    color: "#444",
    width: 24,
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },
  albumArt: {
    width: 52,
    height: 52,
    borderRadius: 8,
    objectFit: "cover",
    flexShrink: 0,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackName: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  artistName: {
    fontSize: 13,
    color: "#888",
  },
  openBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid rgba(29,185,84,0.3)",
    flexShrink: 0,
    textDecoration: "none",
    transition: "background 0.2s",
  },
  reason: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 14,
    paddingLeft: 40,
    lineHeight: 1.5,
  },
  embed: {
    borderRadius: 8,
    display: "block",
  },
  refreshBtn: {
    display: "block",
    margin: "48px auto 0",
    background: "none",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#888",
    borderRadius: 50,
    padding: "12px 28px",
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};