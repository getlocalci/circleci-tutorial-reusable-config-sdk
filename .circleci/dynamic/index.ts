import { createConfig, createPhpTestJobs, JobNames } from "@getlocalci/create-config";

createConfig(
  ...createPhpTestJobs("7.3", "7.4", "8.0", "8.1"),
  JobNames.PhpLint,
  JobNames.JsTest,
  JobNames.JsLint,
  JobNames.E2eTest
);
