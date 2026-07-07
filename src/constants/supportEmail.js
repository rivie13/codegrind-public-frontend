export const SUPPORT_EMAILS = Object.freeze({
  info: 'info@codegrind.online',
  billing: 'billing@codegrind.online',
  bugReport: 'bug-report@codegrind.online',
  admin: 'admin@codegrind.online',
});

export const getSupportEmail = (kind = 'info') => SUPPORT_EMAILS[kind] || SUPPORT_EMAILS.info;

export default SUPPORT_EMAILS;
