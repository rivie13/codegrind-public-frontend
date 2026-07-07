import { Box, Select, Text } from '@chakra-ui/react';

const ASSISTANCE_LEVELS = [
  {
    value: 'hints',
    label: 'Hints Only',
    description: 'Get hints and guidance, but never full code.',
  },
  {
    value: 'full_solution',
    label: 'Full Solution',
    description: 'Receive a complete code solution.',
  },
  {
    value: 'step_by_step',
    label: 'Step-by-Step',
    description: 'Get a solution broken down into logical steps.',
  },
  {
    value: 'debug',
    label: 'Debug Mode',
    description: 'Get help identifying and fixing bugs in your code.',
  },
  {
    value: 'learning',
    label: 'Learning Mode',
    description: 'Get explanations and teaching for concepts and code.',
  },
];

const AssistanceLevelSelector = ({ value, onChange, allowedLevels = null }) => {
  const availableLevels =
    Array.isArray(allowedLevels) && allowedLevels.length
      ? ASSISTANCE_LEVELS.filter((level) => allowedLevels.includes(level.value))
      : ASSISTANCE_LEVELS;
  const selectedLevel =
    availableLevels.find((level) => level.value === value) || availableLevels[0];

  return (
    <Box mb={2}>
      <Text
        fontFamily="var(--cg-font-retro-display)"
        color="var(--cg-muted)"
        fontSize="xs"
        fontWeight="600"
        mb={1}
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        Assistance Level:
      </Text>
      <Select
        value={selectedLevel?.value}
        onChange={(e) => onChange(e.target.value)}
        bg="var(--cg-window)"
        color="var(--cg-text)"
        borderColor="var(--cg-window-shadow)"
        borderWidth="1px"
        boxShadow="var(--cg-window-outset)"
        fontFamily="var(--cg-font-retro-display)"
        fontSize="md"
        fontWeight="600"
        letterSpacing="0.2px"
        lineHeight="1.4"
        iconColor="var(--cg-text)"
        _hover={{ borderColor: 'var(--cg-window-shadow)', bg: 'var(--cg-panel-shell)' }}
        _focus={{ boxShadow: 'var(--cg-window-inset)', borderColor: 'var(--cg-window-shadow)' }}
        _focusVisible={{
          boxShadow: 'var(--cg-window-inset)',
          borderColor: 'var(--cg-window-shadow)',
        }}
        sx={{
          option: {
            background: 'var(--cg-window)',
            color: 'var(--cg-text)',
          },
        }}
      >
        {availableLevels.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label} - {level.description}
          </option>
        ))}
      </Select>
    </Box>
  );
};

export default AssistanceLevelSelector;
