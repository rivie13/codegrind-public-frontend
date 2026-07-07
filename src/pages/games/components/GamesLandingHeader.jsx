import { Box, Heading, Text } from '@chakra-ui/react';

function GamesLandingHeader() {
	return (
		<Box
			textAlign="center"
			py={{ base: 4, md: 6 }}
			position="relative"
			_before={{
				content: '""',
				position: 'absolute',
				top: '-6px',
				left: { base: '4%', md: '10%' },
				width: { base: '14px', md: '20px' },
				height: { base: '14px', md: '20px' },
				borderTop: '2px solid #00FFFF',
				borderLeft: '2px solid #00FFFF'
			}}
			_after={{
				content: '""',
				position: 'absolute',
				bottom: '-6px',
				right: { base: '4%', md: '10%' },
				width: { base: '14px', md: '20px' },
				height: { base: '14px', md: '20px' },
				borderBottom: '2px solid #FF00DE',
				borderRight: '2px solid #FF00DE'
			}}
		>
			<Heading
				as="h1"
				fontSize={{ base: '32px', sm: '36px', md: '48px' }}
				mb={{ base: 4, md: 6 }}
				bgGradient="linear(to-r, #00ff8c, #00FFFF)"
				bgClip="text"
				fontFamily="'Orbitron', sans-serif"
				textShadow="0 0 10px rgba(0, 255, 255, 0.3)"
				textAlign="center"
				_before={{
					content: '"<"',
					marginRight: '8px',
					color: '#FF00DE'
				}}
				_after={{
					content: '">"',
					marginLeft: '8px',
					color: '#FF00DE'
				}}
			>
				CODEBREACH
			</Heading>
			<Text
				fontSize={{ base: 'md', sm: 'lg', md: 'xl' }}
				maxW="720px"
				mx="auto"
				px={{ base: 2, md: 0 }}
				color="#00ff8c"
				fontFamily="monospace"
				textShadow="0 0 5px rgba(0, 255, 140, 0.5)"
			>
				THE FIRST GAME THAT TRAINS REAL INTERVIEW SKILLS.
				BUILD SOLUTIONS TOWER-BY-TOWER, VERIFY THE LOGIC, AND DEFEND YOUR CODE.
			</Text>
		</Box>
	);
}

export default GamesLandingHeader;
