import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiValidExampleDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private values: Array<string | number | boolean>,
  ) {
    super(component);
  }

  protected getExamples(): string {
    return this.values
      .map(
        (item) =>
          `.example(${typeof item === "string" ? `"${item}"` : `${item}`})`,
      )
      .join("");
  }

  public generate(): string {
    const validValues = this.getExamples();
    return `${this.component.generate()}${validValues}`;
  }
}
