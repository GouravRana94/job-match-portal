const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// @route   GET /api/jobs
// @desc    Get all jobs with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { title, location, skills, page = 1, limit = 10 } = req.query;
    
    let query = `SELECT j.*, u.full_name as posted_by_name
                 FROM jobs j
                 LEFT JOIN users u ON j.posted_by = u.id
                 WHERE j.is_active = true`;
    const params = [];
    let paramIndex = 1;
    
    if (title) {
      query += ` AND j.title ILIKE $${paramIndex}`;
      params.push(`%${title}%`);
      paramIndex++;
    }
    
    if (location) {
      query += ` AND j.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }
    
    if (skills) {
      const skillArray = skills.split(',');
      query += ` AND j.requirements && $${paramIndex}`;
      params.push(skillArray);
      paramIndex++;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY j.posted_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM jobs WHERE is_active = true`;
    const countResult = await pool.query(countQuery);
    
    res.json({
      jobs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, u.full_name as posted_by_name
       FROM jobs j
       LEFT JOIN users u ON j.posted_by = u.id
       WHERE j.id = $1 AND j.is_active = true`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/jobs
// @desc    Create new job
// @access  Private (Employers only)
router.post('/', auth, async (req, res) => {
  const { title, company, description, requirements, location, salary_range, employment_type } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO jobs (title, company, description, requirements, location, salary_range, employment_type, posted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, company, description, requirements, location, salary_range, employment_type, req.user.id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job
// @access  Private (Job owner only)
router.put('/:id', auth, async (req, res) => {
  const { title, company, description, requirements, location, salary_range, employment_type, is_active } = req.body;
  
  try {
    // Check if job exists and user owns it
    const jobCheck = await pool.query(
      'SELECT posted_by FROM jobs WHERE id = $1',
      [req.params.id]
    );
    
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (jobCheck.rows[0].posted_by !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }
    
    const result = await pool.query(
      `UPDATE jobs 
       SET title = COALESCE($1, title),
           company = COALESCE($2, company),
           description = COALESCE($3, description),
           requirements = COALESCE($4, requirements),
           location = COALESCE($5, location),
           salary_range = COALESCE($6, salary_range),
           employment_type = COALESCE($7, employment_type),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, company, description, requirements, location, salary_range, employment_type, is_active, req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Job updated successfully',
      job: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job (soft delete)
// @access  Private (Job owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if job exists and user owns it
    const jobCheck = await pool.query(
      'SELECT posted_by FROM jobs WHERE id = $1',
      [req.params.id]
    );
    
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (jobCheck.rows[0].posted_by !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }
    
    await pool.query(
      'UPDATE jobs SET is_active = false WHERE id = $1',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;