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
  contains(v: Vector2): boolean {
    let c = false;
    for (let i = 0, j = this.vertices.length - 1; i < this.vertices.length; j = i++) {
      if (
        this.vertices[i].y > v.y !== this.vertices[j].y > v.y &&
        v.x < (this.vertices[j].x - this.vertices[i].x) * (v.y - this.vertices[i].y) / (this.vertices[j].y - this.vertices[i].y) + this.vertices[i].x
      ) {
        c = !c;
      }
    }
    return c;
  }
  reverse(): void {
    this.vertices.reverse();
  }
  edgeCount(): number {
    if (this.vertices.length > 1) {
      return this.vertices.length;
    }
    return 0;
  }
  edges(): Line[] {
    if (this.vertices.length > 1) {
      return this.vertices.map((v, i) => Line.fromVectors(this.vertices[i], this.vertices[i < this.vertices.length - 1 ? i + 1 : 0]));
    }
    return [];
  }
  toString(): string {
    return `${this.vertices.length} points: ` + this.vertices.map(v => `(${v.x.toFixed()}, ${v.y.toFixed()})`).join(', ') + ` (area: ${this.area().toFixed()})`;
  }
}