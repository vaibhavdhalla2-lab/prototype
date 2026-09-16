/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Deployed Google Apps Script web app URL that appends feedback rows to the Sheet. */
  readonly VITE_FEEDBACK_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
