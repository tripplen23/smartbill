export default () => ({
  nodeEnv: process.env.NODE_ENV,
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  databaseUrl: process.env.DATABASE_URL,
  popplerBinariesPath: process.env.POPPLER_BIN_PATH,
  openaiApiKey: process.env.OPENAI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  logLevel: process.env.LOG_LEVEL?.split(',').map((l) => l.trim()) || [
    'log',
    'warn',
    'error',
  ],
});
