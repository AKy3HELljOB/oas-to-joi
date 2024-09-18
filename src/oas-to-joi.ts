import { JoiBuilder } from "./builders/joi.builder";
import { ParsersEnum } from "./enums/parsers.enum";
import { Options } from "./types/options.type";
import { ParserFactory } from "./parsers/parser.factory";
import { IBuilder } from "./interfaces/builder.interface";
import { TypeScriptBuilder } from "./builders/ts.builder";
import { Utils } from "./utils";
import OpenAPIParser from "@readme/openapi-parser";

export class OasToJoi {
  protected joiBuilder: IBuilder;
  protected typesBuilder: IBuilder;

  constructor(private options: Options) {
    const parser = ParserFactory.getParser({
      type: ParsersEnum.YAML,
      config: {
        sourceFileName: options.sourceFileName,
      },
    });

    this.joiBuilder = new JoiBuilder(parser, options);
    this.typesBuilder = new TypeScriptBuilder(parser, options);
  }

  async dumpJoiSchemas() {
    try {
      Utils.consoleTitleMessage("Dumping Joi Files ✨");
      await this.validate(this.options.sourceFileName);
      const totalFiles = await this.joiBuilder.dump();
      Utils.consoleMessage({ message: `Done (${totalFiles}) Files` });
    } catch (error) {
      Utils.consoleMessage({ message: error.message });
    }
  }

  async dumpTypes() {
    try {
      Utils.consoleTitleMessage("Dumping TypeScript Files ✨");
      await this.validate(this.options.sourceFileName);
      const totalFiles = await this.typesBuilder.dump();
      Utils.consoleMessage({ message: `Done (${totalFiles}) Files` });
    } catch (error) {
      Utils.consoleMessage({ message: error.message });
    }
  }

  private async validate(oasDocPath: string): Promise<void> {
    Utils.consoleTitleMessage(`Validating Open API Specifications`);
    const {
      info: { title, version },
    } = await OpenAPIParser.validate(oasDocPath);
    Utils.consoleMessage({
      message: `Validation OK:\nAPI name: ${title}, Version:${version}`,
      underline: true,
    });
  }
}
