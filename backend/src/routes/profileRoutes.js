const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user.id);
    
    // Get user basic info
    const userResult = await pool.query(
      'SELECT id, email, full_name, user_type, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get job seeker profile if exists
    const seekerResult = await pool.query(
      'SELECT * FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    const profile = {
      ...user,
      profile: seekerResult.rows[0] || null
    };
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/profile
// @desc    Update job seeker profile
// @access  Private
router.put('/', auth, async (req, res) => {
  const { skills, experience_years, education, resume_text, preferred_location, current_title, linkedin_url } = req.body;
  
  try {
    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT * FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    let result;
    
    if (existingProfile.rows.length === 0) {
      // Create new profile
      result = await pool.query(
        `INSERT INTO job_seekers 
         (user_id, skills, experience_years, education, resume_text, preferred_location, current_title, linkedin_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.user.id, skills, experience_years, education, resume_text, preferred_location, current_title, linkedin_url]
      );
    } else {
      // Update existing profile
      result = await pool.query(
        `UPDATE job_seekers 
         SET skills = COALESCE($1, skills),
             experience_years = COALESCE($2, experience_years),
             education = COALESCE($3, education),
             resume_text = COALESCE($4, resume_text),
             preferred_location = COALESCE($5, preferred_location),
             current_title = COALESCE($6, current_title),
             linkedin_url = COALESCE($7, linkedin_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $8
         RETURNING *`,
        [skills, experience_years, education, resume_text, preferred_location, current_title, linkedin_url, req.user.id]
      );
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/profile/stats
// @desc    Get profile statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get job seeker profile
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.json({
        total_applications: 0,
        active_applications: 0,
        match_scores: [],
        message: 'No profile found'
      });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Get application statistics
    const appStats = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM applications 
       WHERE job_seeker_id = $1 
       GROUP BY status`,
      [seekerId]
    );
    
    // Get match statistics
    const matchStats = await pool.query(
      `SELECT AVG(match_score) as avg_score, MAX(match_score) as max_score
       FROM job_matches 
       WHERE job_seeker_id = $1`,
      [seekerId]
    );
    
    // Get recent matches
    const recentMatches = await pool.query(
      `SELECT j.title, j.company, jm.match_score, jm.created_at
       FROM job_matches jm
       JOIN jobs j ON jm.job_id = j.id
       WHERE jm.job_seeker_id = $1
       ORDER BY jm.match_score DESC
       LIMIT 5`,
      [seekerId]
    );
    
    res.json({
      applications: appStats.rows,
      matches: matchStats.rows[0],
      recent_matches: recentMatches.rows
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;