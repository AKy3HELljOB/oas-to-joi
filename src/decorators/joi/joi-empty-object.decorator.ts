import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiEmptyObjectDecorator extends Decorator {
  constructor(component: BaseComponent) {
    super(component);
  }

  public generate(): string {
    return `${this.component.generate()}Joi.object()`;
  }
}
