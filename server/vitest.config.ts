import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Integration test files each spin up their own mongodb-memory-server
    // instance. Running them in parallel workers made multiple instances
    // race over the same cached-binary lock file on Windows, occasionally
    // starving one worker's binary resolution long enough to blow past the
    // hook timeout. Sequential execution avoids that contention entirely —
    // this suite is small enough that the wall-clock cost is negligible.
    fileParallelism: false,
  },
});
