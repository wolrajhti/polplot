import { Line } from "../line";
import { Polygon } from "../polygon";
import { Vector2 } from "../vector2";

export interface PolplotRenderer {
  drawLine(line: Line, name: string): void;
  eraseLine(line: Line): void;
  setMouseDownHandler(handler: (event: MouseEvent) => void): void
  setMouseUpHandler(handler: (event: MouseEvent) => void): void
  setMouseMoveHandler(handler: (event: MouseEvent) => void): void
  drawPoint(point: Vector2): void;
  clearIntersections(): void;
  drawPolygon(polygon: Polygon): void;
  clearPolygons(): void;
}