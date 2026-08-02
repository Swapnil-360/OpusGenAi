export const DEFAULT_NOTIFICATION_PREFS = {
  generationDone: true,
  billing: true,
  tips: false,
  newsletter: false,
};

export type NotificationPrefs = typeof DEFAULT_NOTIFICATION_PREFS;

// Below this many credits remaining, a "billing" notification (if enabled)
// nudges the user to upgrade instead of running out mid-session.
export const LOW_CREDIT_THRESHOLD = 2;
