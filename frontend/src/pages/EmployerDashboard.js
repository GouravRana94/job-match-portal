import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box
} from '@mui/material';
import { jobs, applications } from '../services/api';

const EmployerDashboard = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    description: '',
    requirements: [],
    location: '',
    salary_range: '',
    employment_type: 'Full-time'
  });

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    const response = await jobs.getAll({ posted_by: 'me' });
    setMyJobs(response.data.jobs);
  };

  const fetchApplicants = async (jobId) => {
    const response = await applications.getByJob(jobId);
    setApplicants(response.data);
    setSelectedJob(jobId);
  };

  const updateApplicationStatus = async (applicationId, status) => {
    await applications.updateStatus(applicationId, status);
    fetchApplicants(selectedJob);
  };

  const postNewJob = async () => {
    await jobs.create(newJob);
    setOpenDialog(false);
    fetchMyJobs();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employer Dashboard</Typography>
        <Button variant="contained" onClick={() => setOpenDialog(true)}>
          Post New Job
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">My Jobs</Typography>
            {myJobs.map(job => (
              <Box
                key={job.id}
                onClick={() => fetchApplicants(job.id)}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: selectedJob === job.id ? 'primary.light' : 'grey.50',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Typography fontWeight="bold">{job.title}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {job.applications_count || 0} applicants
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Applicants
            </Typography>
            {applicants.length === 0 ? (
              <Typography color="textSecondary">No applicants yet</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Skills</TableCell>
                      <TableCell>Experience</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applicants.map(applicant => (
                      <TableRow key={applicant.id}>
                        <TableCell>{applicant.name}</TableCell>
                        <TableCell>
                          {applicant.skills?.slice(0, 2).join(', ')}
                        </TableCell>
                        <TableCell>{applicant.experience} years</TableCell>
                        <TableCell>
                          <Chip
                            label={applicant.status}
                            color={applicant.status === 'pending' ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => updateApplicationStatus(applicant.id, 'reviewed')}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Post New Job</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Job Title"
            margin="normal"
            onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
          />
          <TextField
            fullWidth
            label="Company"
            margin="normal"
            onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
          />
          <TextField
            fullWidth
            label="Location"
            margin="normal"
            onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
          />
          <TextField
            fullWidth
            label="Salary Range"
            margin="normal"
            onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            margin="normal"
            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={postNewJob}
            sx={{ mt: 2 }}
          >
            Post Job
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default EmployerDashboard;