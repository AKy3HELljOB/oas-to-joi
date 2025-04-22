import { Decorator } from "../decorator";
import { BaseComponent } from "../components/base.component";

type Options = {
  extendedJoiName?: string;
  format?: "date" | "date-time";
};

enum FormatToTemplateEnum {
  date = "YYYY-MM-DD",
}

export class JoiDateDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private options?: Options,
  ) {
    super(component);
  }

  public generate(): string {
    const dateFormatRules = this.getFormatSubstring();
    const joiName = dateFormatRules ? this.options.extendedJoiName : "Joi";
    const substrings = [
      this.component.generate(),
      `${joiName}.date()`,
      this.getFormatSubstring(),
    ];

    return substrings.join("");
  }

  private getFormatSubstring() {
    const format = FormatToTemplateEnum[this.options.format];

    if (!this.options.extendedJoiName || !format) {
      return "";
    }

    return `.format('${format}').raw()`;
  }
}
