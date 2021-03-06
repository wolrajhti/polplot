import { Line } from "./line";
import { Vector2 } from "./vector2";

export class Polygon {
  constructor(readonly vertices: Vector2[] = []) {

  }
  private areaBetween(i: number, j: number): number {
    return (this.vertices[j].x - this.vertices[i].x) * (this.vertices[i].y + this.vertices[j].y) / 2;
  }
  area(): number {
    let a = 0;
    let i = this.vertices.length - 1;
    for (let j = 0; j < this.vertices.length; j++) {
      a += this.areaBetween(i, j);
      i = j;
    }
    return a;
  }
  shareEdge(u: Vector2, v: Vector2): boolean {
    let i = this.vertices.length - 1;
    for (let j = 0; j < this.vertices.length; j++) {
      if (this.vertices[i].equals(u) && this.vertices[j].equals(v)) {
        return true;
      }
      i = j;
    }
    return false;
  }
  intersectionWith(line: Line) {
    
  }
}