import "dotenv/config";

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  },
});
