import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Button,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { profile, applications, matches } from '../services/api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [topMatches, setTopMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // ✅ FIXED: useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [profileStats, appStats, matchData] = await Promise.all([
        profile.getStats(),
        applications.getStats(),
        matches.getTop()
      ]);

      setStats({
        ...profileStats.data,
        ...appStats.data
      });

      setTopMatches(matchData.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIXED: proper dependency
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ✅ AI MATCH
  const generateMLMatches = async () => {
    setGenerating(true);
    try {
      await axios.post(
        'http://localhost:5000/api/matches/generate',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSnackbar({
        open: true,
        message: 'Matches generated successfully!',
        severity: 'success'
      });

      fetchDashboardData();

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to generate matches',
        severity: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  // ✅ FEEDBACK
  const sendFeedback = async (jobId, isRelevant) => {
    try {
      await axios.post(
        'http://localhost:5000/api/matches/feedback',
        {
          job_id: jobId,
          relevant: isRelevant
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSnackbar({
        open: true,
        message: 'Feedback submitted!',
        severity: 'success'
      });

    } catch (error) {
      console.error('Feedback error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send feedback',
        severity: 'error'
      });
    }
  };

  const statCards = [
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: <WorkIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Response Rate',
      value: `${stats?.response_rate || 0}%`,
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Top Match Score',
      value: `${topMatches[0]?.match_score || 0}%`,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Welcome back, {user?.fullName}! 👋
          </Typography>
          <Typography color="textSecondary">
            Here's what's happening with your job search
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={generateMLMatches}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'AI Match'}
        </Button>
      </Box>

      {/* STATS */}
      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ background: stat.color, color: 'white' }}>
              <CardContent>
                <Typography>{stat.title}</Typography>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* MATCHES */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">🎯 Top Job Matches</Typography>

            {topMatches.length === 0 ? (
              <Typography color="textSecondary">
                No matches yet. Click "AI Match"
              </Typography>
            ) : (
              topMatches.map((match) => (
                <Box key={match.job_id} sx={{ mb: 3 }}>

                  <Box display="flex" justifyContent="space-between">
                    <Typography fontWeight="bold">
                      {match.title}
                    </Typography>
                    <Typography color="primary">
                      {match.match_score}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={match.match_score}
                    sx={{ my: 1 }}
                  />

                  <Box display="flex" gap={1}>
                    <IconButton onClick={() => sendFeedback(match.job_id, true)}>
                      <ThumbUpIcon fontSize="small" />
                    </IconButton>

                    <IconButton onClick={() => sendFeedback(match.job_id, false)}>
                      <ThumbDownIcon fontSize="small" />
                    </IconButton>
                  </Box>

                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default Dashboard;