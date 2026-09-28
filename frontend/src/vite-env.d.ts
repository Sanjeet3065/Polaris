/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_AI_SERVICE_URL?: string;
  readonly VITE_STATION_DEFAULT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
