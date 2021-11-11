#!/usr/bin/env node
import { App } from "@aws-cdk/core";
import { CdkPipelinesDemoPipelineStack } from "../lib/cdk-pipelines-demo-pipeline-stack";
import * as config from "../config.json";

const app = new App();

new CdkPipelinesDemoPipelineStack(app, "CdkPipelinesDemoPipelineStack", {
  env: {
    account: config.ACCOUNT_A_ID,
    region: config.ACCOUNT_A_REGION,
  },
});

app.synth();
