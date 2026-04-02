const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// @route   POST /api/applications
// @desc    Apply for a job
// @access  Private
router.post('/', auth, async (req, res) => {
  const { job_id, notes } = req.body;
  
  try {
    // Get job seeker id
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Please complete your profile first' });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Check if already applied
    const existing = await pool.query(
      'SELECT id FROM applications WHERE job_seeker_id = $1 AND job_id = $2',
      [seekerId, job_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }
    
    // Create application
    const result = await pool.query(
      `INSERT INTO applications (job_seeker_id, job_id, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [seekerId, job_id, notes]
    );
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/applications
// @desc    Get user's applications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.json([]);
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    const applications = await pool.query(
      `SELECT a.*, j.title, j.company, j.location, j.salary_range
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.job_seeker_id = $1
       ORDER BY a.applied_date DESC`,
      [seekerId]
    );
    
    res.json(applications.rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;