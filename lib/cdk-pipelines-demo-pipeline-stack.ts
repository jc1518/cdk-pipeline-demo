import { Construct, Stack, StackProps } from "@aws-cdk/core";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "@aws-cdk/pipelines";
import { CdkPipelinesDemoStage } from "./cdk-pipelines-demo-stage";
import * as config from "../config.json";

export class CdkPipelinesDemoPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "MyServicePipeline",
      crossAccountKeys: true,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(
          config.GHE_REPO!,
          config.GHE_BRANCH!,
          {
            connectionArn: config.GHE_CODESTART_CONNECTION!,
          }
        ),
        commands: [
          "node --version",
          "npm ci",
          "npx tsc --version",
          "npx cdk --version",
          "npx ts-node lib/workaround.ts",
          "npx tsc",
          "npx cdk synth --verbose",
        ],
      }),
    });

    const preProdStage = new CdkPipelinesDemoStage(this, "PreProd", {
      env: {
        account: config.ACCOUNT_A_ID,
        region: config.ACCOUNT_A_REGION,
      },
    });

    pipeline.addStage(preProdStage, {
      post: [
        new ShellStep("Test", {
          commands: [
            'echo "URL is $ENDPOINT_URL"',
            'responseCode=`curl -s -o /dev/null -w "%{http_code}" $ENDPOINT_URL`',
            'if [ $responseCode = 200 ]; then echo "PASS - $responseCode"; else echo "FAIL - $responseCode"; exit 1; fi',
          ],
          envFromCfnOutputs: {
            ENDPOINT_URL: preProdStage.urlOutput,
          },
        }),
      ],
    });

    const prodStage = new CdkPipelinesDemoStage(this, "Prod", {
      env: {
        account: config.ACCOUNT_B_ID,
        region: config.ACCOUNT_B_REGION,
      },
    });

    pipeline.addStage(prodStage, {
      pre: [
        new ShellStep("RaiseChange", {
          commands: ['echo "Lets pretend to raise a change here..."'],
        }),
      ],
      post: [
        new ShellStep("CloseChange", {
          commands: [
            'echo "URL is $ENDPOINT_URL"',
            'responseCode=`curl -s -o /dev/null -w "%{http_code}" $ENDPOINT_URL`',
            'if [ $responseCode = 200 ]; then echo "PASS - $responseCode"; else echo "FAIL - $responseCode"; exit 1; fi',
            'echo "Lets pretend to close the change here..."',
          ],
          envFromCfnOutputs: {
            ENDPOINT_URL: prodStage.urlOutput,
          },
        }),
      ],
    });
  }
}
