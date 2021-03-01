export class Vector2 {
  constructor(public x = 0, public y = 0) {}
  static dotRaw(x1: number, y1: number, x2: number, y2: number): number {
    return x1 * x2 + y1 * y2;
  }
  static dot(u: Vector2, v: Vector2): number {
    return this.dotRaw(u.x, u.y, v.x, v.y);
  }
  dot(other: Vector2): number {
    return Vector2.dot(this, other);
  }
  static crossRaw(x1: number, y1: number, x2: number, y2: number): number {
    return x1 * y2 - x2 * y1;
  }
  static cross(u: Vector2, v: Vector2): number {
    return this.crossRaw(u.x, u.y, v.x, v.y);
  }
  cross(other: Vector2): number {
    return Vector2.cross(this, other);
  }
  static lenRaw(x: number, y: number): number {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  }
  static len(u: Vector2): number {
    return this.lenRaw(u.x, u.y);
  }
  len(): number {
    return Vector2.len(this);
  }
  static normalizeRaw(x: number, y: number, by: number = 1): Vector2 {
    const coef = by / this.lenRaw(x, y);
    return this.mulRaw(x, y, coef);
  }
  static normalize(u: Vector2, by: number = 1): Vector2 {
    return this.normalizeRaw(u.x, u.y, by);
  }
  normalize(by: number = 1): Vector2 {
    return Vector2.normalize(this, by);
  }
  static equalsRaw(x1: number, y1: number, x2: number, y2: number): boolean {
    return x1 === x2 && y1 === y2;
  }
  static equals(u: Vector2, v: Vector2): boolean {
    return this.equalsRaw(u.x, u.y, v.x, v.y);
  }
  equals(other: Vector2): boolean {
    return Vector2.equals(this, other);
  }
  static addRaw(x1: number, y1: number, x2: number, y2: number): Vector2 {
    return new Vector2(x1 + x2, y1 + y2);
  }
  static add(u: Vector2, v: Vector2): Vector2 {
    return this.addRaw(u.x, u.y, v.x, v.y);
  }
  add(other: Vector2): Vector2 {
    return Vector2.add(this, other);
  }
  static subRaw(x1: number, y1: number, x2: number, y2: number): Vector2 {
    return new Vector2(x1 - x2, y1 - y2);
  }
  static sub(u: Vector2, v: Vector2): Vector2 {
    return this.subRaw(u.x, u.y, v.x, v.y);
  }
  sub(other: Vector2): Vector2 {
    return Vector2.sub(this, other);
  }
  static mulRaw(x: number, y: number, by: number): Vector2 {
    return new Vector2(x * by, y * by);
  }
  static mul(u: Vector2, by: number): Vector2 {
    return this.mulRaw(u.x, u.y, by);
  }
  mul(by: number): Vector2 {
    return Vector2.mul(this, by);
  }
  static intersectionTimesRaw(
    fx: number, fy: number, tx: number, ty: number,
    sx: number, sy: number, ex: number, ey: number
  ): Vector2 | undefined {
    const det = this.crossRaw(tx - fx, ty - fy, ex - sx, ey - sy);
    return new Vector2(
      this.crossRaw(ex - sx, ey - sy, fx - sx, fy - sy) / det,
      this.crossRaw(tx - fx, ty - fy, fx - sx, fy - sy) / det
    );
  }
  static intersectionTimes(
    from: Vector2, to: Vector2, start: Vector2, end: Vector2
  ): Vector2 | undefined {
    return this.intersectionTimesRaw(from.x, from.y, to.x, to.y, start.x, start.y, end.x, end.y);
  }
  intersectionTimes(to: Vector2, start: Vector2, end: Vector2): Vector2 | undefined {
    return Vector2.intersectionTimes(this, to, start, end);
  }
  static intersectionRaw(
    fx: number, fy: number, tx: number, ty: number,
    sx: number, sy: number, ex: number, ey: number
  ): Vector2 | undefined {
    const times = this.intersectionTimesRaw(fx, fy, tx, ty, sx, sy, ex, ey);
    if (times) {
      times.y = fy + (ty - fy) * times.x;
      times.x = fx + (tx - fx) * times.x;
      return times;
    }
  }
  static intersection(from: Vector2, to: Vector2, start: Vector2, end: Vector2): Vector2 | undefined {
    return this.intersectionRaw(from.x, from.y, to.x, to.y, start.x, start.y, end.x, end.y);
  }
  intersection(to: Vector2, start: Vector2, end: Vector2): Vector2 | undefined {
    return Vector2.intersection(this, to, start, end);
  }
  angle(other?: Vector2): number {
    if (other) {
       const a1 = this.angle();
       const a2 = other.angle();
       if (a2 < a1) {
        return a2 + 2 * Math.PI - a1;
       } else {
        return a2 - a1;
       }
    } else if (this.y > 0) {
      return Math.acos(this.x / this.len());
    } else {
      return 2 * Math.PI - Math.acos(this.x / this.len());
    }
  }
}