import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiAlternativesDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private match: "all" | "any" | "one" = "any",
    private itemsType: Array<String>,
  ) {
    super(component);
  }

  protected getItemsType(): string {
    console.log('this.itemsType :>> ', this.itemsType);
    return this.itemsType.join(",");
  }
  public generate(): string {
    const items = this.getItemsType();
    const s = `${this.component.generate()}Joi.alternatives([${items}]).match(${this.match})`;
    console.log('JoiAlternativesDecorator :>> ', s);
    return s
  }
}
