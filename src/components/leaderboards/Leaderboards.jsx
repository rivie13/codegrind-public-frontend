import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import LeaderboardLoading from './LeaderboardLoading';
import StandardLeaderboardPanel from './StandardLeaderboardPanel';
import TowerDefenseLeaderboardPanel from './TowerDefenseLeaderboardPanel';
import { formatSeconds } from './leaderboardUtils';

//import logger from utils
import logger from '../../utils/core/logger';

function Leaderboards() {
  const [selectedSource, setSelectedSource] = useState('INTERVIEW');
  const [selectedTdSource, setSelectedTdSource] = useState('INTERVIEW');
  const [leaderboardData, setLeaderboardData] = useState({});
  const [towerDefenseLeaderboardData, setTowerDefenseLeaderboardData] = useState({});

  // Split problems by source to avoid ID conflicts
  const [interviewProblems, setInterviewProblems] = useState([]);
  const [aiProblems, setAiProblems] = useState([]);
  // Split TD problems by source
  const [interviewTdProblems, setInterviewTdProblems] = useState([]);
  const [aiTdProblems, setAiTdProblems] = useState([]);

  // Separate selected problem state for each source
  const [selectedInterviewProblem, setSelectedInterviewProblem] = useState('');
  const [selectedAiProblem, setSelectedAiProblem] = useState('');

  // Separate selected TD problem state for each source
  const [selectedInterviewTdProblem, setSelectedInterviewTdProblem] = useState('');
  const [selectedAiTdProblem, setSelectedAiTdProblem] = useState('');

  // New states for selected problem data
  const [selectedProblemData, setSelectedProblemData] = useState(null);
  const [selectedTdProblemData, setSelectedTdProblemData] = useState(null);

  const [tdMode, setTdMode] = useState('standard');

  const [loading, setLoading] = useState(true);
  const [tdLoading, setTdLoading] = useState(true);
  const [problemLoading, setProblemLoading] = useState(false);
  const [tdProblemLoading, setTdProblemLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tdCurrentPage, setTdCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [tdSearchQuery, setTdSearchQuery] = useState('');
  const [error, setError] = useState(false);

  // Modified function to get the selected problem key
  const getSelectedProblem = () => {
    let problemKey = '';
    if (selectedSource === 'INTERVIEW') {
      problemKey = selectedInterviewProblem;
    } else if (selectedSource === 'AI') {
      problemKey = selectedAiProblem;
    }

    //console.log(`getSelectedProblem called: source=${selectedSource}, key=${problemKey}`);
    return problemKey;
  };

  // Modified function to get the selected TD problem key
  const getSelectedTdProblem = () => {
    if (selectedTdSource === 'INTERVIEW') {
      return selectedInterviewTdProblem;
    } else if (selectedTdSource === 'AI') {
      return selectedAiTdProblem;
    }
    return '';
  };

  // Modified function to set selected problem and fetch its data
  const setSelectedProblem = async (problemKey) => {
    // Set the appropriate state based on the source
    if (selectedSource === 'INTERVIEW') {
      setSelectedInterviewProblem(problemKey);
    } else if (selectedSource === 'AI') {
      setSelectedAiProblem(problemKey);
    }

    // Reset pagination
    setCurrentPage(1);

    // Load the problem data if not already in cache
    await loadProblemData(problemKey);
  };

  // Modified function to set selected TD problem and fetch its data
  const setSelectedTdProblem = async (problemKey) => {
    // Set the appropriate state based on the source
    if (selectedTdSource === 'INTERVIEW') {
      setSelectedInterviewTdProblem(problemKey);
    } else if (selectedTdSource === 'AI') {
      setSelectedAiTdProblem(problemKey);
    }

    // Reset pagination
    setTdCurrentPage(1);

    // Load the TD problem data if not already in cache
    await loadTdProblemData(problemKey);
  };

  // New function to load a specific problem's leaderboard data
  const loadProblemData = async (problemKey) => {
    if (!problemKey) {
      console.error('loadProblemData called with empty problemKey');
      return;
    }

    console.log(`loadProblemData called with key=${problemKey}`);

    // Skip if we already have this problem's data
    if (leaderboardData[problemKey]) {
      console.log(`Using cached data for problem ${problemKey}`);
      setSelectedProblemData(leaderboardData[problemKey]);
      return;
    }

    try {
      setProblemLoading(true);
      console.log(`Fetching data for problem ${problemKey}`);
      const data = await api.leaderboards.getProblemLeaderboard(problemKey);
      console.log(`Received data for problem ${problemKey}:`, data);

      // Update the cache
      setLeaderboardData((prev) => ({
        ...prev,
        [problemKey]: data,
      }));

      // Set the current selected problem data
      setSelectedProblemData(data);
    } catch (error) {
      logger.error(`Error fetching leaderboard data for problem ${problemKey}:`);
      logger.debug(error.stack);
    } finally {
      setProblemLoading(false);
    }
  };

  // New function to load a specific TD problem's leaderboard data
  const loadTdProblemData = async (problemKey) => {
    if (!problemKey) return;

    // Skip if we already have this problem's data
    if (towerDefenseLeaderboardData[problemKey]) {
      setSelectedTdProblemData(towerDefenseLeaderboardData[problemKey]);
      return;
    }

    try {
      setTdProblemLoading(true);
      //console.log(`Fetching data for TD problem ${problemKey}`);
      const data = await api.leaderboards.getTowerDefenseProblemLeaderboard(problemKey);

      // Update the cache
      setTowerDefenseLeaderboardData((prev) => ({
        ...prev,
        [problemKey]: data,
      }));

      // Set the current selected TD problem data
      setSelectedTdProblemData(data);
    } catch (error) {
      logger.error(`Error fetching tower defense data for problem ${problemKey}:`);
      logger.debug(error.stack);
    } finally {
      setTdProblemLoading(false);
    }
  };

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        // Only fetch the problem metadata list, not all leaderboard data
        const problemsList = await api.leaderboards.getProblems();

        // Process and separate problems by source
        processProblemsData(problemsList);
      } catch (error) {
        logger.error('Error fetching leaderboard data:');
        logger.debug(error.stack);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchTowerDefenseLeaderboardData = async () => {
      try {
        setTdLoading(true);
        // Only fetch the problem metadata list, not all TD leaderboard data
        const problemsList = await api.leaderboards.getProblems();

        // Process and separate TD problems by source
        processTdProblemsData(problemsList);
      } catch (error) {
        logger.error('Error fetching tower defense leaderboard data:');
        logger.debug(error.stack);
        setError(true);
      } finally {
        setTdLoading(false);
      }
    };

    fetchLeaderboardData();
    fetchTowerDefenseLeaderboardData();
  }, []);

  // Modified to process only problem metadata without leaderboard data
  const processProblemsData = (problems) => {
    const interviewData = [];
    const aiData = [];

    // Process each problem and categorize by source
    problems.forEach((problem) => {
      // Log the problem object to see what we're receiving
      console.log('Processing problem:', problem);

      // Make sure we have a proper key (should be in format SOURCE_ID)
      const { source, key } = problem;
      if (!key || !key.includes('_')) {
        console.error(`Problem has invalid key format: ${key}, source: ${source}`);
        return; // Skip this problem
      }

      const formattedProblem = {
        key,
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        questionId: problem.questionId,
        totalSubmissions: problem.totalSubmissions || 0,
        avgExecutionTime: problem.avgExecutionTime || 0,
      };

      if (source === 'INTERVIEW') {
        interviewData.push(formattedProblem);
      } else if (source === 'AI') {
        aiData.push(formattedProblem);
      }
    });

    // Sort problems
    const sortedInterviewProblems = sortProblems(interviewData);
    const sortedAIProblems = sortProblems(aiData);

    // console.log('Sorted problems:', {
    //   interview: sortedInterviewProblems.length,
    //   ai: sortedAIProblems.length
    // });

    if (sortedInterviewProblems.length > 0) {
      //console.log('First interview problem:', sortedInterviewProblems[0]);
    }

    // Set the sorted problems
    setInterviewProblems(sortedInterviewProblems);
    setAiProblems(sortedAIProblems);

    // Set initial selected problem for each source
    if (sortedInterviewProblems.length > 0) {
      const problemKey = sortedInterviewProblems[0].key;
      console.log(`Setting initial interview problem: ${problemKey}`);
      setSelectedInterviewProblem(problemKey);
      // Load the first problem's data
      loadProblemData(problemKey);
    }

    if (sortedAIProblems.length > 0 && !selectedAiProblem) {
      setSelectedAiProblem(sortedAIProblems[0].key);
    }
  };

  // Modified to process only TD problem metadata without leaderboard data
  const processTdProblemsData = (problems) => {
    const interviewTdData = [];
    const aiTdData = [];

    // Process each problem and categorize by source for TD mode
    problems.forEach((problem) => {
      const { source, key } = problem;

      const formattedProblem = {
        key,
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        questionId: problem.questionId,
        totalSubmissions: problem.totalSubmissions || 0,
        avgExecutionTime: problem.avgExecutionTime || 0,
      };

      if (source === 'INTERVIEW') {
        interviewTdData.push(formattedProblem);
      } else if (source === 'AI') {
        aiTdData.push(formattedProblem);
      }
    });

    // Sort TD problems
    const sortedInterviewTdProblems = sortProblems(interviewTdData);
    const sortedAITdProblems = sortProblems(aiTdData);

    // Set the sorted TD problems
    setInterviewTdProblems(sortedInterviewTdProblems);
    setAiTdProblems(sortedAITdProblems);

    // Set initial selected TD problem for each source
    if (sortedInterviewTdProblems.length > 0) {
      setSelectedInterviewTdProblem(sortedInterviewTdProblems[0].key);
      // Load the first TD problem's data
      loadTdProblemData(sortedInterviewTdProblems[0].key);
    }

    if (sortedAITdProblems.length > 0 && !selectedAiTdProblem) {
      setSelectedAiTdProblem(sortedAITdProblems[0].key);
    }
  };

  // Modified function to get current page data from the selected problem
  const getCurrentPageData = () => {
    // Check if we have the selected problem data loaded
    const selectedProblem = getSelectedProblem();

    // If problem is loading or we don't have the selected problem's data yet
    if (problemLoading || !selectedProblemData) return [];

    return selectedProblemData.scores.slice(
      (currentPage - 1) * entriesPerPage,
      currentPage * entriesPerPage
    );
  };

  const getTdScoresForMode = (tdProblemData) => {
    const scores = tdProblemData?.scores || [];
    if (tdMode === 'endless') {
      return [...scores]
        .filter((entry) => (entry.endlessScore || 0) > 0 || (entry.endlessWaves || 0) > 0)
        .sort((a, b) => {
          const scoreDiff = (b.endlessScore || 0) - (a.endlessScore || 0);
          if (scoreDiff !== 0) return scoreDiff;
          const waveDiff = (b.endlessWaves || 0) - (a.endlessWaves || 0);
          if (waveDiff !== 0) return waveDiff;
          return (b.endlessSurvivalTime || 0) - (a.endlessSurvivalTime || 0);
        });
    }
    return scores;
  };

  // Modified function to get current TD page data from the selected TD problem
  const getCurrentTdPageData = () => {
    // Check if we have the selected TD problem data loaded
    const selectedTdProblem = getSelectedTdProblem();

    // If TD problem is loading or we don't have the selected TD problem's data yet
    if (tdProblemLoading || !selectedTdProblemData) return [];

    return getTdScoresForMode(selectedTdProblemData).slice(
      (tdCurrentPage - 1) * entriesPerPage,
      tdCurrentPage * entriesPerPage
    );
  };

  const tdScoresForMode = selectedTdProblemData ? getTdScoresForMode(selectedTdProblemData) : [];
  const tdTotalPages = Math.max(1, Math.ceil(tdScoresForMode.length / entriesPerPage));

  // Add useEffect to log problem lists after they're set
  useEffect(() => {
    // console.log('Problem lists updated:');
    // console.log('Interview problems:', interviewProblems.length, interviewProblems);
    // console.log('AI problems:', aiProblems.length, aiProblems);
    // console.log('TD problems:');
    // console.log('Interview TD problems:', interviewTdProblems.length, interviewTdProblems);
    // console.log('AI TD problems:', aiTdProblems.length, aiTdProblems);
  }, [interviewProblems, aiProblems, interviewTdProblems, aiTdProblems]);

  // Log selected problem changes
  useEffect(() => {
    const selected = getSelectedProblem();
    //console.log(`Selected problem changed: ${selected}`);
    if (selected && leaderboardData[selected]) {
      //console.log(`Selected problem details:`, leaderboardData[selected].problemInfo);
    }
  }, [selectedInterviewProblem, selectedAiProblem, leaderboardData, selectedSource]);

  // Log selected TD problem changes
  useEffect(() => {
    const selected = getSelectedTdProblem();
    //console.log(`Selected TD problem changed: ${selected}`);
    if (selected && towerDefenseLeaderboardData[selected]) {
      //console.log(`Selected TD problem details:`, towerDefenseLeaderboardData[selected].problemInfo);
    }
  }, [
    selectedInterviewTdProblem,
    selectedAiTdProblem,
    towerDefenseLeaderboardData,
    selectedTdSource,
  ]);

  useEffect(() => {
    setTdCurrentPage(1);
  }, [tdMode]);

  // Sort problems function
  const sortProblems = (problems) => {
    return problems.sort((a, b) => {
      if (a.questionId && b.questionId) {
        const aNum = parseInt(a.questionId);
        const bNum = parseInt(b.questionId);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
      }
      return a.title.localeCompare(b.title);
    });
  };

  // Get the current problem list based on selected source
  const getCurrentProblemsList = () => {
    // Apply search filter
    if (selectedSource === 'INTERVIEW') {
      return applySearchFilter(interviewProblems, searchQuery);
    } else if (selectedSource === 'AI') {
      return applySearchFilter(aiProblems, searchQuery);
    }
    return [];
  };

  // Get the current TD problem list based on selected source
  const getCurrentTdProblemsList = () => {
    // Apply search filter
    if (selectedTdSource === 'INTERVIEW') {
      return applySearchFilter(interviewTdProblems, tdSearchQuery);
    } else if (selectedTdSource === 'AI') {
      return applySearchFilter(aiTdProblems, tdSearchQuery);
    }
    return [];
  };

  // Apply search filter to a problem list
  const applySearchFilter = (problems, query) => {
    if (!query || query.trim() === '') return problems;

    const searchLower = query.toLowerCase();
    return problems.filter((problem) => {
      const titleLower = problem.title.toLowerCase();
      const questionId = problem.questionId?.toString() || '';

      return titleLower.includes(searchLower) || questionId.includes(searchLower);
    });
  };

  // Add useEffect to handle source changes for regular leaderboards
  useEffect(() => {
    // When source changes, automatically select and load the first problem for that source
    const loadFirstProblemForSource = async () => {
      let firstProblemKey = '';

      if (selectedSource === 'INTERVIEW' && interviewProblems.length > 0) {
        firstProblemKey = selectedInterviewProblem || interviewProblems[0].key;
        if (!selectedInterviewProblem) {
          setSelectedInterviewProblem(firstProblemKey);
        }
      } else if (selectedSource === 'AI' && aiProblems.length > 0) {
        firstProblemKey = selectedAiProblem || aiProblems[0].key;
        if (!selectedAiProblem) {
          setSelectedAiProblem(firstProblemKey);
        }
      }

      // Load the problem data if we have a valid key and don't already have the data
      if (firstProblemKey && !leaderboardData[firstProblemKey]) {
        console.log(`Loading data for first problem of ${selectedSource}: ${firstProblemKey}`);
        await loadProblemData(firstProblemKey);
      } else if (firstProblemKey && leaderboardData[firstProblemKey]) {
        // If we have cached data, set it as the selected problem data
        setSelectedProblemData(leaderboardData[firstProblemKey]);
      }
    };

    loadFirstProblemForSource();
  }, [selectedSource, interviewProblems, aiProblems]);

  // Add useEffect to handle source changes for tower defense leaderboards
  useEffect(() => {
    // When TD source changes, automatically select and load the first problem for that source
    const loadFirstTdProblemForSource = async () => {
      let firstTdProblemKey = '';

      if (selectedTdSource === 'INTERVIEW' && interviewTdProblems.length > 0) {
        firstTdProblemKey = selectedInterviewTdProblem || interviewTdProblems[0].key;
        if (!selectedInterviewTdProblem) {
          setSelectedInterviewTdProblem(firstTdProblemKey);
        }
      } else if (selectedTdSource === 'AI' && aiTdProblems.length > 0) {
        firstTdProblemKey = selectedAiTdProblem || aiTdProblems[0].key;
        if (!selectedAiTdProblem) {
          setSelectedAiTdProblem(firstTdProblemKey);
        }
      }

      // Load the TD problem data if we have a valid key and don't already have the data
      if (firstTdProblemKey && !towerDefenseLeaderboardData[firstTdProblemKey]) {
        //console.log(`Loading data for first TD problem of ${selectedTdSource}: ${firstTdProblemKey}`);
        await loadTdProblemData(firstTdProblemKey);
      } else if (firstTdProblemKey && towerDefenseLeaderboardData[firstTdProblemKey]) {
        // If we have cached data, set it as the selected TD problem data
        setSelectedTdProblemData(towerDefenseLeaderboardData[firstTdProblemKey]);
      }
    };

    loadFirstTdProblemForSource();
  }, [selectedTdSource, interviewTdProblems, aiTdProblems]);

  if (loading) {
    return <LeaderboardLoading />;
  }

  return (
    <Box p={{ base: 3, md: 4 }}>
      <Box
        bg="var(--cg-window-face)"
        border="2px solid var(--cg-window-shadow)"
        boxShadow="var(--cg-window-outset)"
        color="var(--cg-text)"
        fontFamily="var(--cg-font-retro-display)"
        fontSize={{ base: 'lg', md: 'xl' }}
        fontWeight="700"
        mb={{ base: 4, md: 6 }}
        px={{ base: 3, md: 4 }}
        py={3}
        textAlign="center"
        letterSpacing="0.08em"
        textTransform="uppercase"
      >
        Ranking Categories
      </Box>

      <Tabs variant="unstyled">
        <TabList
          mb={{ base: 4, md: 6 }}
          bg="var(--cg-window-face)"
          borderRadius="0"
          borderWidth="2px"
          borderColor="var(--cg-window-shadow)"
          p={{ base: 1, md: 1 }}
          boxShadow="var(--cg-window-outset)"
          overflow="hidden"
          flexDirection={{ base: 'column', sm: 'row' }}
        >
          <Tab flex="1" fontSize={{ base: 'xs', md: 'sm' }} py={{ base: 2, md: 3 }}>
            CODE SOLUTIONS
          </Tab>
          <Tab flex="1" fontSize={{ base: 'xs', md: 'sm' }} py={{ base: 2, md: 3 }}>
            TOWER DEFENSE
          </Tab>
        </TabList>

        <TabPanels>
          {/* Standard Leaderboard Panel */}
          <TabPanel p={0}>
            <StandardLeaderboardPanel
              selectedSource={selectedSource}
              setSelectedSource={setSelectedSource}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              getSelectedProblem={getSelectedProblem}
              setSelectedProblem={setSelectedProblem}
              getCurrentProblemsList={getCurrentProblemsList}
              leaderboardData={leaderboardData}
              selectedProblemData={selectedProblemData}
              getCurrentPageData={getCurrentPageData}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              entriesPerPage={entriesPerPage}
            />
          </TabPanel>

          {/* Tower Defense Leaderboard Panel */}
          <TabPanel p={0}>
            <TowerDefenseLeaderboardPanel
              selectedTdSource={selectedTdSource}
              setSelectedTdSource={setSelectedTdSource}
              tdSearchQuery={tdSearchQuery}
              setTdSearchQuery={setTdSearchQuery}
              getSelectedTdProblem={getSelectedTdProblem}
              setSelectedTdProblem={setSelectedTdProblem}
              getCurrentTdProblemsList={getCurrentTdProblemsList}
              tdMode={tdMode}
              setTdMode={setTdMode}
              towerDefenseLeaderboardData={towerDefenseLeaderboardData}
              selectedTdProblemData={selectedTdProblemData}
              getCurrentTdPageData={getCurrentTdPageData}
              tdCurrentPage={tdCurrentPage}
              setTdCurrentPage={setTdCurrentPage}
              tdTotalPages={tdTotalPages}
              entriesPerPage={entriesPerPage}
              formatSeconds={formatSeconds}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Box height="100px" width="100%" mt={10}></Box>
    </Box>
  );
}

export default Leaderboards;
