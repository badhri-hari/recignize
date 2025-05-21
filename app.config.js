import "dotenv/config";

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    REACT_NATIVE_BACKEND_URL: process.env.REACT_NATIVE_BACKEND_URL,
  },
});
