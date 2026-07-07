import { Select } from '@chakra-ui/react';

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
];

const LanguageSelector = ({
  language,
  onLanguageChange,
  isDisabled = false,
  allowedLanguages = null,
}) => {
  const normalizedAllowed = Array.isArray(allowedLanguages)
    ? allowedLanguages.map((lang) => lang.toLowerCase())
    : null;
  const options = normalizedAllowed?.length
    ? LANGUAGE_OPTIONS.filter((option) => normalizedAllowed.includes(option.value))
    : LANGUAGE_OPTIONS;

  return (
    <Select
      value={language}
      onChange={(e) => onLanguageChange(e.target.value)}
      isDisabled={isDisabled}
      bg="var(--cg-window)"
      color="var(--cg-text)"
      borderColor="var(--cg-window-shadow)"
      borderWidth="1px"
      fontFamily="var(--cg-font-retro-display)"
      fontSize="sm"
      letterSpacing="0.05em"
      height="40px"
      width="150px"
      mr={2}
      _hover={{
        borderColor: 'var(--cg-window-shadow)',
        bg: 'var(--cg-panel-shell)',
      }}
      _focus={{
        borderColor: 'var(--cg-window-shadow)',
        boxShadow: 'var(--cg-window-inset)',
      }}
      _disabled={{
        opacity: 0.6,
        cursor: 'not-allowed',
        boxShadow: 'none',
      }}
      sx={{
        boxShadow: 'var(--cg-window-outset)',
        '& option': {
          background: 'var(--cg-window)',
          color: 'var(--cg-text)',
          fontSize: '14px',
          padding: '10px',
        },
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
};

export default LanguageSelector;
