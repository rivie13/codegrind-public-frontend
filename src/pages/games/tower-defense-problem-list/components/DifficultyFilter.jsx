import { Box, Flex, Select, Text } from '@chakra-ui/react';

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

function DifficultyFilter({ onChange, value }) {
  return (
    <Flex
      justifyContent="space-between"
      align={{ base: 'stretch', md: 'center' }}
      flexDirection={{ base: 'column', md: 'row' }}
      gap={3}
      mb={6}
      p={3}
      bg="var(--cg-window)"
      borderRadius="0"
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
    >
      <Text color="var(--cg-text)" fontFamily={UI_FONT_FAMILY} alignSelf="center" fontWeight="700">
        Security Level
      </Text>
      <Select
        placeholder="All Difficulties"
        onChange={onChange}
        value={value}
        width={{ base: '100%', md: '220px' }}
        bg="#ffffff"
        color="#1f2430"
        fontFamily={UI_FONT_FAMILY}
        border="2px solid var(--cg-window-dark)"
        borderRadius="0"
        boxShadow="var(--cg-window-inset)"
        _hover={{ borderColor: 'var(--cg-window-shadow)' }}
        _focusVisible={{
          borderColor: 'var(--cg-accent-blue)',
          boxShadow: 'var(--cg-window-inset)',
        }}
        icon={
          <Box as="span" color="var(--cg-accent-blue)">
            ▼
          </Box>
        }
        sx={{
          '& option': {
            color: '#1f2430',
            backgroundColor: '#ffffff',
          },
        }}
      >
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </Select>
    </Flex>
  );
}

export default DifficultyFilter;
