import React from 'react';
import Menuitems from './MenuItems';
import { useLocation } from 'react-router';
import { Box, List } from '@mui/material';
import NavItem from './NavItem';
import NavGroup from './NavGroup/NavGroup';
import { useSelector } from 'react-redux';
import { useGetLastStudentSubmissionQuery } from 'src/slices/examApiSlice';
import { styled } from '@mui/material/styles';

const StyledList = styled(List)(({ theme }) => ({
  pt: 0,
  '.MuiListItem-root': {
    borderRadius: 12,
    marginBottom: 4,
    transition: 'all 0.2s ease',
    '&:hover': {
      background: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
      boxShadow: theme.shadows[1],
    },
    '&.Mui-selected, &.Mui-selected:hover': {
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: theme.shadows[2],
    },
  },
  '.MuiListSubheader-root': {
    fontWeight: 800,
    color: theme.palette.secondary.main,
    fontSize: 12,
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 1.2,
    background: 'transparent',
    textTransform: 'uppercase',
  },
}));

const SidebarItems = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const pathDirect = pathname;

  const userRole = userInfo?.role || '';
  const menuItems = Menuitems(userRole); // ✅ get role-specific menu

  const isStudent = userRole === 'student';

  // Add error handling for the query
  const { data: lastSubmissionData, error: submissionError } = useGetLastStudentSubmissionQuery(undefined, {
    skip: !isStudent,
  });

  // If there's an error, just continue without the submission data
  const studentResultExamId = lastSubmissionData?.examId ?? null;

  const adjustedMenuItems = menuItems.map((item) => {
    const clonedItem = { ...item };
    if (clonedItem.title === 'Result' && isStudent) {
      // Always send students to the results dashboard list with filters
      clonedItem.href = '/result';
    }
    return clonedItem;
  });

  return (
    <Box sx={{ px: 2 }}>
      <StyledList className="sidebarNav">
        {adjustedMenuItems.map((item) => {
          if (item.subheader) {
            return <NavGroup item={item} key={item.subheader} />;
          } else {
            return <NavItem item={item} key={item.id} pathDirect={pathDirect} />;
          }
        })}
      </StyledList>
    </Box>
  );
};

export default SidebarItems;
