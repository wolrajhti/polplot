import { LithologicalLayer } from "./lithological-layer";

export class Survey {
  constructor(
    public lithology: LithologicalLayer[]
  ) {

  }
  depth(): number {
    return this.lithology.reduce((depth, layer) => depth + layer.depth, 0);
  }
}