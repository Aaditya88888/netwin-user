import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not found. Using default for development.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./server/schema.ts", // Updated path since we're keeping everything in server folder
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/netwin_tournament",
  },
});
