import { Box, Grid, GridItem, Text } from '@chakra-ui/react';
import React from 'react';
import ProblemStats from './ProblemStats';
import RecentActivity from './RecentActivity';

const ProfileOverview = ({
  userData,
  selectedCategory,
  setSelectedCategory,
  handleViewSubmissions,
}) => {
  if (!userData) return null;

  return (
    <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={{ base: 4, md: 6 }}>
      <GridItem>
        <Box className="cg-panel-window" overflow="hidden" h="100%">
          <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
              problem_stats.sys
            </Text>
          </Box>
          <Box
            pt={4}
            pb={{ base: 4, md: 6 }}
            px={{ base: 4, md: 6 }}
            bg="rgba(255,255,255,0.14)"
            h="100%"
          >
            <ProblemStats
              userData={userData}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </Box>
        </Box>
      </GridItem>

      <GridItem>
        <Box className="cg-panel-window" overflow="hidden" h="100%">
          <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
              recent_activity.log
            </Text>
          </Box>
          <Box
            pt={4}
            pb={{ base: 4, md: 6 }}
            px={{ base: 4, md: 6 }}
            bg="rgba(255,255,255,0.14)"
            h="100%"
          >
            <RecentActivity userData={userData} handleViewSubmissions={handleViewSubmissions} />
          </Box>
        </Box>
      </GridItem>
    </Grid>
  );
};

export default ProfileOverview;
