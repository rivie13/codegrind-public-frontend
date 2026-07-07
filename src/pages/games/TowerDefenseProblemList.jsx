import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import RetroPageShell, { RetroPanel } from '../../components/retro/RetroPageShell';
import adSlots from '../../config/adSlots';
import { api } from '../../services/api';
import logger from '../../utils/core/logger';
import DifficultyFilter from './tower-defense-problem-list/components/DifficultyFilter';
import ErrorState from './tower-defense-problem-list/components/ErrorState';
import LoadingState from './tower-defense-problem-list/components/LoadingState';
import PaginationBar from './tower-defense-problem-list/components/PaginationBar';
import ProblemList from './tower-defense-problem-list/components/ProblemList';

const TAB_STYLES = {
  bg: 'var(--cg-window)',
  border: '1px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-outset)',
  color: 'var(--cg-muted)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontSize: 'xs',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  px: 4,
  py: 3,
  _hover: {
    bg: 'var(--cg-window-face)',
    color: 'var(--cg-text)',
  },
  _selected: {
    bg: 'var(--cg-window-face)',
    color: 'var(--cg-text)',
    boxShadow: 'var(--cg-window-inset)',
  },
};

function TowerDefenseProblemList() {
  const [activeTab, setActiveTab] = useState('interview');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchProblems(activeTab, difficulty);
  }, [activeTab, difficulty, currentPage, pageSize]);

  const fetchProblems = async (source, difficultyFilter) => {
    try {
      setLoading(true);
      setError(null);
      let response;

      switch (source) {
        case 'interview':
          response = await api.problems.getAll(
            difficultyFilter,
            currentPage,
            pageSize,
            'CODEGRIND'
          );
          break;
        case 'ai':
          response = await api.aiProblems.getAll(difficultyFilter, currentPage, pageSize);
          break;
        default:
          response = await api.problems.getAll(
            difficultyFilter,
            currentPage,
            pageSize,
            'CODEGRIND'
          );
      }

      logger.info('Raw API response structure:');
      // Extract problems data from response
      let problemsData = [];

      if (response && response.questions && Array.isArray(response.questions)) {
        problemsData = response.questions;
        setTotalPages(response.totalPages || 1);
      } else if (Array.isArray(response)) {
        problemsData = response;
        setTotalPages(Math.ceil(response.length / pageSize));
      } else if (response && response.data && Array.isArray(response.data)) {
        problemsData = response.data;
        setTotalPages(response.totalPages || Math.ceil(response.data.length / pageSize));
      } else {
        logger.error('Unexpected API response format:', response);
        problemsData = [];
        setTotalPages(1);
      }

      setProblems(problemsData);
      setError(null);
      setLoading(false);
    } catch (err) {
      logger.error('Error fetching problems:');
      logger.debug(err.stack);
      setError('Failed to load problems. Please try again.');
      setLoading(false);
    }
  };

  const handleTabChange = (index) => {
    const tabs = ['interview', 'ai'];
    setActiveTab(tabs[index]);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <PageTemplate>
      <RetroPageShell
        mainMaxW="container.xl"
        heroFileLabel="codebreach-targets.exe"
        heroTitle="Target Selection"
        heroSubtitle="Choose a tower-defense mission from the interview systems or AI-generated protocols, then launch the breach workspace against that exact problem."
        heroMeta={activeTab === 'ai' ? 'AI protocols' : 'Interview systems'}
        topSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 4, md: 6 }}
            mb={{ base: 4, md: 6 }}
            px={{ base: 4, md: 0 }}
          >
            <TopBannerAd slotId={adSlots.gamesLanding.top} />
          </Box>
        }
        leftSidebar={<SidebarAd slotId={adSlots.gamesLanding.sidebar} />}
        rightSidebar={<SidebarAd slotId={adSlots.gamesLanding.sidebar} />}
        bottomSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 1, md: 2 }}
            mb={{ base: 8, md: 10 }}
            px={{ base: 4, md: 0 }}
          >
            <BottomBannerAd slotId={adSlots.gamesLanding.bottom} />
          </Box>
        }
      >
        <RetroPanel
          fileLabel="target-catalog.ini"
          title="Breach Catalog"
          subtitle="Filter by security level, swap between source catalogs, and open a mission only when you are ready to commit to the run."
        >
          <Tabs variant="unstyled" index={activeTab === 'ai' ? 1 : 0} onChange={handleTabChange}>
            <TabList mb={6} display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={2}>
              <Tab {...TAB_STYLES} width={{ base: '100%', md: 'auto' }}>
                Interview Systems
              </Tab>
              <Tab {...TAB_STYLES} width={{ base: '100%', md: 'auto' }}>
                AI Generated Protocols
              </Tab>
            </TabList>

            <TabPanels>
              {['interview', 'ai'].map((source) => (
                <TabPanel key={source} p={0}>
                  <DifficultyFilter onChange={handleDifficultyChange} value={difficulty} />

                  {loading ? (
                    <LoadingState />
                  ) : error ? (
                    <ErrorState
                      error={error}
                      onRetry={() => fetchProblems(activeTab, difficulty)}
                    />
                  ) : (
                    <>
                      <ProblemList
                        problems={problems}
                        currentPage={currentPage}
                        pageSize={pageSize}
                      />
                      {problems.length > 0 && (
                        <PaginationBar
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                          onPageSizeChange={handlePageSizeChange}
                          pageSize={pageSize}
                        />
                      )}
                    </>
                  )}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </RetroPanel>
      </RetroPageShell>
    </PageTemplate>
  );
}

export default TowerDefenseProblemList;
