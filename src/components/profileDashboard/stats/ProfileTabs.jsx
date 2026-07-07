import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import React from 'react';
import AchievementsPanel from './AchievementsPanel';
import ActivityTimeline from './ActivityTimeline';
import CreatedAIProblemsPanel from './CreatedAIProblemsPanel';
import ProfileOverview from './ProfileOverview';

const tabProps = {
  mr: 0,
  px: 3,
  py: 2,
  fontSize: { base: 'xs', md: 'sm' },
  fontWeight: '700',
  flexShrink: 0,
  color: 'var(--cg-text)',
  bg: 'var(--cg-panel-shell)',
  border: '2px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-outset)',
  borderRadius: '0',
  fontFamily: 'var(--cg-font-retro-display)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  _selected: {
    color: 'var(--cg-header-text)',
    bg: 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))',
    boxShadow: 'var(--cg-window-inset)',
  },
  _hover: {
    bg: 'rgba(255,255,255,0.18)',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
  },
};

const ProfileTabs = ({
  userData,
  achievements,
  selectedCategory,
  setSelectedCategory,
  handleViewSubmissions,
  createdAiProblems,
  createdAiProblemsTotal,
}) => {
  return (
    <Tabs variant="unstyled" w="100%">
      <TabList
        mb={4}
        flexWrap="nowrap"
        gap={2}
        overflowX={{ base: 'auto', md: 'visible' }}
        pb={{ base: 1, md: 0 }}
        p={1}
        sx={{
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'var(--cg-panel-shell)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#9f9a90',
          },
        }}
      >
        <Tab {...tabProps}>OVERVIEW</Tab>
        <Tab {...tabProps}>ACTIVITY</Tab>
        <Tab {...tabProps}>ACHIEVEMENTS</Tab>
        <Tab {...tabProps}>AI.CREATED</Tab>
      </TabList>

      <TabPanels>
        {/* Overview Panel */}
        <TabPanel px={{ base: 0, md: 4 }} py={{ base: 3, md: 4 }}>
          <ProfileOverview
            userData={userData}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            handleViewSubmissions={handleViewSubmissions}
          />
          <Box height={{ base: '72px', md: '100px' }}></Box>
        </TabPanel>

        {/* Activity Timeline Panel */}
        <TabPanel px={{ base: 0, md: 4 }} py={{ base: 3, md: 4 }}>
          <ActivityTimeline userData={userData} />
          <Box height={{ base: '72px', md: '100px' }}></Box>
        </TabPanel>

        {/* Achievements Panel */}
        <TabPanel px={{ base: 0, md: 4 }} py={{ base: 3, md: 4 }}>
          <AchievementsPanel achievements={achievements} />
          <Box height={{ base: '72px', md: '100px' }}></Box>
        </TabPanel>

        {/* Created AI Problems Panel */}
        <TabPanel px={{ base: 0, md: 4 }} py={{ base: 3, md: 4 }}>
          <CreatedAIProblemsPanel
            createdAiProblems={createdAiProblems || userData?.createdAiProblems}
            createdAiProblemsTotal={createdAiProblemsTotal ?? userData?.createdAiProblemsTotal}
          />
          <Box height={{ base: '72px', md: '100px' }}></Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default ProfileTabs;
