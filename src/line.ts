import { Vector2 } from "./vector2";

export class Line {
  v1: Vector2;
  v2: Vector2;
  constructor(
    x1?: number,
    y1?: number,
    x2?: number,
    y2?: number
  ) {
    this.v1 = new Vector2(x1, y1);
    this.v2 = new Vector2(x2, y2);
  }
  get x1(): number {
    return this.v1.x;
  }
  get y1(): number {
    return this.v1.y;
  }
  get x2(): number {
    return this.v2.x;
  }
  get y2(): number {
    return this.v2.y;
  }
  len(): number {
    return this.v2.sub(this.v1).len();
  }
  before(t: number): Vector2 {
    return this.v1.add(this.v2.sub(this.v1).mul(-t / this.len()));
  }
  after(t: number): Vector2 {
    return this.v1.add(this.v2.sub(this.v1).mul((this.len() + t) / this.len()));
  }
  intersectionTimesWith(other: Line): Vector2 {
    return this.v1.intersectionTimes(this.v2, other.v1, other.v2);
  }
  update(dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0): void {
    this.v1.x += dx1;
    this.v1.y += dy1;
    this.v2.x += dx2;
    this.v2.y += dy2;
  }
}