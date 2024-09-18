import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiDescriptionDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private description: string,
  ) {
    super(component);
  }
  public generate(): string {
    return this.component.generate() + `.description("${this.description}")`;
  }
}
