import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import { profile } from '../services/api';

const ResumeUpload = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);
    setUploadedFile(file);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 20) {
      setTimeout(() => setUploadProgress(i), i * 10);
    }

    // Here you would send to backend for parsing
    // For now, simulate parsing
    setTimeout(() => {
      const extractedData = {
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        experience_years: 3.5,
        education: 'BS Computer Science',
        resume_text: 'Experienced full-stack developer...'
      };
      
      setUploading(false);
      if (onUploadComplete) {
        onUploadComplete(extractedData);
      }
    }, 2000);
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  return (
    <Box sx={{ mt: 2 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        
        {isDragActive ? (
          <Typography>Drop your resume here...</Typography>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Upload Your Resume
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Drag & drop or click to select (PDF, DOC, DOCX, TXT)
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Max size: 5MB
            </Typography>
          </>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading and parsing resume...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {uploadedFile && !uploading && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Box display="flex" alignItems="center">
            <DescriptionIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              {uploadedFile.name} uploaded successfully!
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default ResumeUpload;