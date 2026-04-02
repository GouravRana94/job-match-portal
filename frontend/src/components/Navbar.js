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
  useScrollTrigger,
  Slide
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import WorkIcon from '@mui/icons-material/Work';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';

function HideOnScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({ target: window ? window() : undefined });
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

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
    <HideOnScroll>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontWeight: 700,
              }}
            >
              JobMatch Pro
            </Typography>
          </Box>
          
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/"
                startIcon={<DashboardIcon />}
                sx={{ color: '#1e293b' }}
              >
                Dashboard
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/jobs"
                startIcon={<WorkIcon />}
                sx={{ color: '#1e293b' }}
              >
                Jobs
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/applications"
                startIcon={<AssignmentIcon />}
                sx={{ color: '#1e293b' }}
              >
                Apps
              </Button>
              <IconButton onClick={handleMenu} size="small">
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: 40,
                    height: 40,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
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
                    borderRadius: 3,
                    minWidth: 200,
                  }
                }}
              >
                <MenuItem component={Link} to="/profile" onClick={handleClose}>
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                  My Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography color="error">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                component={Link} 
                to="/login"
                sx={{ borderRadius: 3 }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                component={Link} 
                to="/register"
                sx={{ borderRadius: 3 }}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar;