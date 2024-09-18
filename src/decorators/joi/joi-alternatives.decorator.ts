import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiAlternativesDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private match: "all" | "any" | "one",
    private itemsType: Array<Decorator>,
  ) {
    super(component);
  }

  protected getItemsType(): string {
    return this.itemsType.map((item) => item.generate()).join(",");
  }
  public generate(): string {
    const items = this.getItemsType();
    return `${this.component.generate()}Joi.alternatives(${items}).match()`;
  }
}
