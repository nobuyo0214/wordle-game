import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4173",
    launchOptions:
      process.env.CHROMIUM_PATH || existsSync("/usr/bin/chromium")
        ? { executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" }
        : {},
  },
  webServer: {
    command: "npm start",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
