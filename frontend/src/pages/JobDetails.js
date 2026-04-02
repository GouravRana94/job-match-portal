import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { jobs, applications } from '../services/api';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // ✅ FIXED useEffect (best practice)
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await jobs.getById(id);
        setJob(response.data.job);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load job details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);

    try {
      await applications.create({
        job_id: parseInt(id),
        notes: `I'm very interested in the ${job.title} position at ${job.company}`
      });

      setSnackbar({
        open: true,
        message: 'Application submitted successfully!',
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/applications');
      }, 2000);

    } catch (error) {
      console.error('Error applying for job:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to submit application',
        severity: 'error'
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Job not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {job.title}
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom>
          {job.company}
        </Typography>

        <Typography variant="body1" color="textSecondary" gutterBottom>
          {job.location} | {job.employment_type || 'Full-time'} | {job.salary_range}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Job Description
        </Typography>
        <Typography variant="body1" paragraph>
          {job.description}
        </Typography>

        <Typography variant="h6" gutterBottom>
          Requirements
        </Typography>

        <Box sx={{ mb: 2 }}>
          {job.requirements?.map((req, idx) => (
            <Chip
              key={idx}
              label={req}
              sx={{ mr: 1, mb: 1 }}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleApply}
            disabled={applying}
          >
            {applying ? <CircularProgress size={24} /> : 'Apply Now'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/jobs')}
          >
            Back to Jobs
          </Button>
        </Box>
      </Paper>

      {/* ✅ Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default JobDetails;