// fetch-transcripts.js
// Fetches YouTube transcripts via the Supadata API
// Free tier: 100 requests/month — sign up at https://supadata.ai (no credit card)
//
// SETUP:
// 1. Paste your Supadata API key below (replace YOUR_API_KEY_HERE)
// 2. Run from project root: node research/scripts/fetch-transcripts.js

const fs = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SUPADATA_API_KEY = 'sd_5089b9999ab029d192092cc88fe7649e';

// Video IDs pre-populated by research agent — do not modify unless replacing a failed video
const VIDEO_IDS = {
  'devin-reed': [
    '0jDEfShf3mc',   // B2B Content Growth: The Real Strategy for Today (Oct 2025)
    '-hwjjO0KLPA',   // Stop Chasing Vanity Metrics: Real B2B Marketing ROI (Jun 2025)
    'mu72K4ezJk0',   // Why executives should hit record: video on LinkedIn (Jul 2025)
  ],
  'dave-gerhardt': [
    '-7drPzHJDPQ',   // Behind the Scenes of Our Content Strategy at Exit Five (Aug 2024)
    'Pm8VAqFG4jA',   // How Dave Gerhardt Built a B2B Audience of 200,000+ (Jan 2025)
    'alFHtDXq1zg',   // How to get the CEO to post on LinkedIn (May 2024)
  ],
  'richard-van-der-blom': [
    'nmPGcQvDnEg',   // How to Use LinkedIn 2025 Algorithm (Jun 2025)
    '_W1BBPbnaO4',   // Cracking the LinkedIn Code: Inside the Algorithm (Aug 2025)
    'bGVmEDtK-5s',   // LinkedIn Algorithm Expert - Career Club Live (Apr 2024)
  ],
  'chris-walker': [
    '7iVrGQsvqRw',   // Content Flywheel: A Game-Changing Strategy (Jan 2024)
    'nmF1BFUnbus',   // Chris Walker: What Matters in B2B Marketing in 2024 (Apr 2024)
    'Kw9h5N60Uj8',   // Creating demand in B2B with Chris Walker (Nov 2023)
  ],
  'april-dunford': [
    '65h0xYQA9cE',   // B2B Positioning Masterclass (Jun 2024)
    'AwGLeRJTIrA',   // How to Position Your B2B SaaS for Explosive Growth (Jan 2025)
    'tX_UHo59_g0',   // How to Effectively Position Your B2B Brand (May 2025)
  ],
};

const OUTPUT_BASE = path.join(__dirname, '..', 'youtube-transcripts');

// ─── SLUG MAP (matches existing stub filenames) ───────────────────────────────

const SLUG_MAP = {
  '0jDEfShf3mc':  'b2b-content-growth-real-strategy-today',
  '-hwjjO0KLPA':  'stop-chasing-vanity-metrics-real-b2b-marketing-roi',
  'mu72K4ezJk0':  'why-executives-should-hit-record-video-linkedin',
  '-7drPzHJDPQ':  'behind-scenes-content-strategy-exit-five',
  'Pm8VAqFG4jA':  'how-dave-gerhardt-built-b2b-audience-200k',
  'alFHtDXq1zg':  'how-to-get-ceo-to-post-on-linkedin',
  'nmPGcQvDnEg':  'linkedin-2025-algorithm-attract-clients-candidates',
  '_W1BBPbnaO4':  'cracking-linkedin-code-inside-algorithm',
  'bGVmEDtK-5s':  'linkedin-algorithm-expert-career-club-live',
  '7iVrGQsvqRw':  'content-flywheel-game-changing-strategy',
  'nmF1BFUnbus':  'what-matters-b2b-marketing-2024',
  'Kw9h5N60Uj8':  'creating-demand-b2b-chris-walker',
  '65h0xYQA9cE':  'b2b-positioning-masterclass',
  'AwGLeRJTIrA':  'how-to-position-b2b-saas-explosive-growth',
  'tX_UHo59_g0':  'how-to-effectively-position-b2b-brand',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── API CALLS ────────────────────────────────────────────────────────────────

async function fetchTranscript(videoId) {
  const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`;
  const response = await fetch(url, {
    headers: { 'x-api-key': SUPADATA_API_KEY },
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HTTP ${response.status}: ${err}`);
  }
  return await response.json();
}

async function fetchVideoMetadata(videoId) {
  const url = `https://api.supadata.ai/v1/youtube/video?videoId=${videoId}`;
  const response = await fetch(url, {
    headers: { 'x-api-key': SUPADATA_API_KEY },
  });
  if (!response.ok) return { title: videoId, publishedAt: 'unknown', channelTitle: 'unknown', duration: 'unknown' };
  return await response.json();
}

// ─── FORMAT OUTPUT ────────────────────────────────────────────────────────────

function formatTranscriptFile(videoId, metadata, transcriptData) {
  const segments = transcriptData.content || [];
  const fullText = segments.map(seg => seg.text).join(' ');
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  const timestamped = segments.map(seg => {
    const totalSec = Math.floor((seg.offset || 0) / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}] ${seg.text}`;
  }).join('\n');

  return `# Transcript — ${metadata.title || videoId}
Video ID: ${videoId}
URL: https://youtube.com/watch?v=${videoId}
Channel: ${metadata.channelTitle || 'unknown'}
Published: ${metadata.publishedAt || 'unknown'}
Duration: ${metadata.duration || 'unknown'}
Word count: ~${wordCount}
Collected: ${new Date().toISOString().split('T')[0]}

---

## Full Transcript

${fullText}

---

## Timestamped Segments

${timestamped}
`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎬 Transcript Fetcher — Supadata API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (SUPADATA_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('\n❌  Add your Supadata API key first.');
    console.error('    Sign up free (no credit card): https://supadata.ai');
    console.error('    Then replace YOUR_API_KEY_HERE in this file.\n');
    process.exit(1);
  }

  let fetched = 0;
  let errors = 0;
  const errorLog = [];

  for (const [expert, videoIds] of Object.entries(VIDEO_IDS)) {
    console.log(`\n📂  ${expert}`);
    const expertDir = path.join(OUTPUT_BASE, expert);

    for (const videoId of videoIds) {
      const slug = SLUG_MAP[videoId] || videoId;
      const filename = `${videoId}-${slug}.txt`;
      const filepath = path.join(expertDir, filename);

      process.stdout.write(`    ${videoId}  →  `);

      try {
        const [meta, transcript] = await Promise.all([
          fetchVideoMetadata(videoId),
          fetchTranscript(videoId),
        ]);

        const content = formatTranscriptFile(videoId, meta, transcript);
        fs.writeFileSync(filepath, content, 'utf8');

        const words = content.split(/\s+/).length;
        console.log(`✅  ${words.toLocaleString()} words  →  ${filename}`);
        fetched++;

      } catch (err) {
        console.log(`❌  ${err.message}`);
        errorLog.push({ expert, videoId, error: err.message });
        errors++;
      }

      await sleep(1300); // respect rate limits
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅  ${fetched} transcripts fetched`);
  if (errors > 0) {
    console.log(`❌  ${errors} errors:`);
    errorLog.forEach(e => console.log(`    ${e.expert} / ${e.videoId}: ${e.error}`));
    console.log('\n💡  For failed videos, check:');
    console.log('    1. Video is public (open in incognito to verify)');
    console.log('    2. Video has captions enabled');
    console.log('    3. You have remaining API credits at supadata.ai/dashboard');
  }
  console.log(`\n📁  Transcripts saved to: research/youtube-transcripts/\n`);
}

main().catch(console.error);
