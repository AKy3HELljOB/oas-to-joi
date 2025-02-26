import { OasToJoi } from "./oas-to-joi";

const start = async () => {
  const oasFilePath = `${__dirname}/../openapi-example.yaml`;
  const outputDirPath = `${__dirname}/../dist/tmp`;
  const oasToJoi = new OasToJoi({
    sourceFileName: oasFilePath,
    outputDir: outputDirPath,
    unknown: true,
    emptyString: true,
    validAsExample: true,
    nullableString: true,
    nested: false,
  });
  await oasToJoi.dumpJoiSchemas();
  // await oasToJoi.dumpTypes();
};

start();
