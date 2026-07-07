import { InfoIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React from 'react';

const modalTabProps = {
  px: 3,
  py: 2,
  fontSize: 'xs',
  fontWeight: '700',
  color: 'var(--cg-text)',
  bg: 'var(--cg-panel-shell)',
  border: '2px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-outset)',
  borderRadius: '0',
  fontFamily: 'var(--cg-font-retro-display)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  _selected: {
    color: 'var(--cg-header-text)',
    bg: 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))',
    boxShadow: 'var(--cg-window-inset)',
  },
  _hover: {
    bg: 'rgba(255,255,255,0.18)',
  },
};

const labelProps = {
  color: 'var(--cg-link)',
  fontSize: 'xs',
  fontFamily: 'var(--cg-font-retro-display)',
  mb: 2,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const helperProps = {
  color: 'var(--cg-muted)',
  fontSize: 'xs',
  mt: 1,
  fontFamily: 'var(--cg-font-retro-display)',
  lineHeight: '1.5',
};

const passwordRequirements = [
  'At least 8 characters',
  'At least one uppercase letter',
  'At least one lowercase letter',
  'At least one number',
  'At least one special character',
];

const ProfileEditModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleUpdateProfile,
  error,
  isLoading,
  passwordErrors,
  passwordMatchError,
  avatarError,
  avatarLoading,
  userData,
}) => {
  const isGoogleUser = userData?.googleId != null;
  const hasPassword = userData?.hasPassword === true;
  const isGoogleWithoutPassword = isGoogleUser && !hasPassword;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="var(--cg-window-face)"
        border="2px solid var(--cg-window-shadow)"
        boxShadow="var(--cg-window-outset), 18px 18px 0 rgba(0,0,0,0.24)"
        borderRadius="0"
        overflow="hidden"
        mx={4}
      >
        <ModalHeader
          bg="linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))"
          color="var(--cg-header-text)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          textTransform="uppercase"
          letterSpacing="0.08em"
          borderBottom="1px solid var(--cg-window-shadow)"
          py={2}
          px={4}
        >
          edit_profile.exe
        </ModalHeader>

        <ModalCloseButton
          color="var(--cg-header-text)"
          border="1px solid rgba(255,255,255,0.35)"
          borderRadius="0"
          boxShadow="var(--cg-window-outset)"
          top={2}
          right={2}
          _focusVisible={{
            boxShadow: 'var(--cg-window-inset)',
          }}
          _hover={{
            bg: 'rgba(255,255,255,0.18)',
          }}
        />

        <form onSubmit={handleUpdateProfile}>
          <ModalBody bg="rgba(255,255,255,0.14)" px={{ base: 4, md: 5 }} py={5}>
            {error && (
              <Alert
                status="error"
                mb={4}
                bg="rgba(135, 28, 28, 0.16)"
                border="1px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-inset)"
                borderRadius="0"
              >
                <AlertIcon color="var(--cg-accent-red)" />
                <Text
                  color="var(--cg-accent-red)"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="sm"
                >
                  {error}
                </Text>
              </Alert>
            )}

            <Tabs variant="unstyled" mt={2}>
              <TabList gap={2} flexWrap="wrap" mb={4}>
                <Tab {...modalTabProps}>PROFILE</Tab>
                <Tab {...modalTabProps}>
                  {isGoogleWithoutPassword ? 'SET PASSWORD' : 'PASSWORD'}
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  <VStack spacing={5} py={2}>
                    <FormControl>
                      <FormLabel {...labelProps}>USERNAME</FormLabel>
                      <Input
                        value={formData.username}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>EMAIL</FormLabel>
                      <Input
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                      <FormHelperText
                        color="var(--cg-accent-red)"
                        fontSize="xs"
                        mt={1}
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {isGoogleWithoutPassword && (
                          <Box mb={1}>You must set a password before changing your email.</Box>
                        )}
                        Changing email {!isGoogleUser && 'requires your password and '}will log you
                        out.
                      </FormHelperText>
                    </FormControl>

                    {/* Show password field if email is being changed (only for non-Google users) */}
                    {!isGoogleUser && formData.email !== userData?.email && (
                      <FormControl>
                        <FormLabel {...labelProps} color="var(--cg-accent-amber)">
                          PASSWORD (Required for Email Change)
                        </FormLabel>
                        <Input
                          type="password"
                          placeholder="Enter your current password"
                          value={formData.currentPassword || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                        />
                        <FormHelperText
                          color="var(--cg-accent-amber)"
                          fontSize="xs"
                          mt={1}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          Required to confirm email change
                        </FormHelperText>
                      </FormControl>
                    )}

                    <FormControl>
                      <FormLabel {...labelProps}>BIO</FormLabel>
                      <Input
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps} display="flex" alignItems="center">
                        AVATAR URL
                        <Tooltip
                          label="Use direct image URLs that end with .jpg, .png, or .gif. Try imgur.com or postimages.org for reliable hosting. GitHub and other CDN image links also work well."
                          placement="top"
                          hasArrow
                          bg="var(--cg-window-face)"
                          color="var(--cg-text)"
                          border="1px solid var(--cg-window-shadow)"
                          fontSize="xs"
                        >
                          <InfoIcon ml={2} color="var(--cg-link)" fontSize="xs" />
                        </Tooltip>
                      </FormLabel>
                      <Input
                        value={formData.avatarUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            avatarUrl: e.target.value,
                          }))
                        }
                        borderColor={avatarError ? 'var(--cg-accent-red)' : undefined}
                        placeholder="https://example.com/avatar.jpg"
                      />
                      {avatarError && (
                        <Text
                          color="var(--cg-accent-red)"
                          fontSize="xs"
                          mt={1}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {typeof avatarError === 'string'
                            ? avatarError
                            : 'Unable to load this image. Try another URL.'}
                        </Text>
                      )}
                      {avatarLoading && (
                        <Text
                          color="var(--cg-muted)"
                          fontSize="xs"
                          mt={1}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          Testing image URL...
                        </Text>
                      )}
                      {formData.avatarUrl && !avatarError && !avatarLoading && (
                        <Text
                          color="var(--cg-accent-green)"
                          fontSize="xs"
                          mt={1}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          Image validated successfully ✓
                        </Text>
                      )}
                      <FormHelperText {...helperProps}>
                        For best results, use imgur.com or postimages.org and copy the direct image
                        URL (.jpg/.png/.gif) Right click on the image and select "Copy image
                        address".
                      </FormHelperText>
                    </FormControl>
                  </VStack>
                </TabPanel>

                <TabPanel p={0}>
                  <VStack spacing={5} py={2}>
                    {/* Warning for Google users without password */}
                    {isGoogleWithoutPassword && (
                      <Alert
                        status="info"
                        bg="rgba(10, 56, 154, 0.14)"
                        border="1px solid var(--cg-window-shadow)"
                        boxShadow="var(--cg-window-inset)"
                        borderRadius="0"
                      >
                        <AlertIcon color="var(--cg-link)" />
                        <VStack align="start" spacing={1}>
                          <Text
                            color="var(--cg-link)"
                            fontFamily="var(--cg-font-retro-display)"
                            fontSize="sm"
                            fontWeight="bold"
                          >
                            Set a Password for Account Security
                          </Text>
                          <Text
                            color="var(--cg-text)"
                            fontFamily="var(--cg-font-retro-display)"
                            fontSize="xs"
                            lineHeight="1.5"
                          >
                            You're currently using Google to sign in. Setting a password ensures you
                            can still access your account if Google sign-in becomes unavailable, and
                            is required before changing your email address.
                          </Text>
                        </VStack>
                      </Alert>
                    )}

                    {/* Current password field - only show for users who already have a password */}
                    {!isGoogleWithoutPassword && (
                      <FormControl>
                        <FormLabel {...labelProps}>CURRENT PASSWORD</FormLabel>
                        <Input
                          type="password"
                          value={formData.currentPassword || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                        />
                      </FormControl>
                    )}

                    <FormControl>
                      <FormLabel {...labelProps}>NEW PASSWORD</FormLabel>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        value={formData.newPassword || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                      />
                      {passwordErrors?.newPassword && (
                        <Text
                          color="var(--cg-accent-red)"
                          fontSize="xs"
                          mt={1}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {passwordErrors.newPassword}
                        </Text>
                      )}
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>CONFIRM NEW PASSWORD</FormLabel>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={formData.confirmNewPassword || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            confirmNewPassword: e.target.value,
                          }))
                        }
                      />
                      {passwordMatchError && (
                        <Text
                          color="var(--cg-accent-red)"
                          fontSize="xs"
                          mt={1}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {passwordMatchError}
                        </Text>
                      )}
                      {passwordErrors?.confirmNewPassword && (
                        <Text
                          color="var(--cg-accent-red)"
                          fontSize="xs"
                          mt={1}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {passwordErrors.confirmNewPassword}
                        </Text>
                      )}
                    </FormControl>

                    <Box
                      mt={2}
                      width="100%"
                      bg="var(--cg-panel-shell)"
                      border="1px solid var(--cg-window-shadow)"
                      boxShadow="var(--cg-window-inset)"
                      p={4}
                    >
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                        mb={2}
                        textTransform="uppercase"
                      >
                        Password requirements:
                      </Text>
                      <List
                        spacing={1}
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                        color="var(--cg-text)"
                      >
                        {passwordRequirements.map((item) => (
                          <ListItem key={item}>- {item}</ListItem>
                        ))}
                      </List>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter borderTop="1px solid var(--cg-window-dark)" bg="rgba(255,255,255,0.08)">
            <Button mr={3} variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="var(--cg-link)" isLoading={isLoading} loadingText="Saving">
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ProfileEditModal;
