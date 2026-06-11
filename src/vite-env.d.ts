interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly VITE_API_URL?: string;
  readonly API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
