import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { Vector2 } from "./vector2";

export class PolPlot {
  lines: Line[] = [];
  intersectionTimes: number[][] = [];
  intersectionPoints: Vector2[][] = [];
  constructor(readonly renderer: PolplotRenderer) {
    let draggedLine: Line;
    let draggedVector2: Vector2;

    this.renderer.setMouseDownHandler((event, clickedLine, clickedVector2) => {
      draggedLine = clickedLine || null;
      draggedVector2 = clickedVector2 || null;
      if (!draggedLine) {
        draggedLine = new Line(event.clientX, event.clientY, event.clientX, event.clientY);
        draggedVector2 = draggedLine.v2;
        this.addLine(draggedLine);
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
        this.updateIntersectionTimes(draggedLine);
        this.renderer.drawLine(draggedLine, draggedLine === hoveredLine, draggedLine === selectedLine);
      }
    });
  }
  addLine(line: Line): void {
    this.addIntersectionTimes(line);
    this.lines.push(line);
    this.renderer.drawLine(line, false, false);
  }
  addIntersectionTimes(line: Line): void {
    const intersectionTimes: number[] = [];
    const intersectionPoints: Vector2[] = [];
    let times: Vector2;
    for (let i = 0; i < this.lines.length; i++) {
      times = this.lines[i].intersectionTimesWith(line);
      this.intersectionTimes[i].push(times.x);
      this.intersectionPoints[i].push(
        0 <= times.x && times.x <= 1 && 0 <= times.y && times.y <= 1
          ? this.lines[i].v1.add(this.lines[i].v2.sub(this.lines[i].v1).mul(times.x))
          : null
      );
      intersectionTimes.push(times.y);
      intersectionPoints.push(null);
    }
    intersectionTimes.push(NaN);
    intersectionPoints.push(null);
    this.intersectionTimes.push(intersectionTimes);
    this.intersectionPoints.push(intersectionPoints);
    this.renderIntersections();
  }
  updateIntersectionTimes(line: Line): void {
    const index = this.lines.indexOf(line);
    let times: Vector2;
    for (let i = 0; i < this.lines.length; i++) {
      if (i !== index) {
        times = this.lines[i].intersectionTimesWith(line);
        this.intersectionTimes[i][index] = times.x;
        this.intersectionTimes[index][i] = times.y;
        if (i < index) {
          this.intersectionPoints[i][index] = 0 <= times.x && times.x <= 1 && 0 <= times.y && times.y <= 1
            ? this.lines[i].v1.add(this.lines[i].v2.sub(this.lines[i].v1).mul(times.x))
            : null;
        } else {
          this.intersectionPoints[index][i] = 0 <= times.x && times.x <= 1 && 0 <= times.y && times.y <= 1
            ? this.lines[i].v1.add(this.lines[i].v2.sub(this.lines[i].v1).mul(times.x))
            : null;
        }
      }
    }
    this.renderIntersections();
  }
  renderIntersections(): void {
    this.renderer.clearIntersections();
    this.intersectionPoints.forEach(intersectionPoints => {
      intersectionPoints.forEach(intersectionPoint => {
        if (intersectionPoint) {
          this.renderer.drawPoint(intersectionPoint);
        }
      });
    });
  }
}