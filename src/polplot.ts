import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { Polygon } from "./polygon";
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
    this.renderer.clearPolygons();
    this.buildPolygonsFromIntersectionTimes()
      .forEach(polygon => this.renderer.drawPolygon(polygon));
  }
  testSide(u: Vector2, v: Vector2, w: Vector2): boolean {
    return v.sub(u).cross(w.sub(u)) > 0;
  }
  buildPolygonsFromIntersectionTimes(): Polygon[] {
    // console.log('buildPolygonsFromIntersectionTimes');
    // console.log('----------------------------------');
    const intersectionTimesSortedIndexArray = this.intersectionTimes
      .map((intersectionTimes, i) => {
        return intersectionTimes
          .map((_, j) => j)
          .filter(j => {
            return !isNaN(intersectionTimes[j]) && 0 <= intersectionTimes[j] && intersectionTimes[j] <= 1 &&
              !isNaN(this.intersectionTimes[j][i]) && 0 <= this.intersectionTimes[j][i] && this.intersectionTimes[j][i] <= 1;
          })
          .sort((i, j) => intersectionTimes[i] - intersectionTimes[j]);
      });
    const polygons: Polygon[] = [];
    for (let i = 0; i < intersectionTimesSortedIndexArray.length; i++) {
      for (let j = 0; j < intersectionTimesSortedIndexArray[i].length - 1; j++) {
        // console.log(
        //   'looking for polygon on line', i,
        //   'from intersection with', intersectionTimesSortedIndexArray[i][j],
        //   'to intersection with', intersectionTimesSortedIndexArray[i][j + 1]
        // );
        let pk: number;
        let pl: number;
        let k = i;
        let l = j;
        const polygon: Vector2[] = [
          // first point on original line
          this.lines[k].pointAt(this.intersectionTimes[k][intersectionTimesSortedIndexArray[k][l]]),
          // second point on original line (the next intersection)
          this.lines[k].pointAt(this.intersectionTimes[k][intersectionTimesSortedIndexArray[k][l + 1]]),
        ];
        // skip if current edge is already on an other polygon
        if (polygons.some(p => p.shareEdge(polygon[0], polygon[1]))) {
          break;
        }
        l += 1;
        let I = 0;
        let closed = false;
        while (true && I++ < 1e2) {
          pk = k;
          pl = l;
          // switch to the line intersected at previous point
          k = intersectionTimesSortedIndexArray[k][l];
          if (typeof k !== 'number') {
            // console.log('k is not a number');
            break;
          }
          // retrieve the index of previous intersection on new line
          l = intersectionTimesSortedIndexArray[k].findIndex(m => m === pk);
          if (typeof l !== 'number') {
            console.warn('error');
          }
          // console.log('moving to line', k, 'at intersection with', intersectionTimesSortedIndexArray[k][l]);
          // optionnally
          if (
            0 < l && this.testSide(
              polygon[polygon.length - 2],
              polygon[polygon.length - 1],
              this.lines[k].pointAt(this.intersectionTimes[k][intersectionTimesSortedIndexArray[k][l - 1]]),
            )
          ) {
            l -= 1;
          } else if (
            l < intersectionTimesSortedIndexArray[k].length - 1 && this.testSide(
              polygon[polygon.length - 2],
              polygon[polygon.length - 1],
              this.lines[k].pointAt(this.intersectionTimes[k][intersectionTimesSortedIndexArray[k][l + 1]]),
            )
          ) {
            l += 1;
          } else {
            // console.log('no prev or next on line', k);
            break;
          }
          polygon.push(this.lines[k].pointAt(this.intersectionTimes[k][intersectionTimesSortedIndexArray[k][l]]));
          // if last pushed point is equals to the first, closed the polygon
          if (polygon[0].equals(polygon[polygon.length - 1])) {
            polygon.pop();
            closed = true;
            break;
          }
        }
        if (I === 1e2) {
          console.warn('too many loops');
        }
        if (closed) {
          polygons.push(new Polygon(polygon));
        }
      }
    }
    return polygons;
  }
}