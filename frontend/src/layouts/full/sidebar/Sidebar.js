import { useMediaQuery, Box, Drawer } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ExamShieldLogo from '../../../components/shared/ExamShieldLogo';
import SidebarItems from './SidebarItems';
// import { Upgrade } from './Updrade';

const Sidebar = (props) => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogoClick = () => {
    // Navigate based on user role
    if (userInfo?.role === 'teacher') {
      navigate('/teacher/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const sidebarWidth = '270px';

  if (lgUp) {
    return (
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
        }}
      >
        {/* ------------------------------------------- */}
        {/* Sidebar for desktop */}
        {/* ------------------------------------------- */}
        <Drawer
          anchor="left"
          open={props.isSidebarOpen}
          variant="permanent"
          PaperProps={{
            sx: {
              width: sidebarWidth,
              boxSizing: 'border-box',
              top: '70px', // Position below fixed header
              height: 'calc(100% - 70px)', // Adjust height to account for header
              backgroundColor: (theme) => theme.palette.background.paper,
              color: (theme) => theme.palette.text.primary,
            },
          }}
        >
          {/* ------------------------------------------- */}
          {/* Sidebar Box */}
          {/* ------------------------------------------- */}
          <Box
            sx={{
              height: '100%',
              pt: 2, // Add padding top for better spacing
            }}
          >
            <Box>
              {/* ------------------------------------------- */}
              {/* Sidebar Items */}
              {/* ------------------------------------------- */}
              <SidebarItems />
              {/* <Upgrade /> */}
            </Box>
          </Box>
        </Drawer>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={props.isMobileSidebarOpen}
      onClose={props.onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          boxShadow: (theme) => theme.shadows[8],
          backgroundColor: (theme) => theme.palette.background.paper,
          color: (theme) => theme.palette.text.primary,
        },
      }}
    >
      {/* ------------------------------------------- */}
      {/* Logo */}
      {/* ------------------------------------------- */}
      <Box 
        px={2} 
        py={3} 
        sx={{ 
          borderBottom: '1px solid #e0e0e0',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#f5f5f5'
          }
        }}
        onClick={handleLogoClick}
      >
        <ExamShieldLogo 
          variant="compact" 
          width={150} 
          height={55}
          sx={{
            filter: 'brightness(1) contrast(1.1)',
          }}
        />
      </Box>
      {/* ------------------------------------------- */}
      {/* Sidebar For Mobile */}
      {/* ------------------------------------------- */}
      <SidebarItems />
      {/* <Upgrade /> */}
    </Drawer>
  );
};

export default Sidebar;
