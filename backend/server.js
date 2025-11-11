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

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const API_BASE = process.env.API_BASE || 'http://marcconrad.com/uob/heart/api.php';
const TOKEN_EXPIRES_SECONDS = Number(process.env.TOKEN_EXPIRES_SECONDS || 300);
const SCORE_FILE = path.join(__dirname, 'scores.json');

// --- Load scores from file ---
let userScores = {};
let globalHighScore = 0;
if (fs.existsSync(SCORE_FILE)) {
  const saved = JSON.parse(fs.readFileSync(SCORE_FILE, 'utf-8'));
  userScores = saved.userScores || {};
  globalHighScore = saved.globalHighScore || 0;
}

// --- Save scores to file ---
function saveScores() {
  fs.writeFileSync(SCORE_FILE, JSON.stringify({ userScores, globalHighScore }, null, 2));
}

// --- Create JWT token for solution ---
function createGameToken(solution, expiresSeconds = TOKEN_EXPIRES_SECONDS) {
  const payload = {
    sol: Number(solution),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresSeconds
  };
  return jwt.sign(payload, JWT_SECRET);
}

function verifyGameToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { ok: true, payload: decoded };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// --- Parse external API response ---
function parseHeartApiResponse(data) {
  if (!data) return null;

  if (typeof data === 'object') {
    const image = data.image || data.url || data.question || data.img || data.data || null;
    const solution = data.answer || data.solution || data.ans || data.count || data.sol || null;
    if (image && (solution !== null && solution !== undefined)) {
      return { image, solution: Number(solution) };
    }
    if (data.question && data.answer !== undefined) {
      return { image: data.question, solution: Number(data.answer) };
    }
    if (typeof data === 'string') {
      const parts = data.split(',');
      if (parts.length >= 2) {
        return { image: parts[0].trim(), solution: Number(parts[1].trim()) };
      }
    }
  }

  if (typeof data === 'string') {
    const parts = data.split(',');
    if (parts.length >= 2) {
      const solutionStr = parts[parts.length - 1].trim();
      const imageStr = parts.slice(0, parts.length - 1).join(',').trim();
      const solNum = Number(solutionStr);
      if (!Number.isNaN(solNum)) return { image: imageStr, solution: solNum };
    }
  }

  return null;
}

// --- Fetch with retries ---
async function fetchFromApi(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await axios.get(url, { timeout: 8000 });
      return r.data;
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}

// --- GET new puzzle ---
app.get('/api/new', async (req, res) => {
  const base64 = req.query.base64 === 'yes' ? 'yes' : 'no';
  const url = `${API_BASE}?out=json&base64=${base64}`;

  try {
    const data = await fetchFromApi(url);
    const parsed = parseHeartApiResponse(data);

    if (!parsed) {
      return res.status(502).json({ error: 'unexpected_external_api_format', raw: data });
    }

    const token = createGameToken(parsed.solution, TOKEN_EXPIRES_SECONDS);

    let image = parsed.image;
    if (base64 === 'yes' && image && !image.startsWith('data:')) {
      image = `data:image/png;base64,${image}`;
    }

    res.json({ image, base64: base64 === 'yes', gameToken: token, expirySeconds: TOKEN_EXPIRES_SECONDS });
  } catch (err) {
    console.error('Error calling heart API:', err.message || err);
    if (err.response) {
      return res.status(502).json({ error: 'external_api_error', status: err.response.status, data: err.response.data });
    }
    res.status(500).json({ error: 'upstream_error', message: err.message });
  }
});

// --- POST validate guess ---
app.post('/api/validate', (req, res) => {
  const { gameToken, guess } = req.body || {};
  if (!gameToken) return res.status(400).json({ error: 'missing_gameToken' });
  if (guess === undefined || guess === null) return res.status(400).json({ error: 'missing_guess' });

  const check = verifyGameToken(gameToken);
  if (!check.ok) return res.status(400).json({ error: 'invalid_token', message: check.error });

  const solution = Number(check.payload.sol);
  const guessNum = Number(guess);
  if (Number.isNaN(guessNum)) return res.status(400).json({ error: 'guess_not_number' });

  const correct = guessNum === solution;
  res.json({ correct, solution });
});

// --- POST update/fetch user score ---
app.post('/api/score', (req, res) => {
  const { username, score } = req.body || {};
  if (!username) return res.status(400).json({ error: 'missing_username' });
  const numScore = Number(score) || 0;

  if (!userScores[username]) userScores[username] = 0;
  if (numScore > userScores[username]) userScores[username] = numScore;

  // update global highscore
  globalHighScore = Math.max(globalHighScore, userScores[username]);

  saveScores();

  res.json({ userBestScore: userScores[username], globalHighScore });
});

app.listen(PORT, () => {
  console.log(`Heart Game API proxy running on http://localhost:${PORT}`);
});
