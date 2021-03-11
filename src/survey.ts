import { LithologicalLayer } from "./lithological-layer";
import { Polygon } from "./polygon";
import { Vector2 } from "./vector2";

export class Survey {
  constructor(
    public coordinates: Vector2,
    public lithology: LithologicalLayer[],
    public polygon: Polygon,
  ) {

  }
  depth(): number {
    return this.lithology.reduce((depth, layer) => depth + layer.depth, 0);
  }
  quantities(): Map<string, number> {
    const quantities = new Map<string, number>();
    if (this.polygon) {
      const area = this.polygon.area();
      this.lithology.forEach(lithologicalLayer => {
        let quantity = quantities.get(lithologicalLayer.type) || 0;
        quantities.set(lithologicalLayer.type, quantity + Math.round(area * lithologicalLayer.depth));
      });
    }
    return quantities;
  }
}