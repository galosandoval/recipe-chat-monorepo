import type { Config } from "drizzle-kit";
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export default {
  schema: "./src/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  out: "migrations",
  tablesFilter: ["recipe-chat_*"],
} satisfies Config;
