import { Badge, Box, Button, Card, CardBody, Flex, Heading, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';

const MotionBox = motion(Box);

function TowerDefenseCard() {
	return (
		<MotionBox
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			width="100%"
		>
			<Card
				bg="#0f1012"
				borderRadius="lg"
				borderWidth="1px"
				borderColor="#3d3d3d"
				boxShadow="0 0 20px rgba(0, 255, 255, 0.2)"
				position="relative"
				overflow="hidden"
				_before={{
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					width: '20px',
					height: '20px',
					borderTop: '1px solid #00FFFF',
					borderLeft: '1px solid #00FFFF'
				}}
				_after={{
					content: '""',
					position: 'absolute',
					bottom: 0,
					right: 0,
					width: '20px',
					height: '20px',
					borderBottom: '1px solid #FF00DE',
					borderRight: '1px solid #FF00DE'
				}}
				maxW="1200px"
				mx="auto"
			>
				<CardBody p={0}>
					<Flex direction={{ base: 'column', md: 'row' }} overflow="hidden">
						<Box
							width={{ base: '100%', md: '40%' }}
							bg="#0a0a0c"
							p={{ base: 5, md: 8 }}
							display="flex"
							alignItems="center"
							justifyContent="center"
							position="relative"
							overflow="hidden"
						>
							<Box
								width="100%"
								height={{ base: '220px', sm: '260px', lg: '400px' }}
								bg="#0a0a0c"
								borderRadius="md"
								borderWidth="1px"
								borderColor="#3d3d3d"
								boxShadow="inset 0 0 20px rgba(0, 255, 255, 0.1)"
								position="relative"
								overflow="hidden"
							>
								<Box
									position="absolute"
									top="0"
									left="0"
									right="0"
									bottom="0"
									opacity="0.2"
									background="url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDBmZjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj4KICAgIGZ1bmN0aW9uIGhhY2soKSB7IHJldHVybiBkYXRhYml0czsgfQogIDwvdGV4dD4KPC9zdmc+')"
									animation="matrix 20s linear infinite"
									sx={{
										'@keyframes matrix': {
											'0%': { backgroundPosition: '0 0' },
											'100%': { backgroundPosition: '0 1000px' }
										}
									}}
								/>

								<Flex
									position="absolute"
									width="100%"
									height="100%"
									alignItems="center"
									justifyContent="center"
									flexDirection="column"
									zIndex="1"
								>
									<Text
										fontFamily="'Orbitron', sans-serif"
										fontSize={{ base: '4xl', sm: '5xl', lg: '7xl' }}
										color="#00ff00"
										textShadow="0 0 10px #00ff00, 0 0 15px #00ff00"
										mb={{ base: 2, md: 3 }}
									>
										BUILD
									</Text>
									<Badge
										colorScheme="cyan"
										fontSize={{ base: 'sm', sm: 'md', md: 'xl' }}
										px={4}
										py={{ base: 1, md: 1 }}
										borderRadius="sm"
										bg="transparent"
										color="#00FFFF"
										border="1px solid #00FFFF"
										boxShadow="0 0 10px rgba(0, 255, 255, 0.5)"
										fontFamily="monospace"
									>
										HUMAN-IN-THE-LOOP IDE v1.5
									</Badge>
								</Flex>

								<Box
									position="absolute"
									top="0"
									left="0"
									right="0"
									height="3px"
									bg="rgba(0, 255, 255, 0.3)"
									boxShadow="0 0 10px rgba(0, 255, 255, 0.8)"
									animation="scanline 4s linear infinite"
									sx={{
										'@keyframes scanline': {
											'0%': { top: '0%' },
											'100%': { top: '100%' }
										}
									}}
								/>
							</Box>
						</Box>

						<Box width={{ base: '100%', md: '60%' }} p={{ base: 6, md: 8, xl: 10 }}>
							<Heading
								as="h2"
								fontSize={{ base: 'xl', sm: '2xl', md: '3xl' }}
								mb={{ base: 4, md: 6 }}
								color="#00FFFF"
								fontFamily="'Orbitron', sans-serif"
								textShadow="0 0 5px rgba(0, 255, 255, 0.5)"
							>
								THE AI-COLLABORATIVE IDE
							</Heading>

							<Text color="white" mb={4} fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
								<Text as="span" color="#FF00DE">
									[CORE LOOP]:
								</Text>{' '}
								Solve real interview problems with an AI partner. You build the solution tower-by-tower, verify
								each step, and learn how to review AI output like a senior engineer.
							</Text>

							<Text color="white" mb={4} fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
								Pilot Mode (Tower → Code): place a tower and the AI generates a line of code. Your job is to
								verify the logic and choose the correct path forward.
							</Text>

							<Text color="white" mb={4} fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
								Architect Mode (Code → Tower): write your own solution in the editor and get tactical tower
								suggestions based on your syntax (loops, arrays, variables, and functions).
							</Text>

							<Text color="white" mb={4} fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
								Variable Assistance lets you control how much help the AI gives—subtle hints or full breakdowns.
								You decide the training intensity.
							</Text>
							<Text color="white" mb={{ base: 5, md: 6 }} fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
								<Text as="span" color="#ff0000" fontWeight="bold">
									THE FINAL WAVE:
								</Text>{' '}
								Verify your solution to determine the difficulty and outcome of the level. If your solution passes, you face against a normal final wave, if you fail you face endless nightmare mode!
							</Text>

							<Box mt={{ base: 6, md: 8 }}>
								<Button
									as={RouterLink}
									to="/games/tower-defense"
									size="lg"
									bg="transparent"
									color="#00FFFF"
									border="1px solid #00FFFF"
									borderRadius="sm"
									px={{ base: 6, md: 10 }}
									py={{ base: 4, md: 6 }}
									width={{ base: '100%', sm: 'auto' }}
									boxShadow="0 0 10px rgba(0, 255, 255, 0.3)"
									_hover={{
										bg: 'rgba(0, 255, 255, 0.1)',
										boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)'
									}}
									fontFamily="monospace"
									position="relative"
									_before={{
										content: '""',
										position: 'absolute',
										top: '5px',
										left: '5px',
										width: '10px',
										height: '10px',
										borderTop: '1px solid #00FFFF',
										borderLeft: '1px solid #00FFFF'
									}}
									_after={{
										content: '""',
										position: 'absolute',
										bottom: '5px',
										right: '5px',
										width: '10px',
										height: '10px',
										borderBottom: '1px solid #00FFFF',
										borderRight: '1px solid #00FFFF'
									}}
								>
									START A PROBLEM
								</Button>
							</Box>
						</Box>
					</Flex>
				</CardBody>
			</Card>
		</MotionBox>
	);
}

export default TowerDefenseCard;
