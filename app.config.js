import "dotenv/config";

export default {
  expo: {
    name: "Recignize",
    slug: "recignize",
    version: "1.0.0",
    updates: {
      url: "https://u.expo.dev/9574ac96-ff47-4326-8e0c-028ffe7d9a10",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      REACT_NATIVE_BACKEND_URL: process.env.REACT_NATIVE_BACKEND_URL,
      eas: {
        projectId: "9574ac96-ff47-4326-8e0c-028ffe7d9a10",
      },
    },
  },
};
