import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Chip, LinearProgress } from '@mui/material';
import { matches } from '../services/api';

const SkillGap = () => {
  const [skillGap, setSkillGap] = useState(null);

  useEffect(() => {
    fetchSkillGap();
  }, []);

  const fetchSkillGap = async () => {
    const response = await matches.getSkillGap();
    setSkillGap(response.data.analysis);
  };

  if (!skillGap) return <div>Loading...</div>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          📊 Skill Gap Analysis
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Your Skills Coverage</Typography>
          <LinearProgress 
            variant="determinate" 
            value={(skillGap.your_skills_count / skillGap.total_skills_in_market) * 100}
            sx={{ height: 10, borderRadius: 5, mt: 1 }}
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            You have {skillGap.your_skills_count} out of {skillGap.total_skills_in_market} in-demand skills
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          🎯 Skills to Learn for Better Matches
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {skillGap.missing_skills?.map((skill, idx) => (
            <Chip
              key={idx}
              label={`${skill.skill} (${skill.frequency} jobs)`}
              color="warning"
              variant="outlined"
            />
          ))}
        </Box>

        <Typography variant="h6" gutterBottom>
          ✅ Your Strengths
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {skillGap.your_skills?.map((skill, idx) => (
            <Chip key={idx} label={skill.skill} color="success" />
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default SkillGap;