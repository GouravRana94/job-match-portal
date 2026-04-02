const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// @route   POST /api/applications
// @desc    Apply for a job
// @access  Private
router.post('/', auth, async (req, res) => {
  const { job_id, notes } = req.body;
  
  // Validate required fields
  if (!job_id) {
    return res.status(400).json({ message: 'Job ID is required' });
  }
  
  try {
    // Get job seeker profile
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Please complete your profile before applying for jobs' 
      });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Check if job exists and is active
    const jobResult = await pool.query(
      'SELECT id, title, company, is_active FROM jobs WHERE id = $1',
      [job_id]
    );
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (!jobResult.rows[0].is_active) {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }
    
    // Check if already applied
    const existingApplication = await pool.query(
      'SELECT id, status FROM applications WHERE job_seeker_id = $1 AND job_id = $2',
      [seekerId, job_id]
    );
    
    if (existingApplication.rows.length > 0) {
      return res.status(400).json({ 
        message: 'You have already applied for this job',
        application: existingApplication.rows[0]
      });
    }
    
    // Create application
    const result = await pool.query(
      `INSERT INTO applications (job_seeker_id, job_id, notes, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [seekerId, job_id, notes || null, 'pending']
    );
    
    // Update match score to indicate application (optional)
    await pool.query(
      `UPDATE job_matches 
       SET match_details = match_details || '{"applied": true}'::jsonb
       WHERE job_seeker_id = $1 AND job_id = $2`,
      [seekerId, job_id]
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
// @desc    Get all applications for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get job seeker profile
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.json({ applications: [], message: 'No profile found' });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Get all applications with job details
    const applications = await pool.query(
      `SELECT a.*, 
              j.title, 
              j.company, 
              j.location, 
              j.salary_range,
              j.employment_type,
              j.description as job_description,
              j.requirements,
              j.posted_date,
              j.posted_by,
              u.full_name as posted_by_name,
              jm.match_score
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN users u ON j.posted_by = u.id
       LEFT JOIN job_matches jm ON jm.job_id = a.job_id AND jm.job_seeker_id = a.job_seeker_id
       WHERE a.job_seeker_id = $1
       ORDER BY a.applied_date DESC`,
      [seekerId]
    );
    
    // Get statistics
    const stats = await pool.query(
      `SELECT 
         COUNT(*) as total_applications,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
         COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
         COUNT(CASE WHEN status = 'interview' THEN 1 END) as interview,
         COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
         COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted
       FROM applications 
       WHERE job_seeker_id = $1`,
      [seekerId]
    );
    
    res.json({
      applications: applications.rows,
      stats: stats.rows[0],
      total: applications.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/applications/:id
// @desc    Get specific application by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Get job seeker profile
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Get application
    const application = await pool.query(
      `SELECT a.*, 
              j.title, 
              j.company, 
              j.location, 
              j.salary_range,
              j.employment_type,
              j.description as job_description,
              j.requirements,
              j.posted_date,
              u.full_name as posted_by_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN users u ON j.posted_by = u.id
       WHERE a.id = $1 AND a.job_seeker_id = $2`,
      [req.params.id, seekerId]
    );
    
    if (application.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application.rows[0]);
    
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/applications/:id/withdraw
// @desc    Withdraw an application
// @access  Private
router.put('/:id/withdraw', auth, async (req, res) => {
  try {
    // Get job seeker profile
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Check if application exists and is withdrawable
    const appCheck = await pool.query(
      'SELECT id, status FROM applications WHERE id = $1 AND job_seeker_id = $2',
      [req.params.id, seekerId]
    );
    
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const currentStatus = appCheck.rows[0].status;
    
    // Only allow withdrawal if not already accepted/rejected
    if (currentStatus === 'accepted') {
      return res.status(400).json({ message: 'Cannot withdraw an accepted application' });
    }
    
    if (currentStatus === 'rejected') {
      return res.status(400).json({ message: 'Cannot withdraw a rejected application' });
    }
    
    // Update application status to withdrawn
    const result = await pool.query(
      `UPDATE applications 
       SET status = 'withdrawn', 
           notes = COALESCE(notes, '') || '\nWithdrawn on: ' || CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      application: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/applications/employer/jobs
// @desc    Get applications for jobs posted by the employer
// @access  Private (Employer only)
router.get('/employer/jobs', auth, async (req, res) => {
  try {
    // Check if user is an employer (you can add user_type check)
    const userResult = await pool.query(
      'SELECT user_type FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'employer') {
      return res.status(403).json({ message: 'Access denied. Employer only.' });
    }
    
    // Get all jobs posted by this employer
    const jobsResult = await pool.query(
      `SELECT j.*, 
         COUNT(a.id) as total_applications,
         COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_applications,
         COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed_applications,
         COUNT(CASE WHEN a.status = 'interview' THEN 1 END) as interview_applications,
         COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted_applications,
         COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_applications
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.posted_by = $1 AND j.is_active = true
       GROUP BY j.id
       ORDER BY j.posted_date DESC`,
      [req.user.id]
    );
    
    res.json({
      jobs: jobsResult.rows,
      total_jobs: jobsResult.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/applications/employer/job/:jobId
// @desc    Get all applications for a specific job (employer)
// @access  Private (Employer only)
router.get('/employer/job/:jobId', auth, async (req, res) => {
  try {
    // Check if user owns this job
    const jobCheck = await pool.query(
      'SELECT posted_by FROM jobs WHERE id = $1',
      [req.params.jobId]
    );
    
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (jobCheck.rows[0].posted_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this job.' });
    }
    
    // Get all applications for this job
    const applications = await pool.query(
      `SELECT a.*, 
              js.skills,
              js.experience_years,
              js.education,
              js.resume_text,
              js.current_title,
              u.full_name as applicant_name,
              u.email as applicant_email,
              jm.match_score
       FROM applications a
       JOIN job_seekers js ON a.job_seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       LEFT JOIN job_matches jm ON jm.job_id = a.job_id AND jm.job_seeker_id = a.job_seeker_id
       WHERE a.job_id = $1
       ORDER BY 
         CASE a.status
           WHEN 'pending' THEN 1
           WHEN 'reviewed' THEN 2
           WHEN 'interview' THEN 3
           WHEN 'accepted' THEN 4
           WHEN 'rejected' THEN 5
           ELSE 6
         END,
         a.applied_date DESC`,
      [req.params.jobId]
    );
    
    res.json({
      applications: applications.rows,
      total: applications.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status (employer)
// @access  Private (Employer only)
router.put('/:id/status', auth, async (req, res) => {
  const { status, feedback } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected', 'withdrawn'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') 
    });
  }
  
  try {
    // Get application details with job info
    const appResult = await pool.query(
      `SELECT a.*, j.posted_by 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    
    if (appResult.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const application = appResult.rows[0];
    
    // Check if user is the job owner
    if (application.posted_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this job.' });
    }
    
    // Update application status
    const updateFields = ['status = $1'];
    const queryParams = [status];
    let paramIndex = 2;
    
    if (feedback) {
      updateFields.push(`notes = COALESCE(notes, '') || '\nEmployer feedback: ' || $${paramIndex}`);
      queryParams.push(feedback);
      paramIndex++;
    }
    
    if (status === 'interview') {
      updateFields.push(`interview_date = CURRENT_TIMESTAMP`);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const result = await pool.query(
      `UPDATE applications 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      [...queryParams, req.params.id]
    );
    
    // Send notification (you can implement email notifications here)
    console.log(`Application ${req.params.id} status updated to ${status}`);
    
    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      application: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/applications/stats/dashboard
// @desc    Get application statistics for dashboard
// @access  Private
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    // Get job seeker profile
    const seekerResult = await pool.query(
      'SELECT id FROM job_seekers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (seekerResult.rows.length === 0) {
      return res.json({
        total_applications: 0,
        status_breakdown: {},
        weekly_applications: [],
        response_rate: 0
      });
    }
    
    const seekerId = seekerResult.rows[0].id;
    
    // Get status breakdown
    const statusBreakdown = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM applications 
       WHERE job_seeker_id = $1 
       GROUP BY status`,
      [seekerId]
    );
    
    // Get weekly applications (last 7 days)
    const weeklyApplications = await pool.query(
      `SELECT DATE(applied_date) as date, COUNT(*) as count
       FROM applications
       WHERE job_seeker_id = $1 
         AND applied_date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(applied_date)
       ORDER BY date DESC`,
      [seekerId]
    );
    
    // Calculate response rate (applications that got response)
    const responseRate = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status IN ('reviewed', 'interview', 'accepted', 'rejected') THEN 1 END) as responded
       FROM applications
       WHERE job_seeker_id = $1`,
      [seekerId]
    );
    
    const rate = responseRate.rows[0].total > 0 
      ? (responseRate.rows[0].responded / responseRate.rows[0].total * 100).toFixed(2)
      : 0;
    
    // Get recent activity
    const recentActivity = await pool.query(
      `SELECT a.status, a.applied_date, j.title, j.company
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.job_seeker_id = $1
       ORDER BY a.updated_at DESC
       LIMIT 10`,
      [seekerId]
    );
    
    res.json({
      total_applications: responseRate.rows[0].total,
      status_breakdown: statusBreakdown.rows,
      weekly_applications: weeklyApplications.rows,
      response_rate: rate,
      recent_activity: recentActivity.rows
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;