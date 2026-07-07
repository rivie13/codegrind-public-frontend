import { Button, useDisclosure } from '@chakra-ui/react';
import BugReportDialog from './BugReportDialog';

function BugReportButton({
  pageType = 'other',
  pageContext = {},
  clientState = {},
  buttonLabel = 'Report Bug',
  buttonProps = {},
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onClick={onOpen} {...buttonProps}>
        {buttonLabel}
      </Button>
      <BugReportDialog
        isOpen={isOpen}
        onClose={onClose}
        pageType={pageType}
        pageContext={pageContext}
        clientState={clientState}
      />
    </>
  );
}

export default BugReportButton;
