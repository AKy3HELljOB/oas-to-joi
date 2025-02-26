import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

/**
 * JoiArrayDecorator
 * Usage example:
 * joiComponent = new JoiArrayDecorator(joiComponent, [
              new JoiStringDecorator(new JoiComponent()),
              new JoiNumberDecorator(new JoiComponent()),
            ]);
 */
export class JoiArrayDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private itemsType: Array<Decorator>,
    private unique: boolean = false,
  ) {
    super(component);
  }

  protected getItemsType(): string {
    return this.itemsType.map((item) => item.generate()).join(",");
  }
  public generate(): string {
    const items = this.getItemsType();
    const unique = this.unique
      ? `.unique().messages({'array.unique': 'Массив содержит дубликаты!',});`
      : "";
    return `${this.component.generate()}Joi.array().items(${items})${unique}`;
  }
}
