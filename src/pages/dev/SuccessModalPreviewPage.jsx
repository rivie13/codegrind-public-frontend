import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Select,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageTemplate from '../../components/layout/PageTemplate';
import SaveOptionsModal from '../../components/aiProblems/modals/SaveOptionsModal';
import SuccessModal from '../../components/problemWorkspace/modals/SuccessModal';
import TowerDefenseSuccessModal from '../../components/towerDefense/TowerDefenseSuccessModal';
import { api } from '../../services/api';

const TYPE_OPTIONS = [
  { value: 'problem', label: 'Problem Success Modal' },
  { value: 'tower-defense', label: 'Tower Defense Success Modal' },
  { value: 'save-options', label: 'AI Save Options Modal' }
];

const VARIANT_OPTIONS = [
  { value: 'level-up', label: 'Level Up' },
  { value: 'standard', label: 'Standard (No Level Up)' }
];

function SuccessModalPreviewPage() {
  const toast = useToast();
  const [previewType, setPreviewType] = useState('problem');
  const [previewVariant, setPreviewVariant] = useState('level-up');
  const [payload, setPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.getSuccessModalPreview({
        type: previewType,
        variant: previewVariant
      });
      setPayload(data);
    } catch (error) {
      toast({
        title: 'Failed to load preview',
        description: error?.message || 'Unable to fetch preview payload.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [previewType, previewVariant, toast]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const modalContent = useMemo(() => {
    if (!payload) return null;

    if (payload.type === 'tower-defense') {
      return (
        <TowerDefenseSuccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          gameStats={payload.gameStats || {}}
          problemData={payload.problemData || null}
          onEnterEndlessMode={() => setIsModalOpen(false)}
        />
      );
    }

    if (payload.type === 'save-options') {
      const saveOptions = payload.saveOptions || {};
      return (
        <SaveOptionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={saveOptions.title}
          problemNumber={saveOptions.problemNumber}
          xpSummary={saveOptions.xpSummary || null}
          xpAwards={saveOptions.xpAwards || []}
          levelUpInfo={saveOptions.levelUpInfo || null}
          onGoToProblem={() => setIsModalOpen(false)}
          onCreateAnother={() => setIsModalOpen(false)}
        />
      );
    }

    const stats = payload.stats || {};
    return (
      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        problemData={payload.problemData || null}
        timeSpent={stats.timeSpent || 0}
        finalScore={stats.finalScore || 0}
        hasNewHighScore={Boolean(stats.hasNewHighScore)}
        hasNewBestTime={Boolean(stats.hasNewBestTime)}
        aiUsageCount={stats.aiUsageCount || 0}
        sessionSubmissions={stats.sessionSubmissions || 0}
        xpSummary={payload.xpSummary || null}
        xpAwards={payload.xpAwards || []}
        levelUpInfo={payload.levelUpInfo || null}
        onTryAnotherProblem={() => setIsModalOpen(false)}
        nextProblem={payload.nextProblem || null}
      />
    );
  }, [isModalOpen, payload]);

  return (
    <PageTemplate title="Success Modal Preview">
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading
            bgGradient="linear(to-r, #00FFFF, #FF00DE)"
            bgClip="text"
            textAlign="center"
          >
            Success Modal Preview
          </Heading>

          <Box
            bg="#0f1012"
            p={6}
            borderRadius="lg"
            border="1px solid rgba(0, 255, 255, 0.25)"
          >
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} flexWrap="wrap">
                <FormControl minW="220px">
                  <FormLabel color="rgba(255, 255, 255, 0.8)" fontFamily="monospace">
                    Preview Type
                  </FormLabel>
                  <Select
                    value={previewType}
                    onChange={(event) => setPreviewType(event.target.value)}
                    bg="rgba(0, 0, 0, 0.6)"
                    color="white"
                    borderColor="rgba(0, 255, 255, 0.2)"
                  >
                    {TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl minW="220px">
                  <FormLabel color="rgba(255, 255, 255, 0.8)" fontFamily="monospace">
                    Variant
                  </FormLabel>
                  <Select
                    value={previewVariant}
                    onChange={(event) => setPreviewVariant(event.target.value)}
                    bg="rgba(0, 0, 0, 0.6)"
                    color="white"
                    borderColor="rgba(0, 255, 255, 0.2)"
                  >
                    {VARIANT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <HStack spacing={3} flexWrap="wrap">
                <Button
                  onClick={fetchPreview}
                  isLoading={isLoading}
                  colorScheme="cyan"
                  variant="outline"
                  borderColor="#00FFFF"
                >
                  Reload Payload
                </Button>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  colorScheme="green"
                >
                  Open Modal
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Divider borderColor="rgba(0, 255, 255, 0.2)" />

          <Box
            bg="#0b0c0f"
            p={5}
            borderRadius="lg"
            border="1px solid rgba(0, 255, 255, 0.15)"
          >
            <Text
              mb={3}
              fontWeight="bold"
              color="#00FFFF"
              fontFamily="monospace"
            >
              Payload Preview
            </Text>
            <Text
              as="pre"
              fontSize="xs"
              color="rgba(255, 255, 255, 0.7)"
              whiteSpace="pre-wrap"
            >
              {payload ? JSON.stringify(payload, null, 2) : 'No payload loaded.'}
            </Text>
          </Box>
        </VStack>
      </Container>

      {modalContent}
    </PageTemplate>
  );
}

export default SuccessModalPreviewPage;
