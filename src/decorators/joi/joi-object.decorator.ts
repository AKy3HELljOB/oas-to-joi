import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiObjectDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private itemsType: Array<BaseComponent>,
  ) {
    super(component);
  }

  protected getItemsType(): string {
    return this.itemsType.map((item) => item.generate()).join(",");
  }
  public generate(): string {
    const items = this.getItemsType();
    return `${this.component.generate()}Joi.object({${items}})`;
  }
}
