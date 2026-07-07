import logger from '../utils/core/logger';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SCRIPT_ID = 'codegrind-recaptcha-enterprise';
const SCRIPT_SRC = RECAPTCHA_SITE_KEY
  ? `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}&badge=bottomright`
  : '';
const EXECUTE_RETRYABLE_ERROR = 'BROWSER_ERROR';

let scriptPromise = null;

const hasBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const getEnterpriseClient = () => window.grecaptcha?.enterprise || null;

const getErrorMessage = (error, fallback) => error?.message || error?.code || fallback;

const isRetryableExecuteError = (error) => {
  const message = `${error?.message || ''} ${error?.code || ''}`;
  return message.toUpperCase().includes(EXECUTE_RETRYABLE_ERROR);
};

const isScriptLoaded = (script) =>
  script?.dataset?.recaptchaStatus === 'loaded' ||
  script?.readyState === 'complete' ||
  script?.readyState === 'loaded';

const isScriptErrored = (script) => script?.dataset?.recaptchaStatus === 'error';

export const isRecaptchaConfigured = () => Boolean(RECAPTCHA_SITE_KEY);

export const prepareRecaptcha = async () => {
  if (!hasBrowser() || !RECAPTCHA_SITE_KEY) {
    return null;
  }

  const existingClient = getEnterpriseClient();
  if (existingClient) {
    return existingClient;
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) {
        if (isScriptErrored(existingScript)) {
          reject(new Error('Failed to load reCAPTCHA'));
          return;
        }

        if (isScriptLoaded(existingScript)) {
          resolve(getEnterpriseClient());
          return;
        }

        existingScript.addEventListener('load', () => resolve(getEnterpriseClient()), {
          once: true,
        });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load reCAPTCHA')),
          {
            once: true,
          }
        );
        return;
      }

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.dataset.recaptchaStatus = 'loading';
      script.async = true;
      script.defer = true;
      script.src = SCRIPT_SRC;
      script.onload = () => {
        script.dataset.recaptchaStatus = 'loaded';
        const enterpriseClient = getEnterpriseClient();

        if (!enterpriseClient) {
          reject(new Error('reCAPTCHA loaded without enterprise client'));
          return;
        }

        resolve(enterpriseClient);
      };
      script.onerror = () => {
        script.dataset.recaptchaStatus = 'error';
        reject(new Error('Failed to load reCAPTCHA'));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      logger.warn({
        message: '[recaptcha] Failed to load enterprise script',
        reason: getErrorMessage(error, 'script-load-failed'),
        hostname: window.location?.hostname || null,
      });
      scriptPromise = null;
      throw error;
    });
  }

  return scriptPromise;
};

const executeWithEnterprise = async (enterprise, action) => {
  return new Promise((resolve, reject) => {
    enterprise.ready(async () => {
      try {
        const token = await enterprise.execute(RECAPTCHA_SITE_KEY, { action });
        resolve(token || null);
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const executeRecaptchaAction = async (action) => {
  if (!hasBrowser() || !RECAPTCHA_SITE_KEY) {
    return null;
  }

  const enterprise = await prepareRecaptcha();
  if (!enterprise) {
    return null;
  }

  try {
    return await executeWithEnterprise(enterprise, action);
  } catch (error) {
    logger.warn({
      message: '[recaptcha] Execute failed',
      action,
      reason: getErrorMessage(error, 'execute-failed'),
      hostname: window.location?.hostname || null,
    });

    if (!isRetryableExecuteError(error)) {
      throw error;
    }

    logger.info({
      message: '[recaptcha] Retrying execute after retryable browser error',
      action,
    });

    return executeWithEnterprise(enterprise, action);
  }
};

export const getRecaptchaSiteKey = () => RECAPTCHA_SITE_KEY;
