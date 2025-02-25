import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiAlternativesDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private match: "all" | "any" | "one" = "any",
    private itemsType: Array<string>,
    private name: string,
  ) {
    super(component);
  }

  protected getItemsType(): string {
    const circularIndex = this.itemsType.indexOf(this.name);
    if (circularIndex !== -1) {
      this.itemsType.splice(circularIndex, 1);
      return `${this.itemsType.join(",")},object(/* ${this.name} circular dependency */)`;
    }
    return this.itemsType.join(",");
  }

  public generate(): string {
    const items = this.getItemsType();
    const s = `${this.component.generate()}Joi.alternatives([${items}]).match("${this.match}")`;
    return s;
  }
}
