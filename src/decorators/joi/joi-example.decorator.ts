import { BaseComponent } from "../components/base.component";
import { Decorator } from "../decorator";

export class JoiExampleDecorator extends Decorator {
  constructor(
    component: BaseComponent,
    private example: string | number,
  ) {
    super(component);
  }
  private toString(): string {
    if (this.example) {
      return typeof this.example === "number"
        ? `${this.example}`
        : `"${typeof this.example === "string" ? this.example.replace(/\"/g, `\\\"`) : this.example}"`;
    }
  }
  public generate(): string {
    return this.component.generate() + `.example(${this.toString()})`;
  }
}
