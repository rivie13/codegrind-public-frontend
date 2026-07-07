import {
		Box,
		Button,
		Container,
		Flex,
		Grid,
		Heading,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Text,
		useToast,
		VStack
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import PageTemplate from '../../components/layout/PageTemplate';
import { useAchievements } from '../../contexts/AchievementContext';
import { useAuth } from '../../contexts/AuthContext';
import { achievementService } from '../../services/achievementService';
import { api } from '../../services/api';
import logger from '../../utils/core/logger';

function AchievementTestPage() {
	const { user } = useAuth();
	const { achievements, refetchAchievements } = useAchievements();
	const [isLoading, setIsLoading] = useState(false);
	const [availableAchievements, setAvailableAchievements] = useState([]);
	const toast = useToast();

	// Fetch all available achievements on component mount
	useEffect(() => {
		const fetchAvailableAchievements = async () => {
			try {
				const data = await achievementService.getAvailableAchievements();
				setAvailableAchievements(data);
			} catch (error) {
				logger.error('Error fetching available achievements:', error);
				toast({
					title: 'Error',
					description: 'Failed to load available achievements',
					status: 'error',
					duration: 3000,
					isClosable: true
				});
			}
		};

		fetchAvailableAchievements();
	}, [toast]);

	// Add a test achievement directly to the database
	const addTestAchievement = async () => {
		if (!user?.id) {
			toast({
				title: 'Error',
				description: 'You must be logged in to add a test achievement',
				status: 'error',
				duration: 3000,
				isClosable: true
			});
			return;
		}

		setIsLoading(true);
		try {
			// Use our api service instead of direct fetch
			const result = await api.achievements.createTestAchievement(user.id);
			logger.info('Test achievement created:', result);
      
			// Refresh achievements list
			refetchAchievements();
      
			toast({
				title: 'Success',
				description: 'Test achievement created successfully',
				status: 'success',
				duration: 3000,
				isClosable: true
			});
		} catch (error) {
			logger.error('Error creating test achievement:', error);
			toast({
				title: 'Error',
				description: error.message || 'Failed to create test achievement',
				status: 'error',
				duration: 3000,
				isClosable: true
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<PageTemplate title="Achievement Test Page">
			<Container maxW="container.xl" py={8}>
				<VStack spacing={8} align="stretch">
					<Heading 
						bgGradient="linear(to-r, #00FFFF, #FF00DE)" 
						bgClip="text"
						textAlign="center"
						mb={8}
					>
						Achievement Test Page
					</Heading>

					<Flex justify="center" mb={6}>
						<Button
							onClick={addTestAchievement}
							isLoading={isLoading}
							loadingText="Creating..."
							colorScheme="teal"
							size="lg"
							bg="#00FFFF"
							color="black"
							_hover={{ bg: "#00cccc" }}
							boxShadow="0 0 15px rgba(0, 255, 255, 0.5)"
						>
							Create Test Achievement
						</Button>
					</Flex>

					<Tabs variant="soft-rounded" colorScheme="cyan">
						<TabList mb={4}>
							<Tab 
								color="#00FFFF" 
								_selected={{ 
									color: 'black', 
									bg: '#00FFFF',
									boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)'
								}}
								fontFamily="monospace"
							>
								MY ACHIEVEMENTS
							</Tab>
							<Tab 
								color="#00FFFF" 
								_selected={{ 
									color: 'black', 
									bg: '#00FFFF',
									boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)'
								}}
								fontFamily="monospace"
							>
								ALL AVAILABLE ACHIEVEMENTS
							</Tab>
						</TabList>

						<TabPanels>
							<TabPanel>
								<Box 
									bg="#0f1012" 
									p={6} 
									borderRadius="lg"
									border="1px solid rgba(0, 255, 255, 0.3)"
									boxShadow="0 0 20px rgba(0, 255, 255, 0.1)"
								>
									<Heading 
										size="md" 
										color="#00FFFF" 
										mb={4}
										textShadow="0 0 5px #00FFFF"
										fontFamily="monospace"
									>
										My Achievements ({achievements.length})
									</Heading>
                  
									<Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
										{achievements.map(achievement => (
											<Box 
												key={achievement.id}
												p={4}
												bg="rgba(0, 0, 0, 0.4)"
												borderRadius="md"
												textAlign="center"
												border="1px solid rgba(0, 255, 255, 0.2)"
												boxShadow="0 0 10px rgba(0, 255, 255, 0.1)"
												_hover={{
													boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)",
													transform: "translateY(-2px)"
												}}
												transition="all 0.3s ease"
											>
												<Text 
													fontSize="3xl" 
													mb={2}
													color="#00FFFF"
													textShadow="0 0 10px #00FFFF"
												>
													{achievement.icon}
												</Text>
												<Text 
													color="#FFCC00" 
													fontWeight="bold"
													mb={1}
													fontFamily="monospace"
													textShadow="0 0 5px rgba(255, 204, 0, 0.5)"
												>
													{achievement.title}
												</Text>
												<Text 
													color="gray.400" 
													fontSize="sm"
													fontFamily="monospace"
												>
													{achievement.description}
												</Text>
												<Text
													color="gray.500"
													fontSize="xs"
													mt={2}
													fontFamily="monospace"
												>
													Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
												</Text>
											</Box>
										))}
                    
										{achievements.length === 0 && (
											<Box 
												p={6} 
												textAlign="center" 
												gridColumn="1 / -1"
												border="1px dashed rgba(0, 255, 255, 0.3)"
												borderRadius="md"
											>
												<Text 
													color="#00FFFF"
													fontFamily="monospace"
													textShadow="0 0 5px rgba(0, 255, 255, 0.5)"
												>
													No achievements found. Create one with the button above!
												</Text>
											</Box>
										)}
									</Grid>
								</Box>
							</TabPanel>

							<TabPanel>
								<Box 
									bg="#0f1012" 
									p={6} 
									borderRadius="lg"
									border="1px solid rgba(0, 255, 255, 0.3)"
									boxShadow="0 0 20px rgba(0, 255, 255, 0.1)"
								>
									<Heading 
										size="md" 
										color="#00FFFF" 
										mb={4}
										textShadow="0 0 5px #00FFFF"
										fontFamily="monospace"
									>
										All Available Achievements ({availableAchievements.length})
									</Heading>
                  
									<Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
										{availableAchievements.map(achievement => (
											<Box 
												key={achievement.id}
												p={4}
												bg="rgba(0, 0, 0, 0.4)"
												borderRadius="md"
												textAlign="center"
												border="1px solid rgba(0, 255, 255, 0.2)"
												boxShadow="0 0 10px rgba(0, 255, 255, 0.1)"
												_hover={{
													boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)",
													transform: "translateY(-2px)"
												}}
												transition="all 0.3s ease"
											>
												<Text 
													fontSize="3xl" 
													mb={2}
													color="#00FFFF"
													textShadow="0 0 10px #00FFFF"
												>
													{achievement.icon}
												</Text>
												<Text 
													color="#FFCC00" 
													fontWeight="bold"
													mb={1}
													fontFamily="monospace"
													textShadow="0 0 5px rgba(255, 204, 0, 0.5)"
												>
													{achievement.title}
												</Text>
												<Text 
													color="gray.400" 
													fontSize="sm"
													fontFamily="monospace"
												>
													{achievement.description}
												</Text>
												<Text
													color="gray.500"
													fontSize="xs"
													mt={2}
													fontFamily="monospace"
												>
													{achievement.type} - {achievement.category || achievement.difficulty || achievement.mode || 'general'}
												</Text>
											</Box>
										))}
                    
										{availableAchievements.length === 0 && (
											<Box 
												p={6} 
												textAlign="center" 
												gridColumn="1 / -1"
												border="1px dashed rgba(0, 255, 255, 0.3)"
												borderRadius="md"
											>
												<Text 
													color="#00FFFF"
													fontFamily="monospace"
													textShadow="0 0 5px rgba(0, 255, 255, 0.5)"
												>
													No available achievements found in the system.
												</Text>
											</Box>
										)}
									</Grid>
								</Box>
							</TabPanel>
						</TabPanels>
					</Tabs>
				</VStack>
			</Container>
		</PageTemplate>
	);
}

export default AchievementTestPage;
