import * as fs from "fs";
import CircleCI from "@circleci/circleci-config-sdk";

const config = new CircleCI.Config();
const workflow = new CircleCI.Workflow("test-lint");
config.addWorkflow(workflow);

const orbManifest: CircleCI.types.orb.OrbImportManifest = {
  jobs: {},
  commands: {
    "install-packages": new CircleCI.parameters.CustomParametersList(),
  },
  executors: {},
};

const nodeOrb = new CircleCI.orb.OrbImport(
  "node",
  "circleci",
  "node",
  "5.0",
  undefined,
  orbManifest
);
const phpOrb = new CircleCI.orb.OrbImport(
  "php",
  "circleci",
  "php",
  "1.1",
  undefined,
  orbManifest
);

config.importOrb(nodeOrb).importOrb(phpOrb);

function createPhpTestJobs(...phpVersions: string[]) {
  return phpVersions.map((phpVersion) => {
    return new CircleCI.Job(
      "php-test",
      new CircleCI.executors.DockerExecutor(`cimg/php:${phpVersion}`),
      [
        new CircleCI.commands.Checkout(),
        new CircleCI.commands.Run({ command: "composer i && composer test" }),
      ]
    );
  });
}

const phpVersionParameterName = "php-version-number";
[
  new CircleCI.Job(
    "js-build",
    new CircleCI.executors.DockerExecutor("cimg/node:14.18"),
    [
      new CircleCI.commands.Checkout(),
      new CircleCI.reusable.ReusedCommand(nodeOrb.commands["install-packages"]),
      new CircleCI.commands.Run({
        name: "Running JS linting and unit test",
        command: `npm run lint:js \n npm run test:js`,
      }),
    ]
  ),
  new CircleCI.Job(
    "php-lint",
    new CircleCI.executors.DockerExecutor("cimg/php:8.1"),
    [
      new CircleCI.commands.Checkout(),
      new CircleCI.reusable.ReusedCommand(phpOrb.commands["install-packages"]),
      new CircleCI.commands.Run({ command: "composer lint" }),
    ]
  ),
  ...createPhpTestJobs("7.3", "7.4", "8.0", "8.1"),
  new CircleCI.Job(
    "e2e-test",
    new CircleCI.executors.MachineExecutor("large", "ubuntu-2004:202111-02"),
    [
      new CircleCI.commands.Checkout(),
      new CircleCI.reusable.ReusedCommand(nodeOrb.commands["install-packages"]),
      new CircleCI.commands.Run({
        name: "Running e2e tests",
        command: "npm run wp-env start && npm run test:e2e",
      }),
      new CircleCI.commands.StoreArtifacts({ path: "artifacts" }),
    ]
  ),
].forEach((job) => {
  config.addJob(job);
  workflow.addJob(job);
});

fs.writeFile("./dynamicConfig.yml", config.stringify(), () => {});
