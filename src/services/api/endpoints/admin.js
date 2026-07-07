import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';

const admin = {
  getSuccessModalPreview: async ({ type = 'problem', variant = 'level-up' } = {}) => {
    const params = new URLSearchParams({
      type,
      variant
    });

    logger.info('[Admin] Fetching success modal preview payload');
    logger.debug({ type, variant });

    return fetchWithError(`/api/admin/success-modal-preview?${params.toString()}`);
  }
};

export default admin;
