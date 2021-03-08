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
    document.addEventListener('keyup', event => {
      if (event.key === ' ') {
        this.renderIntersections();
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
  partialsAreConnected(p1: Polygon, p2: Polygon): boolean {
    return p1.vertices[p1.vertices.length - 2].equals(p2.vertices[0]) &&
           p1.vertices[p1.vertices.length - 1].equals(p2.vertices[1]);
  }
  buildPolygonsFromIntersectionTimes(): Polygon[] {
    // console.log('buildPolygonsFromIntersectionTimes');
    // console.log('----------------------------------');
    // console.log('lines.length = ', this.lines.length);
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
    const partials: Polygon[] = [];
    for (let localIndex = 0; localIndex < intersectionTimesSortedIndexArray.length; localIndex++) {
      for (let localInterIndex = 0; localInterIndex < intersectionTimesSortedIndexArray[localIndex].length; localInterIndex++) {
        const foreignIndex = intersectionTimesSortedIndexArray[localIndex][localInterIndex];
        if (localIndex < foreignIndex) {
          const localInter = this.lines[localIndex].pointAt(this.intersectionTimes[localIndex][intersectionTimesSortedIndexArray[localIndex][localInterIndex]]);
          const prevLocalInterIndex = localInterIndex - 1;
          const nextLocalInterIndex = localInterIndex + 1;
          const foreignInterIndex = intersectionTimesSortedIndexArray[foreignIndex].findIndex(i => i === localIndex);
          const prevForeignInterIndex = foreignInterIndex - 1;
          const nextForeignInterIndex = foreignInterIndex + 1;
          // console.log(`
          //   localIndex: ${localIndex}
          //   localIntersections ${intersectionTimesSortedIndexArray[localIndex]
          //     .map((_, i) => i === localInterIndex ? `[${_}]` : _)
          //     .join(', ')}
          //   foreignIndex: ${foreignIndex}
          //   foreignIntersections ${intersectionTimesSortedIndexArray[foreignIndex]
          //     .map((_, i) => i === foreignInterIndex ? `[${_}]` : _)
          //     .join(', ')}
          // `);
          const prevLocalInter = 0 < localInterIndex
            ? this.lines[localIndex].pointAt(this.intersectionTimes[localIndex][intersectionTimesSortedIndexArray[localIndex][prevLocalInterIndex]])
            : null;
          const nextLocalInter = localInterIndex < intersectionTimesSortedIndexArray[localIndex].length - 1
            ? this.lines[localIndex].pointAt(this.intersectionTimes[localIndex][intersectionTimesSortedIndexArray[localIndex][nextLocalInterIndex]])
            : null;
          const prevForeignInter = 0 < foreignInterIndex
            ? this.lines[foreignIndex].pointAt(this.intersectionTimes[foreignIndex][intersectionTimesSortedIndexArray[foreignIndex][prevForeignInterIndex]])
            : null;
          const nextForeignInter = foreignInterIndex < intersectionTimesSortedIndexArray[foreignIndex].length - 1
            ? this.lines[foreignIndex].pointAt(this.intersectionTimes[foreignIndex][intersectionTimesSortedIndexArray[foreignIndex][nextForeignInterIndex]])
            : null;
          //                          ^
          //                          |
          //                  nextForeignInter
          //                          |
          //  ---prevLocalInter---localInter---nextLocalInter--->
          //                          |
          //                  prevForeignInter
          //                          |
          const points = [prevLocalInter, nextForeignInter, nextLocalInter, prevForeignInter];
          for (let i = 0; i < points.length; i++) {
            if (points[i]) {
              let j = i + 1;
              if (j === points.length) {
                j = 0;
              }
              while (!points[j]) {
                j++;
                if (j === points.length) {
                  j = 0;
                }
              }
              if (i !== j) {
                if (points.filter(p => !!p).length === 4) {
                  console.log('push');
                }
                partials.push(new Polygon([points[i], localInter, points[j]]));
              }
            }
          }
        }
      }
    }
    partials.forEach(p => {
      if (p.area() < 0) {
        p.reverse();
      }
    });
    console.log('partials', partials);
    const polygons: Polygon[] = [];
    let i = 0;
    while (i < partials.length) {
      for (let j = 0; j < partials.length; j++) {
        if (i !== j) {
          if (this.partialsAreConnected(partials[i], partials[j])) {
            // console.log(`
            //   partials[i]: ${partials[i].toString()},
            //   partials[j]: ${partials[j].toString()},
            // `);
            partials[i].vertices.splice(-2, 2, ...partials[j].vertices);
            // console.log(`
            //   partials[i]: ${partials[i].toString()} [NEW],
            // `);
            partials.splice(j, 1);
            // if (i < j) {
            //   i--;
            // }
            // if (this.partialsAreConnected(partials[i], partials[i])) {
            //   partials[i].vertices.pop();
            //   partials[i].vertices.pop();
            //   polygons.push(partials[i]);
            //   partials.splice(i, 1);
            // } else if (partials[i].vertices[0].equals(partials[i].vertices[partials[i].vertices.length - 1])) {
            //   partials[i].vertices.pop();
            //   polygons.push(partials[i]);
            //   partials.splice(i, 1);
            // }
            i = -1;
            break;
          }
        }
      }
      i++;
    }
    console.log('incomplete polygons');
    partials.map(p => console.log(p.toString()));
    console.log('polygons', polygons);
    return partials;
  }
}