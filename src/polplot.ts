import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { Polygon } from "./polygon";
import { Vector2 } from "./vector2";

export class Polplot {
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
  addIntersectionTimes(
    line: Line,
    lines = this.lines,
    intersectionTimes = this.intersectionTimes,
    intersectionPoints = this.intersectionPoints
  ): void {
    const newIntersectionTimes: number[] = [];
    const newIntersectionPoints: Vector2[] = [];
    let times: Vector2;
    for (let i = 0; i < lines.length; i++) {
      times = lines[i].intersectionTimesWith(line);
      intersectionTimes[i].push(times.x);
      intersectionPoints[i].push(
        0 <= times.x && times.x <= 1 && 0 <= times.y && times.y <= 1
          ? lines[i].v1.add(lines[i].v2.sub(lines[i].v1).mul(times.x))
          : null
      );
      newIntersectionTimes.push(times.y);
      newIntersectionPoints.push(null);
    }
    newIntersectionTimes.push(NaN);
    newIntersectionPoints.push(null);
    intersectionTimes.push(newIntersectionTimes);
    intersectionPoints.push(newIntersectionPoints);
    this.renderIntersections();
  }
  updateIntersectionTimes(
    line: Line,
    lines = this.lines,
    intersectionTimes = this.intersectionTimes,
    intersectionPoints = this.intersectionPoints
  ): void {
    const index = lines.indexOf(line);
    let times: Vector2;
    for (let i = 0; i < lines.length; i++) {
      if (i !== index) {
        times = lines[i].intersectionTimesWith(line);
        intersectionTimes[i][index] = times.x;
        intersectionTimes[index][i] = times.y;
        if (i < index) {
          intersectionPoints[i][index] = 0 <= times.x && times.x <= 1 && 0 <= times.y && times.y <= 1
            ? lines[i].v1.add(lines[i].v2.sub(lines[i].v1).mul(times.x))
            : null;
        } else {
          intersectionPoints[index][i] = 0 <= times.x && times.x <= 1 && 0 <= times.y && times.y <= 1
            ? lines[i].v1.add(lines[i].v2.sub(lines[i].v1).mul(times.x))
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
    const partials = this.buildPartialsFromIntersectionTimes();
    this.buildPolygonsFromPartials(partials)
      .forEach(polygon => this.renderer.drawPolygon(polygon));
  }
  testSide(u: Vector2, v: Vector2, w: Vector2): boolean {
    return v.sub(u).cross(w.sub(u)) > 0;
  }
  partialsAreConnected(p1: Polygon, p2: Polygon): boolean {
    return p1.vertices[p1.vertices.length - 2].equals(p2.vertices[0]) &&
           p1.vertices[p1.vertices.length - 1].equals(p2.vertices[1]);
  }
  buildPartialsFromPoints(
    intersection: Vector2,
    points: [Vector2, Vector2, Vector2, Vector2],
    localLine: Line,
    foreignLine: Line,
  ): Polygon[] {
    const parts: [number, number][] = [];
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
          parts.push([i, j]);
        }
      }
    }
    return parts.map(([i, j]) => {
      const polygon = new Polygon([points[i], intersection, points[j]]);
      return polygon;
    });
  }
  buildPartialsFromIntersectionTimes(
    lines = this.lines,
    intersectionTimes = this.intersectionTimes
  ): Polygon[] {
    console.log('buildPartialsFromIntersectionTimes');
    console.log('----------------------------------');
    console.log('lines.length = ', lines.length);
    const intersectionTimesSortedIndexArray = intersectionTimes
      .map((intersectionTimesAtI, i) => {
        return intersectionTimesAtI
          .map((_, j) => j)
          .filter(j => {
            return !isNaN(intersectionTimesAtI[j]) && 0 <= intersectionTimesAtI[j] && intersectionTimesAtI[j] <= 1 &&
              !isNaN(intersectionTimes[j][i]) && 0 <= intersectionTimes[j][i] && intersectionTimes[j][i] <= 1;
          })
          .sort((i, j) => intersectionTimesAtI[i] - intersectionTimesAtI[j]);
      });
    console.log(intersectionTimesSortedIndexArray);
    const partials: Polygon[] = [];
    for (let localIndex = 0; localIndex < intersectionTimesSortedIndexArray.length; localIndex++) {
      for (let localInterIndex = 0; localInterIndex < intersectionTimesSortedIndexArray[localIndex].length; localInterIndex++) {
        const foreignIndex = intersectionTimesSortedIndexArray[localIndex][localInterIndex];
        if (localIndex < foreignIndex) {
          const inter = lines[localIndex].pointAt(intersectionTimes[localIndex][intersectionTimesSortedIndexArray[localIndex][localInterIndex]]);
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
            ? lines[localIndex].pointAt(intersectionTimes[localIndex][intersectionTimesSortedIndexArray[localIndex][prevLocalInterIndex]])
            : null;
          const nextLocalInter = localInterIndex < intersectionTimesSortedIndexArray[localIndex].length - 1
            ? lines[localIndex].pointAt(intersectionTimes[localIndex][intersectionTimesSortedIndexArray[localIndex][nextLocalInterIndex]])
            : null;
          const prevForeignInter = 0 < foreignInterIndex
            ? lines[foreignIndex].pointAt(intersectionTimes[foreignIndex][intersectionTimesSortedIndexArray[foreignIndex][prevForeignInterIndex]])
            : null;
          const nextForeignInter = foreignInterIndex < intersectionTimesSortedIndexArray[foreignIndex].length - 1
            ? lines[foreignIndex].pointAt(intersectionTimes[foreignIndex][intersectionTimesSortedIndexArray[foreignIndex][nextForeignInterIndex]])
            : null;
          //                        ^
          //                        |
          //                nextForeignInter
          //                        |
          //  ---prevLocalInter---inter---nextLocalInter--->
          //                        |
          //                prevForeignInter
          //                        |
          const parts = this.buildPartialsFromPoints(
            inter,
            [
              prevLocalInter,
              nextForeignInter,
              nextLocalInter,
              prevForeignInter
            ],
            lines[localIndex],
            lines[foreignIndex]
          );
          partials.push(...parts);
        }
      }
    }
    // console.log('partials', partials);
    return partials;
  }
  buildPolygonsFromPartials(partials: Polygon[]): Polygon[] {
    const polygons: Polygon[] = [];
    let i = 0;
    while (i < partials.length) {
      for (let j = 0; j < partials.length; j++) {
        if (i !== j) {
          if (this.partialsAreConnected(partials[i], partials[j])) {
            console.log(`
              partials[i]: ${partials[i].toString()},
              partials[j]: ${partials[j].toString()},
            `);
            partials[i].vertices.splice(-2, 2, ...partials[j].vertices);
            console.log(`
              partials[i]: ${partials[i].toString()} [NEW],
            `);
            partials.splice(j, 1);
            if (j < i) {
              i--;
            }
            if (this.partialsAreConnected(partials[i], partials[i])) {
              partials[i].vertices.splice(0, 2);
              console.log(`
                new connected polygon: ${partials[i].toString()}
              `);
              polygons.push(partials[i]);
              partials.splice(i, 1);
            } else if (partials[i].vertices[0].equals(partials[i].vertices[partials[i].vertices.length - 1])) {
              partials[i].vertices.pop();
              console.log(`
                new closed polygon: ${partials[i].toString()}
              `);
              polygons.push(partials[i]);
              partials.splice(i, 1);
            }
            i = -1;
            break;
          }
        }
      }
      i++;
    }
    // console.log('incomplete polygons');
    // partials.map(p => console.log(p.toString()));
    console.log('polygons', polygons);
    polygons.map(p => console.log(p.toString()));
    return polygons;
  }
}

// const lines: Line[] = [];
// const iTimes: number[][] = [];
// const iPoints: Vector2[][] = [];
// [
//   [300, 300, 600, 600],
//   [300, 600, 600, 300],
//   [400, 300, 300, 400],
//   [500, 600, 600, 400],
//   [300, 500, 400, 600],
//   [500, 600, 600, 400],
// ].forEach(([x1, y1, x2, y2]) => {
//   this.addIntersectionTimes(l1, lines, iTimes, iPoints);
//   lines.push(l1);
// });
// const partials = this.buildPartialsFromIntersectionTimes(lines, iTimes);
// console.log(partials);