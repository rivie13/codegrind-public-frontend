import { Text } from '@chakra-ui/react';
import GenerationProgress from '../generators/GenerationProgress';
import { RetroInset, RetroPanel } from '../../retro/RetroPageShell';

const GenerationCard = ({ isGenerating, stepStatus, generatedProblem }) => {
  const hasGeneratedProblem = Boolean(Object.keys(generatedProblem || {}).length);

  return (
    <RetroPanel
      fileLabel="generation.queue"
      title="Generate Your Custom Problem"
      subtitle={
        isGenerating
          ? 'The generator is currently building a draft.'
          : 'Set the parameters on the left, then start a new generation run.'
      }
      mb={5}
    >
      {isGenerating ? <GenerationProgress stepStatus={stepStatus} /> : null}

      {!isGenerating && !hasGeneratedProblem ? (
        <RetroInset p={{ base: 4, md: 5 }} textAlign="center">
          <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.7">
            Configure the parameters on the left to create a custom programming challenge.
          </Text>
          <Text mt={3} fontSize="xs" color="var(--cg-muted)">
            Click Generate Problem to start the creation process.
          </Text>
        </RetroInset>
      ) : null}
    </RetroPanel>
  );
};

export default GenerationCard;
