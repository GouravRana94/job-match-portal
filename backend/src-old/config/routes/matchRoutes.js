const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';


// ✅ GET ALL MATCHES
router.get('/', auth, async (req, res) => {
  try {
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );

    if (seekerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Please complete your profile first' });
    }

    const seekerId = seekerResult.rows[0].id;

    const matches = await pool.query(
      `SELECT jm.*, 
              j.title, j.company, j.location, j.description, j.requirements,
              j.salary_range, j.employment_type
       FROM job_matches jm
       JOIN jobs j ON jm.job_id = j.id
       WHERE jm.job_seeker_id = $1
       ORDER BY jm.match_score DESC`,
      [seekerId]
    );

    res.json(matches.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ✅ GENERATE MATCHES (ML + FALLBACK)
router.post('/generate', auth, async (req, res) => {
  try {
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );

    if (seekerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Complete your profile first' });
    }

    const seekerId = seekerResult.rows[0].id;

    try {
      // 🔥 ML CALL
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/match`, {
        job_seeker_id: seekerId,
        job_ids: null
      });

      return res.json({
        success: true,
        type: 'ml',
        matches: mlResponse.data
      });

    } catch (mlError) {
      // ⚠️ FALLBACK
      console.log('ML failed → using fallback');

      const fallbackMatches = await generateFallbackMatches(seekerId);

      return res.json({
        success: true,
        type: 'fallback',
        matches: fallbackMatches
      });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ✅ TOP MATCHES
router.get('/top', auth, async (req, res) => {
  try {
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );

    if (seekerResult.rows.length === 0) return res.json([]);

    const seekerId = seekerResult.rows[0].id;

    const result = await pool.query(
      `SELECT j.*, jm.match_score
       FROM job_matches jm
       JOIN jobs j ON jm.job_id = j.id
       WHERE jm.job_seeker_id = $1
       ORDER BY jm.match_score DESC
       LIMIT 5`,
      [seekerId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ RECOMMENDATIONS
router.get('/recommendations', auth, async (req, res) => {
  try {
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );

    if (seekerResult.rows.length === 0) {
      return res.json({ recommendations: [] });
    }

    const seekerId = seekerResult.rows[0].id;

    const matches = await pool.query(
      `SELECT j.*, jm.match_score
       FROM job_matches jm
       JOIN jobs j ON jm.job_id = j.id
       WHERE jm.job_seeker_id = $1 AND jm.match_score > 60
       ORDER BY jm.match_score DESC
       LIMIT 10`,
      [seekerId]
    );

    res.json({
      recommendations: matches.rows
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ SKILL GAP ANALYSIS
router.get('/skill-gap', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT skills FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ analysis: null });
    }

    const userSkills = new Set(result.rows[0].skills.map(s => s.toLowerCase()));

    const jobs = await pool.query(
      'SELECT requirements FROM jobs WHERE is_active = true LIMIT 20'
    );

    const freq = {};

    jobs.rows.forEach(job => {
      job.requirements.forEach(skill => {
        const s = skill.toLowerCase();
        freq[s] = (freq[s] || 0) + 1;
      });
    });

    const missing = Object.entries(freq)
      .filter(([skill]) => !userSkills.has(skill))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    res.json({
      missing_skills: missing
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// 🔥 FALLBACK MATCHING FUNCTION
async function generateFallbackMatches(seekerId) {
  const seeker = await pool.query(
    'SELECT skills, experience_years FROM job_seekers WHERE id = $1',
    [seekerId]
  );

  if (seeker.rows.length === 0) return [];

  const skills = seeker.rows[0].skills || [];
  const exp = seeker.rows[0].experience_years || 0;

  const jobs = await pool.query(
    'SELECT id, requirements FROM jobs WHERE is_active = true'
  );

  const matches = [];

  for (const job of jobs.rows) {
    const jobSkills = job.requirements || [];

    const matched = skills.filter(s =>
      jobSkills.some(j =>
        j.toLowerCase().includes(s.toLowerCase())
      )
    );

    const score = jobSkills.length
      ? (matched.length / jobSkills.length) * 100
      : 50;

    const final = Math.min(100, score + exp * 5);

    await pool.query(
      `INSERT INTO job_matches (job_seeker_id, job_id, match_score)
       VALUES ($1, $2, $3)
       ON CONFLICT (job_seeker_id, job_id)
       DO UPDATE SET match_score = EXCLUDED.match_score`,
      [seekerId, job.id, final]
    );

    matches.push({ job_id: job.id, match_score: final });
  }

  return matches.sort((a, b) => b.match_score - a.match_score);
}

module.exports = router;