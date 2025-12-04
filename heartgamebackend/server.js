require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- Config ---
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const API_BASE = process.env.API_BASE || 'http://marcconrad.com/uob/heart/api.php';
const TOKEN_EXPIRES_SECONDS = Number(process.env.TOKEN_EXPIRES_SECONDS || 300);
const SCORE_FILE = path.join(__dirname, 'scores.json');

// --- Score Data ---
let userScores = {};
let globalHighScore = 0;

if (fs.existsSync(SCORE_FILE)) {
  const saved = JSON.parse(fs.readFileSync(SCORE_FILE, 'utf-8'));
  userScores = saved.userScores || {};
  globalHighScore = saved.globalHighScore || 0;
}

function saveScores() {
  fs.writeFileSync(
    SCORE_FILE,
    JSON.stringify({ userScores, globalHighScore }, null, 2)
  );
}

// --- JWT Helpers ---
function createGameToken(solution, expires = TOKEN_EXPIRES_SECONDS) {
  const payload = {
    sol: Number(solution),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expires
  };
  return jwt.sign(payload, JWT_SECRET);
}

function verifyGameToken(token) {
  try {
    return { ok: true, payload: jwt.verify(token, JWT_SECRET) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// --- API Response Parser ---
function parseHeartApiResponse(data) {
  if (!data) return null;

  // If object
  if (typeof data === 'object') {
    const image =
      data.image || data.url || data.question || data.img || data.data || null;

    const solution =
      data.answer ||
      data.solution ||
      data.ans ||
      data.count ||
      data.sol ||
      null;

    if (image && solution !== null && solution !== undefined) {
      return { image, solution: Number(solution) };
    }
  }

  // If string: "base64data,12" OR "image.png,12"
  if (typeof data === 'string') {
    const parts = data.split(',');
    if (parts.length >= 2) {
      const solutionStr = parts.pop().trim();
      const solNum = Number(solutionStr);
      const imageStr = parts.join(',').trim();
      if (!Number.isNaN(solNum)) {
        return { image: imageStr, solution: solNum };
      }
    }
  }

  return null;
}

// --- Fetch with Retry ---
async function fetchFromApi(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await axios.get(url, { timeout: 8000 });
      return r.data;
    } catch (e) {
      if (i === retries) throw e;
    }
  }
}

// --- Routes ---

// GET new puzzle
app.get('/api/new', async (req, res) => {
  const base64 = req.query.base64 === 'yes' ? 'yes' : 'no';
  const url = `${API_BASE}?out=json&base64=${base64}`;

  try {
    const data = await fetchFromApi(url);
    const parsed = parseHeartApiResponse(data);

    if (!parsed) {
      return res.status(502).json({ error: 'unexpected_external_api_format', raw: data });
    }

    let { image, solution } = parsed;
    const gameToken = createGameToken(solution);

    // Convert base64 properly
    if (base64 === 'yes' && image && !image.startsWith('data:')) {
      image = `data:image/png;base64,${image}`;
    }

    res.json({
      image,
      base64: base64 === 'yes',
      gameToken,
      expirySeconds: TOKEN_EXPIRES_SECONDS
    });

  } catch (err) {
    console.error('Heart API error:', err);
    if (err.response) {
      return res.status(502).json({
        error: 'external_api_error',
        status: err.response.status,
        data: err.response.data
      });
    }
    res.status(500).json({ error: 'upstream_error', message: err.message });
  }
});

// Validate guess
app.post('/api/validate', (req, res) => {
  const { gameToken, guess } = req.body || {};

  if (!gameToken) return res.status(400).json({ error: 'missing_gameToken' });
  if (guess === undefined) return res.status(400).json({ error: 'missing_guess' });

  const check = verifyGameToken(gameToken);
  if (!check.ok) {
    return res.status(400).json({ error: 'invalid_token', message: check.error });
  }

  const solution = Number(check.payload.sol);
  const guessNum = Number(guess);

  if (Number.isNaN(guessNum)) {
    return res.status(400).json({ error: 'guess_not_number' });
  }

  res.json({ correct: guessNum === solution, solution });
});

// Score update / fetch
app.post('/api/score', (req, res) => {
  const { username, score } = req.body || {};

  if (!username) return res.status(400).json({ error: 'missing_username' });

  const numScore = Number(score) || 0;

  // Update personal best
  userScores[username] = Math.max(userScores[username] || 0, numScore);

  // Update global highscore
  globalHighScore = Math.max(globalHighScore, userScores[username]);

  saveScores();

  res.json({
    userBestScore: userScores[username],
    globalHighScore
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Heart Game API running on http://localhost:${PORT}`);
});
