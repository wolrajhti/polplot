import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { Polygon } from "./polygon";
import { Vector2 } from "./vector2";

export class Polplot {
  lines: Line[] = [];
  intersectionTimes: number[][] = [];
  intersections: Vector2[] = [];
  intersectionIndex: number[][] = [];
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
    intersections = this.intersections,
    intersectionIndex = this.intersectionIndex,
  ): void {
    const newIntersectionTimes: number[] = [];
    const newIntersectionIndex: number[] = [];
    let times: Vector2;
    for (let i = 0; i < lines.length; i++) {
      times = lines[i].intersectionTimesWith(line);
      intersectionTimes[i].push(times.x);
      intersections.push(lines[i].pointAt(times.x));
      intersectionIndex[i].push(intersections.length - 1);
      newIntersectionTimes.push(times.y);
      newIntersectionIndex.push(intersections.length - 1);
    }
    newIntersectionTimes.push(NaN);
    newIntersectionIndex.push(null);
    intersectionTimes.push(newIntersectionTimes);
    intersectionIndex.push(newIntersectionIndex);
    this.renderIntersections();
  }
  updateIntersectionTimes(
    line: Line,
    lines = this.lines,
    intersectionTimes = this.intersectionTimes,
    intersections = this.intersections,
    intersectionIndex = this.intersectionIndex,
  ): void {
    const index = lines.indexOf(line);
    let times: Vector2;
    for (let i = 0; i < lines.length; i++) {
      if (i !== index) {
        times = lines[i].intersectionTimesWith(line);
        intersectionTimes[i][index] = times.x;
        intersectionTimes[index][i] = times.y;
        if (i < index) {
          intersections[intersectionIndex[i][index]] = lines[i].pointAt(times.x);
        } else {
          intersections[intersectionIndex[index][i]] = lines[i].pointAt(times.x);
        }
      }
    }
    this.renderIntersections();
  }
  renderIntersections(): void {
    // this.renderer.clearIntersections();
    // this.intersections.forEach(intersection => {
    //   this.renderer.drawPoint(intersection);
    // });
    this.renderer.clearPolygons();
    const partials = this.buildPartialsFromIntersectionTimes();
    const polygonIndexes = this.buildPolygonIndexesFromPartials(partials);
    const polygons = polygonIndexes.map(polygonIndex => new Polygon(polygonIndex.map(i => this.intersections[i])));
    polygons.forEach(polygon => {
      if (polygon.area() > 0) {
        this.renderer.drawPolygon(polygon);
      }
    });
  }
  testSide(u: Vector2, v: Vector2, w: Vector2): boolean {
    return v.sub(u).cross(w.sub(u)) > 0;
  }
  partialsOverlaps(p1: number[], p2: number[]): 2 | 0 {
    return p1[p1.length - 2] === p2[0] && p1[p1.length - 1] === p2[1] ? 2 : 0;
  }
  partialsMeet(p1: number[], p2: number[]): 1 | 0 {
    return p1[p1.length - 1] === p2[0] ? 1 : 0;
  }
  buildPartialsFromIntersectionIndexes(
    center: number,
    indexes: [number, number, number, number],
  ): [number, number, number][] {
    const parts: [number, number, number][] = [];
    for (let i = 0; i < indexes.length; i++) {
      if (typeof indexes[i] === 'number') {
        let j = i + 1;
        if (j === indexes.length) {
          j = 0;
        }
        while (typeof indexes[j] !== 'number') {
          j++;
          if (j === indexes.length) {
            j = 0;
          }
        }
        if (i !== j) {
          parts.push([indexes[i], center, indexes[j]]);
        }
      }
    }
    return parts;
  }
  buildPartialsFromIntersectionTimes(
    lines = this.lines,
    intersectionTimes = this.intersectionTimes,
    intersectionIndex = this.intersectionIndex
  ): [number, number, number][] {
    // console.log('buildPartialsFromIntersectionTimes');
    // console.log('----------------------------------');
    // console.log('lines.length = ', lines.length);
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
    // console.log(intersectionTimesSortedIndexArray);
    const partials: [number, number, number][] = [];
    for (let localIndex = 0; localIndex < intersectionTimesSortedIndexArray.length; localIndex++) {
      for (let localInterIndex = 0; localInterIndex < intersectionTimesSortedIndexArray[localIndex].length; localInterIndex++) {
        const foreignIndex = intersectionTimesSortedIndexArray[localIndex][localInterIndex];
        if (localIndex < foreignIndex) {
          const inter = intersectionIndex[localIndex][intersectionTimesSortedIndexArray[localIndex][localInterIndex]];

          const prevLocalInterIndex = localInterIndex - 1;
          const nextLocalInterIndex = localInterIndex + 1;

          const foreignInterIndex = intersectionTimesSortedIndexArray[foreignIndex].findIndex(i => i === localIndex);
          const foreignisRightSided = this.testSide(lines[localIndex].v1, lines[localIndex].v2, lines[foreignIndex].v1);
          const prevForeignInterIndex = foreignisRightSided ? foreignInterIndex - 1 : foreignInterIndex + 1;
          const nextForeignInterIndex = foreignisRightSided ? foreignInterIndex + 1 : foreignInterIndex - 1;

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
            ? intersectionIndex[localIndex][intersectionTimesSortedIndexArray[localIndex][prevLocalInterIndex]]
            : null;
          const nextLocalInter = localInterIndex < intersectionTimesSortedIndexArray[localIndex].length - 1
            ? intersectionIndex[localIndex][intersectionTimesSortedIndexArray[localIndex][nextLocalInterIndex]]
            : null;
          const prevForeignInter = -1 < prevForeignInterIndex && prevForeignInterIndex < intersectionTimesSortedIndexArray[foreignIndex].length
            ? intersectionIndex[foreignIndex][intersectionTimesSortedIndexArray[foreignIndex][prevForeignInterIndex]]
            : null;
          const nextForeignInter = -1 < nextForeignInterIndex && nextForeignInterIndex < intersectionTimesSortedIndexArray[foreignIndex].length
            ? intersectionIndex[foreignIndex][intersectionTimesSortedIndexArray[foreignIndex][nextForeignInterIndex]]
            : null;
          //                        ^
          //                        |
          //                nextForeignInter
          //                        |
          //  ---prevLocalInter---inter---nextLocalInter--->
          //                        |
          //                prevForeignInter
          //                        |
          const parts = this.buildPartialsFromIntersectionIndexes(
            inter,
            [
              prevLocalInter,
              nextForeignInter,
              nextLocalInter,
              prevForeignInter
            ]
          );
          partials.push(...parts);
        }
      }
    }
    // console.log('partials', partials);
    return partials;
  }
  buildPolygonIndexesFromPartials(partials: [number, number, number][]): number[][] {
    const polygonIndexes: number[][] = [];
    let i = 0;
    let overlap: number;
    while (i < partials.length) {
      for (let j = 0; j < partials.length; j++) {
        if (i !== j) {
          if (this.partialsOverlaps(partials[i], partials[j])) {
            // console.log(`
            //   partials[i]: ${partials[i].toString()},
            //   partials[j]: ${partials[j].toString()},
            // `);
            partials[i].splice(-2, 2, ...partials[j]);
            // console.log(`
            //   partials[i]: ${partials[i].toString()} [NEW],
            // `);
            partials.splice(j, 1);
            if (j < i) {
              i--;
            }
            overlap = this.partialsOverlaps(partials[i], partials[i]) || this.partialsMeet(partials[i], partials[i]);
            if (overlap > 0) {
              partials[i].splice(0, overlap);
              // console.log(`
              //   partials[i]: ${partials[i].toString()} [CLOSED],
              // `);
              polygonIndexes.push(partials[i]);
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
    // console.log('polygons', polygons);
    // polygons.map(p => console.log(p.toString()));
    return polygonIndexes;
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