import "dotenv/config";

export default {
  expo: {
    name: "Recignize",
    slug: "recignize",
    version: "1.0.0",
    extra: {
      REACT_NATIVE_BACKEND_URL: process.env.REACT_NATIVE_BACKEND_URL,
    },
  },
};
