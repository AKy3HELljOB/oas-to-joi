#!/usr/bin/env node
const { cli } = require("../dist/lib")
const OAS_FILE_PARAMETER = "--oas-file";
const OUTPUT_DIR_PARAMETER = "--output";
const UNKNOWN = "--unknown";
const ALLOWEMPTY = "--empty";
const NULLABLE = "--nullable";
const NESTED = "--nested";
const VALID_AS_EXAMPLE = "--validAsExample"

const run = async () => {
  const sourceFileParameterIndex = process.argv.indexOf(OAS_FILE_PARAMETER);
  const outputDirIndex = process.argv.indexOf(OUTPUT_DIR_PARAMETER);
  const unknown = process.argv.indexOf(UNKNOWN) >= 0;
  const emptyString = process.argv.indexOf(ALLOWEMPTY) >= 0;
  const nullableString = process.argv.indexOf(NULLABLE) >= 0;
  const nested = process.argv.indexOf(NESTED) >= 0;
  const validAsExample = process.argv.indexOf(VALID_AS_EXAMPLE) >= 0;

  if (sourceFileParameterIndex > -1 && outputDirIndex > -1) {
    const sourceFileName = process.argv[sourceFileParameterIndex + 1];
    const outputDir = process.argv[outputDirIndex + 1];
    const oasToJoi = cli({ sourceFileName, outputDir, unknown, emptyString, nullableString, nested, validAsExample });

    await oasToJoi.dumpJoiSchemas();
   // await oasToJoi.dumpTypes();
  } else {
    console.log(
       `Usage: oas-to-joi ${OAS_FILE_PARAMETER}path_and_file_name ${OUTPUT_DIR_PARAMETER}output_path`,
    );
  }
}
run();
