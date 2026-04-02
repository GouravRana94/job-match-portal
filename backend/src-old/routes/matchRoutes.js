const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @route   POST /api/matches/generate
// @desc    Generate matches using ML service
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    console.log('Generating matches for user:', req.user.id);
    
    // Get job seeker id
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Please complete your profile first before generating matches' 
      });
    }
    
    const seekerId = seekerResult.rows[0].id;
    console.log('Job seeker ID:', seekerId);
    
    // Check if ML service is available
    try {
      await axios.get(`${ML_SERVICE_URL}/api/health`, { timeout: 2000 });
    } catch (healthError) {
      console.log('ML service health check failed:', healthError.message);
      return res.status(503).json({ 
        success: false,
        message: 'ML service is not available. Please start the ML service first.',
        error: 'ML_SERVICE_OFFLINE',
        instructions: 'Run: cd ml-service && venv\\Scripts\\activate && python main.py'
      });
    }
    
    // Call ML service to generate matches
    console.log('Calling ML service for matches...');
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/match`, {
      job_seeker_id: seekerId,
      job_ids: null // Match with all jobs
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    console.log(`ML service returned ${mlResponse.data.length} matches`);
    
    res.json({
      success: true,
      message: `ML matches generated successfully! Found ${mlResponse.data.length} matches.`,
      matches: mlResponse.data,
      total: mlResponse.data.length
    });
    
  } catch (error) {
    console.error('Error generating ML matches:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        success: false,
        message: 'ML service is not running. Please start it with: python ml-service/main.py',
        error: 'ML_SERVICE_OFFLINE'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        success: false,
        message: error.response.data?.detail || 'ML service error',
        error: 'ML_SERVICE_ERROR'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error generating matches', 
      error: error.message 
    });
  }
});

// @route   GET /api/matches
// @desc    Get all matches for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get job seeker id
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.json({ matches: [], message: 'Complete your profile to see matches' });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Get matches with job details
    const matches = await pool.query(
      `SELECT jm.*, 
              j.id as job_id, j.title, j.company, j.location, 
              j.description, j.requirements, j.salary_range, j.employment_type
       FROM job_matches jm
       JOIN jobs j ON jm.job_id = j.id
       WHERE jm.job_seeker_id = $1
       ORDER BY jm.match_score DESC`,
      [seekerId]
    );
    
    res.json({
      success: true,
      matches: matches.rows,
      total: matches.rows.length
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/matches/top
// @desc    Get top 5 matches
// @access  Private
router.get('/top', auth, async (req, res) => {
  try {
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.json([]);
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    const topMatches = await pool.query(
      `SELECT jm.*, 
              j.title, j.company, j.location, j.salary_range
       FROM job_matches jm
       JOIN jobs j ON jm.job_id = j.id
       WHERE jm.job_seeker_id = $1
       ORDER BY jm.match_score DESC
       LIMIT 5`,
      [seekerId]
    );
    
    res.json(topMatches.rows);
  } catch (error) {
    console.error('Error fetching top matches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/matches/recommendations
// @desc    Get ML recommendations
// @access  Private
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
    
    const recommendations = await pool.query(
      `SELECT j.*, jm.match_score, jm.match_details
       FROM job_matches jm
       JOIN jobs j ON jm.job_id = j.id
       WHERE jm.job_seeker_id = $1 AND jm.match_score > 60
       ORDER BY jm.match_score DESC
       LIMIT 10`,
      [seekerId]
    );
    
    res.json({
      recommendations: recommendations.rows,
      total: recommendations.rows.length
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/matches/skill-gap
// @desc    Analyze skill gap
// @access  Private
router.get('/skill-gap', auth, async (req, res) => {
  try {
    const seekerResult = await pool.query(
      `SELECT js.skills, js.experience_years
       FROM job_seekers js
       WHERE js.user_id = $1`,
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.json({ analysis: null, message: 'Complete your profile first' });
    }
    
    const userSkills = new Set(seekerResult.rows[0].skills.map(s => s.toLowerCase()));
    
    // Get top job requirements
    const jobsResult = await pool.query(
      `SELECT requirements
       FROM jobs
       WHERE is_active = true
       LIMIT 50`
    );
    
    const skillFrequency = new Map();
    jobsResult.rows.forEach(job => {
      if (job.requirements) {
        job.requirements.forEach(skill => {
          const skillLower = skill.toLowerCase();
          skillFrequency.set(skillLower, (skillFrequency.get(skillLower) || 0) + 1);
        });
      }
    });
    
    // Find missing skills
    const missingSkills = [];
    const existingSkills = [];
    
    for (const [skill, frequency] of skillFrequency.entries()) {
      if (userSkills.has(skill)) {
        existingSkills.push({ skill, frequency });
      } else if (frequency > 2) {
        missingSkills.push({ 
          skill, 
          frequency, 
          importance: frequency > 10 ? 'Critical' : frequency > 5 ? 'High' : 'Medium' 
        });
      }
    }
    
    missingSkills.sort((a, b) => b.frequency - a.frequency);
    
    res.json({
      analysis: {
        total_skills_in_market: skillFrequency.size,
        your_skills_count: userSkills.size,
        missing_skills: missingSkills.slice(0, 10),
        market_demand: existingSkills.length > 0 ? 'Good' : 'Needs improvement',
        recommendations: missingSkills.slice(0, 5).map(s => s.skill)
      }
    });
  } catch (error) {
    console.error('Error analyzing skill gap:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;