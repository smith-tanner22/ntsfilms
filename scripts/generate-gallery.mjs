// Regenerates json/videos.json from the @Tanner22Films YouTube channel.
//
// Pulls public uploads from 2025-01-01 onward, parses each title of the form
// "Location | Names" into { title, youtubeId, description }, applies optional
// overrides, and writes the result newest-first.
//
// Usage:  YOUTUBE_API_KEY=... node scripts/generate-gallery.mjs
// Requires Node 18+ (uses the built-in global fetch). No dependencies.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HANDLE = 'Tanner22Films';
const CUTOFF = '2025-01-01T00:00:00Z'; // keep uploads at or after this date
const API = 'https://www.googleapis.com/youtube/v3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const OVERRIDES_PATH = join(repoRoot, 'json', 'gallery.overrides.json');
const OUTPUT_PATH = join(repoRoot, 'json', 'videos.json');

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.error('Missing YOUTUBE_API_KEY environment variable.');
  process.exit(1);
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube API ${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

// "Location | Names" -> { title: names, description: location, hasSeparator }.
// Names sometimes use "+" and sometimes "&"; normalize to "&".
// `hasSeparator` is false when the title isn't in the wedding "Location | Names"
// format — those videos (promos, non-weddings, etc.) are skipped by default.
function parseTitle(rawTitle) {
  const title = rawTitle.trim();
  const i = title.indexOf('|');
  const hasSeparator = i > -1;
  const location = hasSeparator ? title.slice(0, i).trim() : '';
  const names = (hasSeparator ? title.slice(i + 1) : title)
    .trim()
    .replace(/\s*\+\s*/g, ' & ');
  return { title: names, description: location, hasSeparator };
}

async function loadOverrides() {
  try {
    const raw = await readFile(OVERRIDES_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      exclude: new Set(parsed.exclude || []),
      overrides: parsed.overrides || {},
    };
  } catch (err) {
    if (err.code === 'ENOENT') return { exclude: new Set(), overrides: {} };
    throw err;
  }
}

async function getUploadsPlaylistId() {
  const url = `${API}/channels?part=contentDetails&forHandle=${HANDLE}&key=${apiKey}`;
  const data = await getJson(url);
  const uploads =
    data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) {
    throw new Error(`Could not resolve uploads playlist for @${HANDLE}.`);
  }
  return uploads;
}

// Walk the uploads playlist (newest first) and collect items >= CUTOFF.
// Stop once a full page is entirely older than the cutoff.
async function fetchRecentUploads(playlistId) {
  const kept = [];
  let pageToken = '';
  do {
    const url =
      `${API}/playlistItems?part=snippet,contentDetails&maxResults=50` +
      `&playlistId=${playlistId}&key=${apiKey}` +
      (pageToken ? `&pageToken=${pageToken}` : '');
    const data = await getJson(url);
    const items = data.items || [];
    let anyKeptThisPage = false;
    for (const item of items) {
      const publishedAt =
        item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt;
      if (publishedAt && publishedAt >= CUTOFF) {
        kept.push(item);
        anyKeptThisPage = true;
      }
    }
    // Newest-first ordering: if nothing on this page qualified, everything
    // beyond is older too, so we can stop.
    if (!anyKeptThisPage && items.length > 0) break;
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return kept;
}

async function main() {
  const { exclude, overrides } = await loadOverrides();
  const playlistId = await getUploadsPlaylistId();
  const items = await fetchRecentUploads(playlistId);

  const videos = [];
  let skipped = 0;
  for (const item of items) {
    const youtubeId = item.contentDetails?.videoId;
    if (!youtubeId || exclude.has(youtubeId)) continue;
    const override = overrides[youtubeId];
    const parsed = parseTitle(item.snippet?.title || '');
    // Only include wedding-format "Location | Names" titles. A non-wedding or
    // differently-formatted upload is skipped unless it's explicitly listed in
    // the overrides file (which force-includes it with the given fields).
    if (!parsed.hasSeparator && !override) {
      skipped++;
      continue;
    }
    videos.push({
      title: parsed.title,
      youtubeId,
      description: parsed.description,
      ...(override || {}),
    });
  }
  if (skipped) {
    console.log(`Skipped ${skipped} video(s) not in "Location | Names" format.`);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    videos,
  };
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${videos.length} videos (>= ${CUTOFF}) to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
