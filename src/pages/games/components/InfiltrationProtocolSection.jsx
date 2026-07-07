import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

function InfiltrationProtocolSection() {
	return (
		<Box textAlign="center" mt={{ base: 8, md: 10 }} py={{ base: 4, md: 6 }}>
			<Heading
				as="h3"
				fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}
				mb={{ base: 6, md: 8 }}
				bgGradient="linear(to-r, #FF00DE, #00FFFF)"
				bgClip="text"
				fontFamily="'Orbitron', sans-serif"
				textShadow="0 0 5px rgba(255, 0, 222, 0.5)"
			>
				HUMAN-IN-THE-LOOP FLOW
			</Heading>

			<Flex
				direction={{ base: 'column', md: 'row' }}
				justifyContent="space-between"
				gap={{ base: 6, md: 6 }}
				mt={{ base: 4, md: 6 }}
				maxW="1200px"
				mx="auto"
			>
				<MotionBox
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
					flex="1"
				>
					<VStack
						align="center"
						p={{ base: 5, md: 6 }}
						bg="#0f1012"
						borderRadius="md"
						borderWidth="1px"
						borderColor="#3d3d3d"
						boxShadow="0 0 10px rgba(0, 255, 255, 0.2)"
						position="relative"
						overflow="hidden"
						_before={{
							content: '""',
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '2px',
							background: '#00FFFF'
						}}
						height="100%"
					>
						<Box
							width={{ base: '52px', md: '60px' }}
							height={{ base: '52px', md: '60px' }}
							borderRadius="full"
							bg="#0a0a0c"
							display="flex"
							alignItems="center"
							justifyContent="center"
							mb={4}
							border="2px solid #00FFFF"
							boxShadow="0 0 10px rgba(0, 255, 255, 0.3)"
						>
							<Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="#00FFFF" fontFamily="monospace">
								01
							</Text>
						</Box>
						<Heading fontSize={{ base: 'md', md: 'lg' }} mb={4} color="#00FFFF" fontFamily="'Orbitron', sans-serif">
							SELECT
						</Heading>
						<Text textAlign="center" color="white" fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
							Pick a real interview problem from a deep library. Each one maps to a concrete set of
							constraints and algorithmic tradeoffs.
						</Text>
					</VStack>
				</MotionBox>

				<MotionBox
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					flex="1"
				>
					<VStack
						align="center"
						p={{ base: 5, md: 6 }}
						bg="#0f1012"
						borderRadius="md"
						borderWidth="1px"
						borderColor="#3d3d3d"
						boxShadow="0 0 10px rgba(255, 0, 222, 0.2)"
						position="relative"
						overflow="hidden"
						_before={{
							content: '""',
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '2px',
							background: '#FF00DE'
						}}
						height="100%"
					>
						<Box
							width={{ base: '52px', md: '60px' }}
							height={{ base: '52px', md: '60px' }}
							borderRadius="full"
							bg="#0a0a0c"
							display="flex"
							alignItems="center"
							justifyContent="center"
							mb={4}
							border="2px solid #FF00DE"
							boxShadow="0 0 10px rgba(255, 0, 222, 0.3)"
						>
							<Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="#FF00DE" fontFamily="monospace">
								02
							</Text>
						</Box>
						<Heading fontSize={{ base: 'md', md: 'lg' }} mb={4} color="#FF00DE" fontFamily="'Orbitron', sans-serif">
							VERIFY
						</Heading>
						<Text textAlign="center" color="white" fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
							Use Pilot Mode or Architect Mode to build your solution. The AI proposes code; you validate the
							logic before it becomes part of your final answer.
						</Text>
					</VStack>
				</MotionBox>

				<MotionBox
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					flex="1"
				>
					<VStack
						align="center"
						p={{ base: 5, md: 6 }}
						bg="#0f1012"
						borderRadius="md"
						borderWidth="1px"
						borderColor="#3d3d3d"
						boxShadow="0 0 10px rgba(0, 255, 140, 0.2)"
						position="relative"
						overflow="hidden"
						_before={{
							content: '""',
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '2px',
							background: '#00FF8C'
						}}
						height="100%"
					>
						<Box
							width={{ base: '52px', md: '60px' }}
							height={{ base: '52px', md: '60px' }}
							borderRadius="full"
							bg="#0a0a0c"
							display="flex"
							alignItems="center"
							justifyContent="center"
							mb={4}
							border="2px solid #00FF8C"
							boxShadow="0 0 10px rgba(0, 255, 140, 0.3)"
						>
							<Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="#00FF8C" fontFamily="monospace">
								03
							</Text>
						</Box>
						<Heading fontSize={{ base: 'md', md: 'lg' }} mb={4} color="#00FF8C" fontFamily="'Orbitron', sans-serif">
							PASS
						</Heading>
						<Text textAlign="center" color="white" fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
							Run the tests. If they pass, your defense holds. If not, review the failure, refactor, and
							ship a stronger solution.
						</Text>
					</VStack>
				</MotionBox>
			</Flex>
		</Box>
	);
}

export default InfiltrationProtocolSection;
