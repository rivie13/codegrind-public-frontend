import { Box, Flex, FormControl, FormLabel, Heading, Switch, Text } from '@chakra-ui/react';
import React from 'react';
import ModelSelector from '../../../common/ModelSelector';
import RateLimitIndicator from '../overlays/RateLimitIndicator';
import { cyberpunkSwitchStyle } from './SettingsMenuShared';

const AISettingsSection = ({
  aiCodeSnippetGeneration,
  basicSnippetFallbackEnabled,
  showSnippetAdPrompt,
  handleAICodeSnippetToggle,
  handleBasicSnippetFallbackToggle,
  handleSnippetAdPromptToggle,
  selectedSnippetModel,
  handleSnippetModelChange,
  isSnippetToggleDisabled,
}) => (
  <Box mb={6}>
    <Heading
      as="h3"
      size="md"
      mb={3}
      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
      color="#0a2c9a"
      borderBottom="1px solid"
      borderColor="#7f7f7f"
      pb={2}
      position="relative"
      letterSpacing="0.08em"
      textTransform="uppercase"
      sx={{
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: '0',
          left: '25%',
          width: '50%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #1084d0, transparent)',
        },
      }}
    >
      <Flex align="center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a2c9a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '8px' }}
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        AI CODE GENERATION
      </Flex>
    </Heading>
    <RateLimitIndicator showDetails={true} />

    <Box
      mt={4}
      p={3}
      bg="#efebe7"
      borderWidth="2px"
      borderColor="#7f7f7f"
      borderRadius="0"
      boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
    >
      <FormControl display="flex" alignItems="center" mb={2}>
        <FormLabel htmlFor="ai-code-snippet-toggle" mb="0" color="#1f2430" fontWeight="700">
          Enable AI Code Snippets
        </FormLabel>
        <Switch
          id="ai-code-snippet-toggle"
          isChecked={aiCodeSnippetGeneration}
          onChange={handleAICodeSnippetToggle}
          isDisabled={isSnippetToggleDisabled}
          colorScheme="cyan"
          size="md"
          sx={cyberpunkSwitchStyle}
        />
      </FormControl>
      <Text fontSize="sm" color="#3b4250" mt={2}>
        {aiCodeSnippetGeneration
          ? 'AI will generate contextual code snippets when towers are placed. If you run out of generation quota, AI snippets pause until you watch an ad or enable basic fallback snippets.'
          : 'Tower placement will not add any code snippets.'}
      </Text>
      <Text fontSize="xs" color="#4f5665" mt={2}>
        Note: Disabling this will save your AI generation quota for when you need it.
      </Text>
      <Text fontSize="xs" color="#8f1f1f" mt={2} fontWeight="bold">
        BETA FEATURE: AI code snippet generation is experimental and may cause unexpected behavior.
      </Text>
      <FormControl display="flex" alignItems="center" mt={3}>
        <FormLabel htmlFor="ai-basic-snippet-toggle" mb="0" color="#1f2430" fontWeight="700">
          Allow basic snippet fallback
        </FormLabel>
        <Switch
          id="ai-basic-snippet-toggle"
          isChecked={basicSnippetFallbackEnabled}
          onChange={handleBasicSnippetFallbackToggle}
          colorScheme="cyan"
          size="md"
          sx={cyberpunkSwitchStyle}
        />
      </FormControl>
      <Text fontSize="xs" color="#4f5665" mt={1}>
        When enabled, you can choose basic snippets in the AI ad modal after quota runs out.
      </Text>
      <Box mt={4}>
        <Text fontSize="xs" color="#0a2c9a" mb={2} fontWeight="700">
          Snippet Model
        </Text>
        <ModelSelector
          feature="snippet"
          value={selectedSnippetModel}
          onChange={handleSnippetModelChange}
          compact
          showCost={false}
          isDisabled={isSnippetToggleDisabled || !aiCodeSnippetGeneration}
          theme="retro-desktop"
        />
        <Text fontSize="xs" color="#4f5665" mt={1}>
          Premium/Unlimited can choose between available snippet models. Guest/Free use the default
          model.
        </Text>
      </Box>
      <FormControl display="flex" alignItems="center" mt={3}>
        <FormLabel htmlFor="ai-snippet-ad-prompt-toggle" mb="0" color="#1f2430" fontWeight="700">
          Show AI snippet ad prompt
        </FormLabel>
        <Switch
          id="ai-snippet-ad-prompt-toggle"
          isChecked={showSnippetAdPrompt}
          onChange={handleSnippetAdPromptToggle}
          colorScheme="cyan"
          size="md"
          sx={cyberpunkSwitchStyle}
        />
      </FormControl>
      <Text fontSize="xs" color="#4f5665" mt={1}>
        If disabled, you can still restore AI snippets using the ad buttons in the rate limit panel.
      </Text>
    </Box>
  </Box>
);

export default AISettingsSection;
