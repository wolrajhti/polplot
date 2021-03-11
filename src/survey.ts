import { LithologicalLayer } from "./lithological-layer";
import { Vector2 } from "./vector2";

export class Survey {
  constructor(
    public coordinates: Vector2,
    public altimetry: number,
    public depth: number,
    public lithology: LithologicalLayer[]
  ) {

  }
}