import { createConfig, createPhpTestJobs, JobNames } from "@getlocalci/create-config";

createConfig(
  ...createPhpTestJobs("7.3", "7.4", "8.0", "8.1"),
  JobNames.PhpLint,
  JobNames.JsLint,
  JobNames.JsTest,
  JobNames.E2eTest
);
