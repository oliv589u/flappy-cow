// leaderboard-server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let scores = []; // In-memory leaderboard

// Add new score
app.post('/scores', (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  scores.push({ name, score, date: Date.now() });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 50);
  res.json({ message: 'Score added' });
});

// Get top scores
app.get('/scores/top', (req, res) => {
  res.json(scores);
});

app.listen(PORT, () => {
  console.log(`Leaderboard server running on port ${PORT}`);
});
