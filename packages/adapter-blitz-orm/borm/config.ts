import type { BormConfig } from "@blitzapps/blitz-orm"

const authConfig: BormConfig = {
  server: {
    provider: "blitz-orm-js",
  },
  dbConnectors: [
    {
      id: "default",
      provider: "typeDB",
      dbName: "auth",
      url: "localhost:1729",
    },
  ],
};

export default authConfig;
