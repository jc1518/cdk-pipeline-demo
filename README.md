# CDK Pipelines Demo

This is a demo project for sharing how to use CDK to create pipelines and deploy applications.

## Overview

In the demo project, we have two AWS account A and B. We will use CDK to create a CodePipeline in account A, and use it to deploy a simple web application (API Gateway + Lambda). There are two deployment stages: PreProd and Prod.

- Source code on GitHub Enterprise
- AWS account A (Pipeline, PreProd)
- AWS account B (Prod)

## Workshop

1.  Clone the project

    ```
    git clone https://github.com/jc1518/cdk-pipeline-demo.git
    ```

2.  Install package

    ```
    cd cdk-pipelines-demo && npm ci
    ```

3.  Setup CDK bootstrap resources in both accounts.

    - Configure account A AWS credential environment variables first, then run the following script (Note: You can remove `--public-access-block-configuration false` from following command if your company policy allows `s3:PutPublicAccessBlock`).

      ```
      npx cdk bootstrap \
          --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
          --public-access-block-configuration false \
          aws://${account-a-id}/${account-a-region}
      ```

    - Configure account B AWS credential environment variables first, then run the following script (Note: You can remove `--public-access-block-configuration false` from following command if your company policy allows `s3:PutPublicAccessBlock`).

      ```
      npx cdk bootstrap \
          --trust ${account-a-id} \
          --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
          --public-access-block-configuration false \
          aws://${account-b-id}/${account-b-region}
      ```

4.  Customize your environment.

    Update `config.json` file with your environment information. Here is a sample:

    ```
    {
        "ACCOUNT_A_ID": "111111111111",
        "ACCOUNT_A_REGION": "ap-southeast-2",
        "GHE_REPO": "my-org/cdk-pipelines-demo",
        "GHE_BRANCH": "demo",
        "GHE_CODESTART_CONNECTION": "arn:aws:codestar-connections:ap-southeast-2:111111111111:connection/f16b0b08-7c88-428b-b757-xxxxxxxxxxxx",
        "ACCOUNT_B_ID": "222222222222",
        "ACCOUNT_B_REGION": "ap-southeast-2"
    }
    ```

5.  Create the pipeline. This is only required for the first time, the pipeline will self-mutate in the future whenever there new changes are commited.

    - If your company policy denies `s3:PutPublicAccessBlock`, you need to run the following script first. This is regarding the [issue](https://github.com/aws/aws-cdk/issues/17177). Otherwise, just skip this one.

      `npx ts-node lib/workaround.ts`

    - Configure account A AWS credential environment variables first, then create the pipeline.

      `npx cdk deploy CdkPipelinesDemoPipelineStack`

6.  Check the output tab of CloudFormation stack (PreProd-WebService in account A, Prod-WebService in account B). Test the URL in browser to see if you can see the message `"Hello from CDK pipeline demo Lambda Function"`.

7.  Make some code changes, then commit and push to the GitHub Enterprise repository. It will automatically trigger the pipeline to mutate itself first, then deploy the application. For example, you can try the following two changes:

    - Change the Lambda response code to `500` in [handler.ts](./lib/lambda/handler.ts).
    - Comment out the `Prod` stage codes in [cdk-pipelines-demo-pipeline-stack.ts](./lib/cdk-pipelines-demo-pipeline-stack.ts).

      ```
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
      ```

8.  Cleanup the environments. Go to account A and B, then delete the following stacks:

    - CdkPipelinesDemoPipelineStack
    - (PreProd/Prod)-WebService
    - CDKToolkit

## References

- [aws/aws-cdk Github](https://github.com/aws/aws-cdk)
- [@aws-cdk/pipelines module](https://docs.aws.amazon.com/cdk/api/latest/docs/pipelines-readme.html)
- [CDK Pipelines: Continuous delivery for AWS CDK applications](https://aws.amazon.com/blogs/developer/cdk-pipelines-continuous-delivery-for-aws-cdk-applications/)
