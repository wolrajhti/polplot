import { Line } from "../line";
import { Polygon } from "../polygon";
import { Survey } from "../survey";
import { Vector2 } from "../vector2";

export interface PolplotRenderer {
  drawLine(line: Line, name: string): void;
  eraseLine(line: Line): void;
  setMouseDownHandler(handler: (event: MouseEvent) => void): void
  setMouseUpHandler(handler: (event: MouseEvent) => void): void
  setMouseMoveHandler(handler: (event: MouseEvent) => void): void
  setSidebarMouseDownHandler(handler: (event: MouseEvent) => void): void
  setSidebarMouseUpHandler(handler: (event: MouseEvent) => void): void
  setSidebarMouseMoveHandler(handler: (event: MouseEvent) => void): void
  drawPoint(point: Vector2, name: string): void;
  clearIntersections(): void;
  drawPolygon(polygon: Polygon, fill?: string): void;
  clearPolygons(): void;
  drawSurvey(survey: Survey): void;
  clearSurvey(): void;
}