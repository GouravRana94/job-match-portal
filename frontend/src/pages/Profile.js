import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { profile } from '../services/api';
import ResumeUpload from '../components/ResumeUpload';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profile.get();
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ text: 'Failed to load profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD THIS FUNCTION
  const handleResumeUpload = (extractedData) => {
    setProfileData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        skills: extractedData.skills || [],
        experience_years: extractedData.experience_years || 0,
        education: extractedData.education || '',
        resume_text: extractedData.resume_text || ''
      }
    }));

    setMessage({ text: 'Resume parsed successfully! Review and save.', type: 'success' });
  };

  const handleChange = (field, value) => {
    setProfileData({
      ...profileData,
      profile: {
        ...profileData.profile,
        [field]: value
      }
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && profileData.profile) {
      const currentSkills = profileData.profile.skills || [];
      if (!currentSkills.includes(newSkill.trim())) {
        handleChange('skills', [...currentSkills, newSkill.trim()]);
        setNewSkill('');
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = profileData.profile.skills || [];
    handleChange('skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        skills: profileData.profile?.skills || [],
        experience_years: parseFloat(profileData.profile?.experience_years) || 0,
        education: profileData.profile?.education || '',
        resume_text: profileData.profile?.resume_text || '',
        preferred_location: profileData.profile?.preferred_location || '',
        current_title: profileData.profile?.current_title || '',
        linkedin_url: profileData.profile?.linkedin_url || ''
      };

      await profile.update(updateData);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Profile
        </Typography>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            {/* Personal Info */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={profileData?.full_name || ''}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={profileData?.email || ''}
                disabled
              />
            </Grid>

            {/* Professional Info */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Professional Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Title"
                value={profileData?.profile?.current_title || ''}
                onChange={(e) => handleChange('current_title', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={profileData?.profile?.experience_years || ''}
                onChange={(e) => handleChange('experience_years', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Education"
                value={profileData?.profile?.education || ''}
                onChange={(e) => handleChange('education', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preferred Location"
                value={profileData?.profile?.preferred_location || ''}
                onChange={(e) => handleChange('preferred_location', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="LinkedIn URL"
                value={profileData?.profile?.linkedin_url || ''}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
              />
            </Grid>

            {/* Skills */}
            <Grid item xs={12}>
              <Typography variant="subtitle1">Skills</Typography>
              <Box sx={{ mb: 2 }}>
                {profileData?.profile?.skills?.map((skill, idx) => (
                  <Chip
                    key={idx}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  label="Add Skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
                <IconButton onClick={handleAddSkill}>
                  <AddIcon />
                </IconButton>
              </Box>
            </Grid>

            {/* Resume Upload Section ✅ */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Upload Resume (Optional)
              </Typography>
              <ResumeUpload onUploadComplete={handleResumeUpload} />
            </Grid>

            {/* Resume Text */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Resume/Summary"
                value={profileData?.profile?.resume_text || ''}
                onChange={(e) => handleChange('resume_text', e.target.value)}
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Profile'}
              </Button>
            </Grid>

          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile;