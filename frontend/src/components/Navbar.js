import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import WorkIcon from '@mui/icons-material/Work';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0 }, justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box display="flex" alignItems="center" component={Link} to="/" sx={{ textDecoration: 'none' }}>
            <WorkIcon sx={{ color: '#667eea', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              JobMatch Pro
            </Typography>
          </Box>
          
          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                <Button color="inherit" component={Link} to="/jobs" sx={{ color: '#4a5568' }}>
                  Jobs
                </Button>
                <Button color="inherit" component={Link} to="/applications" sx={{ color: '#4a5568' }}>
                  Applications
                </Button>
                <IconButton onClick={handleMenu} size="small">
                  <Avatar sx={{ bgcolor: '#667eea', width: 35, height: 35 }}>
                    {user?.fullName?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      minWidth: 180,
                    }
                  }}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleClose}>
                    My Profile
                  </MenuItem>
                  <MenuItem component={Link} to="/dashboard" onClick={handleClose}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="text" 
                  component={Link} 
                  to="/login"
                  sx={{ color: '#4a5568' }}
                >
                  Login
                </Button>
                <Button 
                  variant="contained" 
                  component={Link} 
                  to="/register"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                    }
                  }}
                >
                  Get Started
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;