import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { jobs } from '../services/api';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    title: '',
    location: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobs.getAll(filters);
      setJobList(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchJobs();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Available Jobs
      </Typography>

      {/* Search Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Job Title"
          variant="outlined"
          size="small"
          value={filters.title}
          onChange={(e) => setFilters({ ...filters, title: e.target.value })}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Location"
          variant="outlined"
          size="small"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          sx={{ flex: 1 }}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {/* Job List */}
      <Grid container spacing={3}>
        {jobList.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center">No jobs found</Typography>
          </Grid>
        ) : (
          jobList.map((job) => (
            <Grid item xs={12} md={6} key={job.id}>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  <CardContent>

                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          {job.title}
                        </Typography>
                        <Typography color="primary" gutterBottom fontWeight="500">
                          {job.company}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: 'white', fontWeight: 'bold' }}
                        >
                          {job.employment_type || 'Full-time'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Location */}
                    <Typography color="textSecondary" gutterBottom>
                      📍 {job.location}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                      {job.description?.substring(0, 120)}...
                    </Typography>

                    {/* Skills */}
                    <Box sx={{ mb: 2 }}>
                      {job.requirements?.slice(0, 3).map((skill, idx) => (
                        <Chip
                          key={idx}
                          label={skill}
                          size="small"
                          sx={{
                            mr: 1,
                            mb: 1,
                            background:
                              'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Box>

                    {/* Salary */}
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="primary.main"
                      gutterBottom
                    >
                      💰 {job.salary_range}
                    </Typography>

                    {/* Button */}
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      sx={{ mt: 2 }}
                    >
                      View Details
                    </Button>

                  </CardContent>
                </Card>
              </motion.div>

            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default Jobs;