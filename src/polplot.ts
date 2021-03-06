import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { LithologicalLayer } from "./lithological-layer";
import { Polygon } from "./polygon";
import { Survey } from "./survey";
import { Vector2 } from "./vector2";

const CLICK_THRESHOLD = 20;

const enum Modes {
  Contour,
  Kutch,
  Axes,
  Surveys
}

export class Polplot {
  axes: Line[] = [];
  kutch: Line = new Line(50, 200, 150, 200);
  contour = new Polygon();
  intersectionTimes: number[][] = [];
  intersections: Vector2[] = [];
  intersectionIndex: number[][] = [];
  polygons: Polygon[] = [];
  surveys: Survey[] = [];
  quantities = new Map<string, number>();
  mode = Modes.Contour;
  constructor(readonly renderer: PolplotRenderer) {
    // remove next hacky eventListener
    document.addEventListener('keyup', event => {
      if (event.key === 's') {
        this.mode = Modes.Surveys;
        document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
        document.querySelector('#edit-surveys').classList.add('selected');
      } else if (event.key === 'c') {
        this.mode = Modes.Contour;
        this.renderer.clearSurvey();
        document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
        document.querySelector('#edit-contour').classList.add('selected');
      } else if (event.key === 'k') {
        this.mode = Modes.Kutch;
        this.renderer.clearSurvey();
        document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
        document.querySelector('#edit-kutch').classList.add('selected');
      } else if (event.key === 'a') {
        this.mode = Modes.Axes;
        this.renderer.clearSurvey();
        document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
        document.querySelector('#edit-axes').classList.add('selected');
      } else if (event.key === 'Escape') {
        this.renderer.clearSurvey();
      }
    });

    document.querySelector('#edit-contour').addEventListener('click', event => {
      document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
      (event.target as HTMLDivElement).classList.add('selected');
      this.mode = Modes.Contour;
      this.renderer.clearSurvey();
    });

    document.querySelector('#edit-axes').addEventListener('click', event => {
      document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
      (event.target as HTMLDivElement).classList.add('selected');
      this.mode = Modes.Axes;
      this.renderer.clearSurvey();
    });

    document.querySelector('#edit-surveys').addEventListener('click', event => {
      document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
      (event.target as HTMLDivElement).classList.add('selected');
      this.mode = Modes.Surveys;
    });

    document.querySelector('#edit-kutch').addEventListener('click', event => {
      document.querySelectorAll('.button').forEach((div: HTMLDivElement) => div.classList.remove('selected'));
      (event.target as HTMLDivElement).classList.add('selected');
      this.mode = Modes.Kutch;
    });

    this.updateQuantities();
    this.renderer.drawKutch(this.kutch);

    let draggedLineIndex = -1;
    let draggedVector2: Vector2;
    let draggedSurveyIndex = -1;
    this.renderer.setMouseDownHandler(event => {
      // return if click is not from mouse left button
      if (event.button) {
        return;
      }
      const mouse = new Vector2(event.clientX, event.clientY);
      if (this.mode === Modes.Axes || this.mode === Modes.Contour) {
        draggedLineIndex = this.nearestLineIndexFrom(
          mouse,
          CLICK_THRESHOLD,
          this.mode === Modes.Axes
            ? this.axes
            : this.contour.edges()
        );
        if (draggedLineIndex === -1) {
          if (this.mode === Modes.Axes) {
            this.addLine(new Line(mouse.x, mouse.y, mouse.x, mouse.y));
            draggedLineIndex = this.lines.length - 1;
            draggedVector2 = this.lines[draggedLineIndex].v2;
          } else if (this.mode === Modes.Contour) {
            this.addContour(new Line(mouse.x, mouse.y, mouse.x, mouse.y));
            draggedLineIndex = 0;
            draggedVector2 = this.lines[draggedLineIndex].v1;
          }
        } else {
          if (this.mode === Modes.Axes) {
            draggedLineIndex += this.contour.edgeCount();
          }
          if (mouse.sub(this.lines[draggedLineIndex].v1).len() < CLICK_THRESHOLD) {
            draggedVector2 = this.lines[draggedLineIndex].v1;
          } else if (mouse.sub(this.lines[draggedLineIndex].v2).len() < CLICK_THRESHOLD) {
            draggedVector2 = this.lines[draggedLineIndex].v2;
          }
        }
      } else if (this.mode === Modes.Kutch) {
        if (mouse.sub(this.kutch.v1).len() < CLICK_THRESHOLD) {
          draggedVector2 = this.kutch.v1;
        } else if (mouse.sub(this.kutch.v2).len() < CLICK_THRESHOLD) {
          draggedVector2 = this.kutch.v2;
        }
      } else if (this.mode === Modes.Surveys) {
        draggedSurveyIndex = this.nearestSurveyIndexFrom(mouse, CLICK_THRESHOLD);
        if (draggedSurveyIndex === -1) {
          this.addSurvey(mouse);
          draggedSurveyIndex = this.surveys.length - 1;
        }
      }
    });

    let activeSurvey: Survey;
    this.renderer.setMouseUpHandler(event => {
      // return if click is not from mouse left button
      if (event.button) {
        return;
      }
      if (this.mode === Modes.Axes || this.mode === Modes.Contour || this.mode === Modes.Kutch) {
        draggedLineIndex = -1;
        draggedVector2 = null;
      } else if (this.mode === Modes.Surveys) {
        if (draggedSurveyIndex !== -1) {
          activeSurvey = this.surveys[draggedSurveyIndex];
          this.renderer.drawSurvey(activeSurvey);
        } else {
          activeSurvey = null;
        }
        draggedSurveyIndex = -1;
      }
    });

    let polygonContainer: Polygon;
    this.renderer.setMouseMoveHandler(event => {
      // return if click is not from mouse left button
      if (event.button) {
        return;
      }
      if (this.mode === Modes.Axes || this.mode === Modes.Contour) {
        if (draggedVector2 || draggedLineIndex !== -1) {
          if (draggedVector2) {
            draggedVector2.x += event.movementX;
            draggedVector2.y += event.movementY;
          } else {
            this.lines[draggedLineIndex].update(event.movementX, event.movementY, event.movementX, event.movementY);
          }
          this.updateIntersectionTimes(draggedLineIndex);
          if (this.mode === Modes.Axes) {
            this.renderer.drawLine(
              this.axes[draggedLineIndex - this.contour.edgeCount()],
              (draggedLineIndex - this.contour.edgeCount()).toString()
            );
          } else {
            if (draggedLineIndex === this.contour.edgeCount() - 1) {
              this.updateIntersectionTimes(draggedLineIndex - 1);
              this.updateIntersectionTimes(0);
            } else if (draggedLineIndex === 0) {
              this.updateIntersectionTimes(this.contour.edgeCount() - 1);
              this.updateIntersectionTimes(1);
            } else {
              this.updateIntersectionTimes(draggedLineIndex - 1);
              this.updateIntersectionTimes(draggedLineIndex + 1);
            }
            this.renderer.drawContour(this.contour);
          }
        }
      } else if (this.mode === Modes.Kutch) {
        if (draggedVector2) {
          draggedVector2.x += event.movementX;
          draggedVector2.y += event.movementY;
          this.renderer.drawKutch(this.kutch);
          this.updateQuantities();
          this.surveys.forEach(survey => this.updateSurvey(survey));
        }
      } else if (this.mode === Modes.Surveys) {
        if (draggedSurveyIndex !== -1) {
          this.surveys[draggedSurveyIndex].coordinates.x += event.movementX;
          this.surveys[draggedSurveyIndex].coordinates.y += event.movementY;
          this.updateSurvey(this.surveys[draggedSurveyIndex]);
        }
        // TODO: should be in a function
        const mouse = new Vector2(event.clientX, event.clientY);
        let isInside = false;
        let oldPolygonContainer = polygonContainer;
        for (const polygon of this.polygons) {
          if (polygon.contains(mouse)) {
            if (polygon !== polygonContainer) {
              this.renderer.drawPolygon(polygon, 'red');
              polygonContainer = polygon;
            }
            isInside = true;
            break;
          }
        }
        if (!isInside) {
          polygonContainer = null;
        }
        if (oldPolygonContainer && oldPolygonContainer !== polygonContainer) {
          this.renderer.drawPolygon(oldPolygonContainer, 'white');
        }
      }
    });


    let draggedLithologyLayer: LithologicalLayer;
    this.renderer.setSidebarMouseDownHandler(event => {
      if (event.button) {
        return;
      }
      if (activeSurvey) {
        const mouse = new Vector2(event.offsetX, event.offsetY);
        const offset = new Vector2(150, 8);
        for (const lithologicalLayer of activeSurvey.lithology) {
          const polygon = new Polygon([
            offset.add(new Vector2(-25, 0)),
            offset.add(new Vector2(25, 0)),
            offset.add(new Vector2(25, lithologicalLayer.depth)),
            offset.add(new Vector2(-25, lithologicalLayer.depth)),
          ]);
          offset.y += lithologicalLayer.depth;
          if (polygon.contains(mouse)) {
            draggedLithologyLayer = lithologicalLayer;
            break;
          }
        }
      }
    });

    this.renderer.setSidebarMouseUpHandler(event => {
      if (event.button) {
        return;
      }
      draggedLithologyLayer = null;
    });

    this.renderer.setSidebarMouseMoveHandler(event => {
      if (event.button) {
        return;
      }
      if (draggedLithologyLayer) {
        draggedLithologyLayer.depth += event.movementY;
        this.renderer.drawSurvey(activeSurvey);
        this.updateQuantities();
      }
    });

    this.renderer.lithoChangeHandler = () => {
      this.updateQuantities();
    };
  }
  get lines(): Line[] {
    return this.contour.edges().concat(this.axes);
  }
  get scale(): number {
    return this.kutch.len() / 10;
  }
  nearestLineIndexFrom(v: Vector2, threshold = +Infinity, lines = this.lines): number {
    let nearestLineIndex = -1;
    let nearestDist = +Infinity;
    let dist: number;
    for (let i = 0; i < lines.length; i++) {
      dist = lines[i].nearestTo(v).sub(v).len();
      if (dist < threshold && dist < nearestDist) {
        nearestDist = dist;
        nearestLineIndex = i;
      }
    }
    return nearestLineIndex;
  }
  nearestSurveyIndexFrom(v: Vector2, threshold = +Infinity): number {
    let nearestSurveyIndex = -1;
    let nearestDist = +Infinity;
    let dist: number;
    for (let i = 0; i < this.surveys.length; i++) {
      dist = this.surveys[i].coordinates.sub(v).len();
      if (dist < threshold && dist < nearestDist) {
        nearestDist = dist;
        nearestSurveyIndex = i;
      }
    }
    return nearestSurveyIndex;
  }
  addSurvey(coordinates: Vector2): void {
    let container: Polygon;
    for (const polygon of this.polygons) {
      if (polygon.contains(coordinates)) {
        container = polygon;
        break;
      }
    }
    const survey = new Survey(coordinates, [
      new LithologicalLayer('non identifié', 50),
      new LithologicalLayer('non identifié', 50),
      new LithologicalLayer('non identifié', 50),
    ], container);
    this.surveys.push(survey);
    this.renderer.drawPoint(coordinates, container ? (container.area() / Math.pow(this.scale, 2)).toFixed(2) + ' m2' : '');
    this.updateQuantities();
  }
  // TODO: cleanup add update render and other weird functions
  updateSurvey(survey: Survey): void {
    survey.polygon = null;
    for (const polygon of this.polygons) {
      if (polygon.contains(survey.coordinates)) {
        survey.polygon = polygon;
        break;
      }
    }
    this.renderer.drawPoint(survey.coordinates, survey.polygon ? (survey.polygon.area() / Math.pow(this.scale, 2)).toFixed(2) + ' m2' : '');
    this.updateQuantities();
  }
  updateQuantities(): void {
    this.quantities.clear();
    this.surveys.forEach(survey => {
      survey.quantities().forEach((quantity, type) => {
        this.quantities.set(type, (this.quantities.get(type) || 0) + quantity);
      });
    });
    this.renderer.drawQuantities(this.quantities, this.scale);
  }
  initIntersectionData(
    at = this.lines.length,
    lineCount = this.lines.length,
    intersectionTimes = this.intersectionTimes,
    intersections = this.intersections,
    intersectionIndex = this.intersectionIndex,
  ): void {
    const newIntersectionTimes: number[] = [];
    const newIntersectionIndex: number[] = [];
    for (let i = 0; i < lineCount; i++) {
      intersectionTimes[i].splice(at, 0, NaN);
      intersections.push(new Vector2());
      intersectionIndex[i].splice(at, 0, intersections.length - 1);
      newIntersectionTimes.push(NaN);
      newIntersectionIndex.push(intersections.length - 1);
    }
    newIntersectionTimes.splice(at, 0, NaN);
    newIntersectionIndex.splice(at, 0, -1);
    intersectionTimes.splice(at, 0, newIntersectionTimes);
    intersectionIndex.splice(at, 0, newIntersectionIndex);
  }
  addLine(line: Line): void {
    // append new contour at the end of lines
    const lines = this.lines;
    const at = lines.length;
    this.initIntersectionData(at, at);
    this.axes.push(line);
    this.renderer.drawLine(line, at.toString());
    this.updateIntersectionTimes(at);
  }
  addContour(line: Line): void {
    // TODO optimization
    // append new contour at the begin of lines
    const edgeCount = this.contour.edgeCount();
    let lineCount = edgeCount + this.axes.length;
    this.initIntersectionData(0, lineCount++);
    this.initIntersectionData(0, lineCount++);
    this.contour.vertices.splice(0, 0, line.v1, line.v2);
    this.renderer.drawContour(this.contour);
    const lines = this.lines;
    if (edgeCount === 0) {
      this.updateIntersectionTimes(0, lines, true);
      this.updateIntersectionTimes(1, lines);
    } else {
      this.updateIntersectionTimes(0, lines, true);
      this.updateIntersectionTimes(1, lines, true);
      this.updateIntersectionTimes(lineCount - 1, lines);
    }
  }
  updateIntersectionTimes(
    at: number,
    lines = this.lines,
    skipRender = false,
    intersectionTimes = this.intersectionTimes,
    intersections = this.intersections,
    intersectionIndex = this.intersectionIndex,
  ): void {
    const line = lines[at];
    let times: Vector2;
    for (let i = 0; i < lines.length; i++) {
      if (i !== at) {
        times = lines[i].intersectionTimesWith(line);
        intersectionTimes[i][at] = times.x;
        intersectionTimes[at][i] = times.y;
        if (i < at) {
          intersections[intersectionIndex[i][at]] = lines[i].pointAt(times.x);
        } else {
          intersections[intersectionIndex[at][i]] = lines[i].pointAt(times.x);
        }
      }
    }
    if (!skipRender) {
      this.renderIntersections();
    }
  }
  renderIntersections(): void {
    // this.renderer.clearIntersections();
    // this.intersections.forEach(intersection => {
    //   this.renderer.drawPoint(intersection);
    // });
    this.renderer.clearPolygons();
    this.polygons = [];
    const partials = this.buildPartialsFromIntersectionTimes();
    const polygonIndexes = this.buildPolygonIndexesFromPartials(partials);
    const polygons = polygonIndexes.map(polygonIndex => new Polygon(polygonIndex.map(i => this.intersections[i])));
    polygons.forEach(polygon => {
      if (polygon.area() > 0) {
        this.polygons.push(polygon);
        this.renderer.drawPolygon(polygon, 'white');
      }
    });
    this.surveys.forEach(survey => this.updateSurvey(survey));
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
    const edgeCount = this.contour.edgeCount();
    const intersectionTimesSortedIndexArray = intersectionTimes
      .map((intersectionTimesAtI, i) => {
        return intersectionTimesAtI
          .map((_, j) => j)
          .filter(j => {
            return !isNaN(intersectionTimesAtI[j]) && 0 <= intersectionTimesAtI[j] && intersectionTimesAtI[j] <= 1 &&
              !isNaN(intersectionTimes[j][i]) && 0 <= intersectionTimes[j][i] && intersectionTimes[j][i] <= 1 &&
              // only takes intersection with or inside contour (TODO: remove polygons is contour concavities)
              (i < edgeCount || j < edgeCount || this.contour.contains(this.intersections[intersectionIndex[i][j]]));
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