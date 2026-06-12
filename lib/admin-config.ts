export const ADMIN_EMAILS = [
  "opusgenai.official@gmail.com",
  "miftahurr503@gmail.com",
] as const;

export type BannerMode =
  | "normal"
  | "maintenance"
  | "coming_soon"
  | "new_version"
  | "custom";

export interface BannerConfig {
  mode: BannerMode;
  message: string;
  versionLabel: string;
}

export interface WelcomeConfig {
  useDefault: boolean;
  message: string;
}

export const DEFAULT_BANNER: BannerConfig = {
  mode: "normal",
  message: "",
  versionLabel: "",
};

export const DEFAULT_WELCOME: WelcomeConfig = {
  useDefault: true,
  message: "Welcome back! Ready to create something amazing?",
};

export const BANNER_KEY = "opusgenai_banner";
export const WELCOME_KEY = "opusgenai_welcome";
export const ADMIN_SESSION_KEY = "opusgenai_admin_session";
