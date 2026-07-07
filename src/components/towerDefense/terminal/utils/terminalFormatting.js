export const formatResponsiveASCII = (line, isSmallScreen) => {
  if (!isSmallScreen || (!line.includes('█') && !line.includes('═') && !line.includes('╗'))) {
    return line;
  }

  if (line.length > 60) {
    return line.substring(0, Math.min(60, line.length));
  }

  return line;
};

export const getLineClassName = (line) => {
  let className = 'terminal-line';

  if (line.includes('[SYSTEM]')) className += ' system-message';
  else if (line.includes('[KERNEL]')) className += ' kernel-message';
  else if (line.includes('[ALERT]')) className += ' alert-message';
  else if (line.includes('[BREACH]')) className += ' breach-message';
  else if (line.includes('[SUCCESS]')) className += ' success-message';
  else if (line.includes('[CRITICAL]')) className += ' critical-message';
  else if (line.includes('[MODULE]')) className += ' module-message';
  else if (line.includes('[UPGRADE]')) className += ' upgrade-message';
  else if (line.includes('[SECURITY]')) className += ' security-message';
  else if (line.includes('[VERIFY]') || line.includes('[VERIFICATION]'))
    className += ' verify-message';
  else if (line.includes('[FAILURE]') || line.includes('[WARNING]'))
    className += ' warning-message';
  else if (line.includes('[PROTOCOL]') || line.includes('[COMPILE]'))
    className += ' protocol-message';
  else if (line.includes('[ANALYTICS]')) className += ' analytics-message';
  else if (line.includes('[INTEL]')) className += ' intel-message';
  else if (line.includes('[VERIF-SUCCESS]')) className += ' ascii-success';
  else if (line.includes('[VERIF-FAIL]')) className += ' ascii-fail';
  else if (line.includes('███') || line.includes('██╗') || line.includes('╚══'))
    className += ' ascii-art';

  return className;
};
