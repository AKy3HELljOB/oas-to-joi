#!/usr/bin/env node
const { cli } = require("../dist/lib")
const OAS_FILE_PARAMETER = "--oas-file";
const OUTPUT_DIR_PARAMETER = "--output";
const UNKNOWN = "--unknown";
const ALLOWEMPTY = "--empty";
const NULLABLE = "--nullable";
const NESTED = "--nested";
const VALID_AS_EXAMPLE = "--validAsExample"
const EXTENDED_JOI_NAME_PARAMETER = "--extJoiName";
const EXTENDED_JOI_SOURCE_PARAMETER = "--extJoiSrc";

const run = async () => {
  const sourceFileParameterIndex = process.argv.indexOf(OAS_FILE_PARAMETER);
  const extendedJoiSourceParameterIndex = process.argv.indexOf(EXTENDED_JOI_SOURCE_PARAMETER);
  const extendedJoiNameParameterIndex = process.argv.indexOf(EXTENDED_JOI_NAME_PARAMETER);
  const outputDirIndex = process.argv.indexOf(OUTPUT_DIR_PARAMETER);
  const unknown = process.argv.indexOf(UNKNOWN) >= 0;
  const emptyString = process.argv.indexOf(ALLOWEMPTY) >= 0;
  const nullableString = process.argv.indexOf(NULLABLE) >= 0;
  const nested = process.argv.indexOf(NESTED) >= 0;
  const validAsExample = process.argv.indexOf(VALID_AS_EXAMPLE) >= 0;

  if (sourceFileParameterIndex > -1 && outputDirIndex > -1) {
    const sourceFileName = process.argv[sourceFileParameterIndex + 1];
    const outputDir = process.argv[outputDirIndex + 1];
    const extendedJoiSource = extendedJoiSourceParameterIndex > -1 ? process.argv[extendedJoiSourceParameterIndex + 1] : undefined;
    const extendedJoiName = extendedJoiNameParameterIndex > -1 ? process.argv[extendedJoiNameParameterIndex + 1] : undefined;

    const oasToJoi = cli({
      sourceFileName,
      outputDir,
      unknown,
      emptyString,
      nullableString,
      nested,
      validAsExample,
      extendedJoiName,
      extendedJoiSource,
    });

    await oasToJoi.dumpJoiSchemas();
   // await oasToJoi.dumpTypes();
  } else {
    console.log(
       `Usage: oas-to-joi ${OAS_FILE_PARAMETER}path_and_file_name ${OUTPUT_DIR_PARAMETER}output_path`,
    );
  }
}
run();
