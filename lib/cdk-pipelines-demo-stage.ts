import { CfnOutput, Construct, Stage, StageProps } from "@aws-cdk/core";
import { CdkPipelinesDemoStack } from "./cdk-pipelines-demo-stack";

export class CdkPipelinesDemoStage extends Stage {
  public readonly urlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new CdkPipelinesDemoStack(this, "WebService");
    this.urlOutput = service.urlOutput;
  }
}
