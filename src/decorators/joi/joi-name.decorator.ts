import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiNameDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private name: string,
  ) {
    super(component);
  }
  public generate(): string {
    const name = this.name.indexOf("-") ? `"${this.name}"` : this.name;
    return `${name}: ${this.component.generate()}`;
  }
}
