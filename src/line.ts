export class Line {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number
  ) {

  }
  len(): number {
    return Math.sqrt(Math.pow(this.x2 - this.x1, 2) + Math.pow(this.y2 - this.y1, 2));
  }
  xBefore(t: number): number {
    return this.x1 - t * (this.x2 - this.x1) / this.len();
  }
  yBefore(t: number): number {
    return this.y1 - t * (this.y2 - this.y1) / this.len();
  }
  xAfter(t: number): number {
    return this.x1 + (this.len() + t) * (this.x2 - this.x1) / this.len();
  }
  yAfter(t: number): number {
    return this.y1 + (this.len() + t) * (this.y2 - this.y1) / this.len();
  }
  intersect(other: Line) {

  }
}