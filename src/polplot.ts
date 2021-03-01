import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { Vector2 } from "./vector2";

export class PolPlot {
  lines: Line[] = [];
  constructor(readonly renderer: PolplotRenderer) {
    let draggedLine: Line;
    let draggedVector2: Vector2;

    this.renderer.setMouseDownHandler((event, clickedLine, clickedVector2) => {
      draggedLine = clickedLine || null;
      draggedVector2 = clickedVector2 || null;
      if (!draggedLine) {
        draggedLine = new Line(event.clientX, event.clientY, event.clientX, event.clientY);
        draggedVector2 = draggedLine.v2;
        this.lines.push(draggedLine);
        this.renderer.drawLine(draggedLine, false, false);
      }
    });

    let selectedLine: Line;
    this.renderer.setMouseUpHandler((event, clickedLine, clickedVector2) => {
      if (clickedLine) {
        if (selectedLine && selectedLine !== clickedLine) {
          this.renderer.drawLine(selectedLine, clickedLine === hoveredLine, false);
        }
        selectedLine = clickedLine;
        this.renderer.drawLine(selectedLine, clickedLine === hoveredLine, true);
      } else if (selectedLine) {
        this.renderer.drawLine(selectedLine, clickedLine === hoveredLine, false);
      }
      draggedLine = null;
      draggedVector2 = null;
    });

    let hoveredLine: Line;
    this.renderer.setMouseMoveHandler((event, clickedLine, clickedVector2) => {
      if (clickedLine) {
        if (hoveredLine && hoveredLine !== clickedLine) {
          this.renderer.drawLine(hoveredLine, false, clickedLine === selectedLine);
        }
        hoveredLine = clickedLine;
        this.renderer.drawLine(hoveredLine, true, clickedLine === selectedLine); 
      } else if (hoveredLine) {
        this.renderer.drawLine(hoveredLine, false, clickedLine === selectedLine);
        hoveredLine = null;
      }
      if (draggedLine) {
        if (draggedVector2) {
          draggedVector2.x = event.clientX;
          draggedVector2.y = event.clientY;
        } else {
          draggedLine.update(event.movementX, event.movementY, event.movementX, event.movementY);
        }
        this.renderer.drawLine(draggedLine, draggedLine === hoveredLine, draggedLine === selectedLine);
      }
    });
  }
}