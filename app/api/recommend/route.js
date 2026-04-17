import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

async function getSpotifyData(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [artistsRes, tracksRes, recentRes] = await Promise.all([
    fetch("https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term", { headers }),
    fetch("https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term", { headers }),
    fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", { headers })
  ]);

  const [topArtists, topTracks, recentTracks] = await Promise.all([
    artistsRes.json(),
    tracksRes.json(),
    recentRes.json()
  ]);

  return {
    topArtists: topArtists.items?.map(a => ({ name: a.name, genres: a.genres })),
    topTracks: topTracks.items?.map(t => ({ name: t.name, artist: t.artists[0].name })),
    recentTracks: recentTracks.items?.map(i => ({ name: i.track.name, artist: i.track.artists[0].name }))
  };
}

async function getSearchQueriesFromClaude(tasteProfile) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: `You are a music discovery agent. Analyze the user's Spotify listening data 
and generate exactly 5 Spotify search queries to find songs they'd love but probably haven't heard.
Focus on finding hidden gems and artists adjacent to their taste — not their top artists themselves.
Respond ONLY with a valid JSON array of 5 search query strings. No explanation, no markdown.
Example: ["indie folk melancholic 2022", "dark synthpop underground"]`,
      messages: [{
        role: "user",
        content: `Here is my Spotify listening data: ${JSON.stringify(tasteProfile)}`
      }]
    })
  });

const data = await response.json();
  console.log("Claude response:", JSON.stringify(data));
  const raw = data.content[0].text.trim().replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(raw);
}

async function searchSpotify(queries, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const results = await Promise.all(
    queries.map(query =>
      fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=2`, { headers })
        .then(r => r.json())
        .then(data => data.tracks?.items || [])
    )
  );

  const seen = new Set();
  return results.flat().filter(track => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  }).slice(0, 5);
}

async function getExplanationsFromClaude(tracks, tasteProfile) {
  const trackList = tracks.map(t => `${t.name} by ${t.artists[0].name}`).join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: `You are a music recommendation assistant. Given a user's taste profile and a list of recommended tracks, write a short one-sentence explanation (max 15 words) for why each track fits them.
Respond ONLY with a valid JSON array of strings, one per track, in the same order.
No explanation, no markdown.`,
      messages: [{
        role: "user",
        content: `Taste profile: ${JSON.stringify(tasteProfile)}\n\nTracks:\n${trackList}`
      }]
    })
  });

  const data = await response.json();
  console.log("Claude explanations response:", JSON.stringify(data));
  const raw2 = data.content[0].text.trim().replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(raw2);
}

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const tasteProfile = await getSpotifyData(session.accessToken);
    console.log("Taste profile:", JSON.stringify(tasteProfile));
    const queries = await getSearchQueriesFromClaude(tasteProfile);
    const tracks = await searchSpotify(queries, session.accessToken);
    const explanations = await getExplanationsFromClaude(tracks, tasteProfile);

    const recommendations = tracks.map((track, i) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      albumArt: track.album.images[0]?.url,
      spotifyUrl: track.external_urls.spotify,
      reason: explanations[i] || "A great match for your taste."
    }));

    return Response.json({ recommendations });
  } catch (err) {
    console.error("Full error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}