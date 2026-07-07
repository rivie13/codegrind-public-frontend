import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  ListItem,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import React from 'react';

const ProfileHeaderDialogs = ({
  isPublicView,
  isDeleteOpen,
  cancelRef,
  onDeleteClose,
  handleConfirmDelete,
  isDeleting,
  isUnlinkOpen,
  unlinkCancelRef,
  onUnlinkClose,
  handleConfirmUnlink,
  isUnlinking,
}) => (
  <>
    {!isPublicView && (
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            bg="var(--cg-window)"
            border="2px solid var(--cg-window-shadow)"
            color="var(--cg-text)"
          >
            <AlertDialogHeader
              fontFamily="var(--cg-font-retro-display)"
              color="var(--cg-header-text)"
            >
              Delete account permanently?
            </AlertDialogHeader>
            <AlertDialogBody fontFamily="var(--cg-font-retro-display)" fontSize="sm">
              This action cannot be undone. Deleting your account removes:
              <UnorderedList mt={3} spacing={1} color="var(--cg-text)">
                <ListItem>Profile data, stats, achievements, and activity history</ListItem>
                <ListItem>Submissions, scores, and progress</ListItem>
                <ListItem>Usage/rate-limit records and sessions</ListItem>
                <ListItem>Discord links, challenges, and tournament participation</ListItem>
              </UnorderedList>
              <Text mt={3} color="var(--cg-muted)">
                Created problems are retained but no longer linked to your account.
              </Text>
              <Text mt={3} color="var(--cg-text)">
                If you have an active subscription, we will cancel it immediately and issue a
                prorated refund through Stripe back to your original payment method (when eligible).
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                ml={3}
                color="var(--cg-accent-red)"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                loadingText="Deleting"
              >
                Delete account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    )}

    {!isPublicView && (
      <AlertDialog
        isOpen={isUnlinkOpen}
        leastDestructiveRef={unlinkCancelRef}
        onClose={onUnlinkClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            bg="var(--cg-window)"
            border="2px solid var(--cg-window-shadow)"
            color="var(--cg-text)"
          >
            <AlertDialogHeader
              fontFamily="var(--cg-font-retro-display)"
              color="var(--cg-header-text)"
            >
              Unlink Discord?
            </AlertDialogHeader>
            <AlertDialogBody fontFamily="var(--cg-font-retro-display)" fontSize="sm">
              This will disconnect your Discord account from CodeGrind. You can relink at any time.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={unlinkCancelRef} onClick={onUnlinkClose}>
                Cancel
              </Button>
              <Button
                ml={3}
                color="var(--cg-accent-amber)"
                onClick={handleConfirmUnlink}
                isLoading={isUnlinking}
                loadingText="Unlinking"
              >
                Unlink Discord
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    )}
  </>
);

export default ProfileHeaderDialogs;
