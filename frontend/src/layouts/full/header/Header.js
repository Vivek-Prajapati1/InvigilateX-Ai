import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Badge,
  Button,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';

// components
import Profile from './Profile';
import ExamShieldLogo from '../../../components/shared/ExamShieldLogo';
import { IconBellRinging, IconMenu } from '@tabler/icons-react';
import { useSelector } from 'react-redux';

const Header = (props) => {
  // const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  // const lgDown = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // Navigate based on user role
    if (userInfo?.role === 'teacher') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: '2px',
    background: theme.palette.background.paper,
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    [theme.breakpoints.up('lg')]: {
      minHeight: '70px',
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.text.secondary,
  }));

  return (
    <AppBarStyled
      position="fixed"
      color="default"
      sx={{
        background: '#41bcba',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <ToolbarStyled>
        {/* Brand Logo */}
        <Box 
          sx={{ 
            display: { xs: 'none', md: 'block' }, 
            mr: 1,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={handleLogoClick}
        >
          <ExamShieldLogo 
            variant="compact" 
            width={160} 
            height={65}
            sx={{ 
              filter: 'brightness(1.5) saturate(1.2) contrast(1.2)',
              '& svg': {
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
              }
            }}
          />
        </Box>
        
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={props.toggleMobileSidebar}
          sx={{
            display: {
              lg: 'none',
              xs: 'inline',
            },
            color: "#fff",
          }}
        >
          <IconMenu width="20" height="20" />
        </IconButton>

        <IconButton
          size="large"
          aria-label="show 11 new notifications"
          color="inherit"
          aria-controls="msgs-menu"
          aria-haspopup="true"
          sx={{
            color: "#fff",
            ...(typeof anchorEl2 === 'object' && {
              color: 'primary.main',
            }),
          }}
        >
          <Badge variant="dot" color="primary">
            <IconBellRinging size="21" stroke="1.5" />
          </Badge>
        </IconButton>
        <Box flexGrow={1} />
        <Stack spacing={1} direction="row" alignItems="center">
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              fontWeight: 600,
              letterSpacing: 1,
              textShadow: "1px 1px 8px #159fc1",
              px: 2,
              py: 0.5,
              borderRadius: 2,
              background: "rgba(25, 32, 154, 0.1)",
            }}
          >
            Hello, {_.startCase(userInfo.name)}
          </Typography>
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
