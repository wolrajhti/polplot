import { Line } from "../line";
import { Vector2 } from "../vector2";

export type ClickHandler = (event: MouseEvent, clickedLine?: Line, clickedVector2?: Vector2) => void;

export interface PolplotRenderer {
  drawLine(line: Line, isHovered: boolean, isSelected: boolean): void;
  eraseLine(line: Line): void;
  setMouseDownHandler(clickHandler: ClickHandler): void;
  setMouseUpHandler(clickHandler: ClickHandler): void;
  setMouseMoveHandler(clickHandler: ClickHandler): void;
  drawPoint(point: Vector2): void;
  clearIntersections(): void;
}