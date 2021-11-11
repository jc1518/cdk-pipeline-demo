/**
 * Workaround for the issue
 * https://github.com/aws/aws-cdk/issues/17177
 */

import * as fs from "fs";

fs.readFile(
  "node_modules/@aws-cdk/aws-codepipeline/lib/pipeline.js",
  "utf-8",
  function (err, data) {
    if (err) throw err;

    const newValue = data.replace("blockPublicAccess", "//blockPublicAccess");

    fs.writeFile(
      "node_modules/@aws-cdk/aws-codepipeline/lib/pipeline.js",
      newValue,
      "utf-8",
      function (err) {
        if (err) throw err;
        console.log("Done!");
      }
    );
  }
);
