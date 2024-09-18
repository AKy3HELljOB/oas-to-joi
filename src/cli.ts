import { OasToJoi } from "./oas-to-joi";
import { Options } from "./types/options.type";

export const cli = (options: Options) => new OasToJoi(options);
