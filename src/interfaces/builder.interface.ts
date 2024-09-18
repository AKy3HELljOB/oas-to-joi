import { OpenAPIV3 } from "openapi-types";
import { IParser } from "./parser.interface";
import { Options } from "../types/options.type";

export interface IBuilder {
  readonly data: OpenAPIV3.Document;
  readonly parser: IParser;
  readonly outputDir: string;
  readonly options: Options;
  dump: () => Promise<number>;
}
