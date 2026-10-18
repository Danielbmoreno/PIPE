// Email recovery stays unavailable until the deployment explicitly enables it.
export const emailRecoveryEnabled = import.meta.env?.VITE_PIPE_EMAIL_RECOVERY_ENABLED === 'true';
