import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

const REGEX_PATTERN_WORD = "pattern";
type options = {
  empty?: boolean;
  nullable?: boolean;
  format?:
    | "default"
    | "email"
    | "uuid"
    | "uri"
    | "hostname"
    | "ipv4"
    | "ipv6"
    | "byte";
  min?: number;
  max?: number;
  [REGEX_PATTERN_WORD]?: string;
};

export class JoiStringDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private options?: options,
  ) {
    super(component);
  }

  protected getStringSubType() {
    switch (this.options?.format) {
      case "email":
        return ".email()";
      case "uuid":
        return ".guid()";
      case "hostname":
        return ".hostname()";
      case "uri":
        return ".uri()";
      case "byte":
        return ".base64()";
      case "ipv4":
        return `.ip({ version: ["ipv4"], cidr: "optional" })`;
      case "ipv6":
        return `.ip({ version: ["ipv6"], cidr: "optional" })`;
      default:
        return "";
    }
  }

  protected parseRegexPattern(value: string): string {
    return `/${value}/`;
  }

  protected setAdditionalOptionValue(key: string, value: string | number) {
    return `${key === REGEX_PATTERN_WORD ? this.parseRegexPattern(value.toString()) : value}`;
  }

  protected applyAditionalOptions(): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { format, empty, nullable, ...validations } = this.options;
    const options = Object.entries(validations).map(([key, value]) => {
      if (value) return `.${key}(${this.setAdditionalOptionValue(key, value)})`;
    });
    return options.join("");
  }

  getAllowedValues() {
    const values = [
      ...(this.options.empty ? ["''"] : []),
      ...(this.options.nullable ? [`null`] : []),
    ];
    return values.length ? `.allow(${values.join(",")})` : "";
  }

  public generate(): string {
    const substrings = [
      this.component.generate(),
      "Joi.string()",
      this.getStringSubType(),
      this.getAllowedValues(),
      this.applyAditionalOptions(),
    ];
    return substrings.join("");
  }
}
