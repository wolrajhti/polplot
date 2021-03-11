import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { LithologicalLayer } from "./lithological-layer";
import { Polygon } from "./polygon";
import { Survey } from "./survey";
import { Vector2 } from "./vector2";

const CLICK_THRESHOLD = 20;

const enum Modes {
  Polygon,
  Line,
  Survey
}

export class Polplot {
  lines: Line[] = [];
  intersectionTimes: number[][] = [];
  intersections: Vector2[] = [];
  intersectionIndex: number[][] = [];
  polygons: Polygon[] = [];
  surveys: Survey[] = [];
  quantities = new Map<string, number>();
  mode = Modes.Line;
  constructor(readonly renderer: PolplotRenderer) {
    // remove next hacky eventListener
    document.addEventListener('keyup', event => {
      if (event.key === 's') {
        this.mode = Modes.Survey;
      } else if (event.key === 'l') {
        this.mode = Modes.Line;
        this.renderer.clearSurvey();
      } else if (event.key === 'Escape') {
        this.renderer.clearSurvey();
      }
    });

    let draggedLineIndex = -1;
    let draggedVector2: Vector2;
    let draggedSurveyIndex = -1;
    this.renderer.setMouseDownHandler(event => {
      // return if click is not from mouse left button
      if (event.button) {
        return;
      }
      const mouse = new Vector2(event.clientX, event.clientY);
      if (this.mode === Modes.Line) {
        draggedLineIndex = this.nearestLineIndexFrom(mouse, CLICK_THRESHOLD);
        if (draggedLineIndex === -1) {
          this.addLine(new Line(mouse.x, mouse.y, mouse.x, mouse.y));
          draggedLineIndex = this.lines.length - 1;
          draggedVector2 = this.lines[draggedLineIndex].v2;
        } else if (mouse.sub(this.lines[draggedLineIndex].v1).len() < CLICK_THRESHOLD) {
          draggedVector2 = this.lines[draggedLineIndex].v1;
        } else if (mouse.sub(this.lines[draggedLineIndex].v2).len() < CLICK_THRESHOLD) {
          draggedVector2 = this.lines[draggedLineIndex].v2;
        }
      } else if (this.mode === Modes.Survey) {
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
      if (this.mode === Modes.Line) {
        draggedLineIndex = -1;
        draggedVector2 = null;
      } else if (this.mode === Modes.Survey) {
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
      if (this.mode === Modes.Line) {
        if (draggedVector2) {
          draggedVector2.x += event.movementX;
          draggedVector2.y += event.movementY;
          this.updateIntersectionTimes(this.lines[draggedLineIndex]);
          this.renderer.drawLine(this.lines[draggedLineIndex], draggedLineIndex.toString());
        } else if (draggedLineIndex !== -1) {
          this.lines[draggedLineIndex].update(event.movementX, event.movementY, event.movementX, event.movementY);
          this.updateIntersectionTimes(this.lines[draggedLineIndex]);
          this.renderer.drawLine(this.lines[draggedLineIndex], draggedLineIndex.toString());
        }
      } else if (this.mode === Modes.Survey) {
        if (draggedSurveyIndex !== -1) {
          this.surveys[draggedSurveyIndex].coordinates.x += event.movementX;
          this.surveys[draggedSurveyIndex].coordinates.y += event.movementY;
          this.updateSurvey(this.surveys[draggedSurveyIndex]);
        }
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
    });


    let draggedLithologyLayer: LithologicalLayer;
    this.renderer.setSidebarMouseDownHandler(event => {
      if (event.button) {
        return;
      }
      if (activeSurvey) {
        const mouse = new Vector2(event.offsetX, event.offsetY);
        const offset = new Vector2(300, 100);
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
  nearestLineIndexFrom(v: Vector2, threshold = +Infinity): number {
    let nearestLineIndex = -1;
    let nearestDist = +Infinity;
    let dist: number;
    for (let i = 0; i < this.lines.length; i++) {
      dist = this.lines[i].nearestTo(v).sub(v).len();
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
    this.renderer.drawPoint(coordinates, container ? (container.area() / (10 * 10)).toFixed(2) + ' m2' : '');
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
    this.renderer.drawPoint(survey.coordinates, survey.polygon ? (survey.polygon.area() / (10 * 10)).toFixed(2) + ' m2' : '');
    this.updateQuantities();
  }
  updateQuantities(): void {
    this.quantities.clear();
    this.surveys.forEach(survey => {
      survey.quantities().forEach((quantity, type) => {
        this.quantities.set(type, (this.quantities.get(type) || 0) + quantity);
      });
    });
    this.renderer.drawQuantities(this.quantities);
  }
  addLine(line: Line): void {
    this.addIntersectionTimes(line);
    this.lines.push(line);
    this.renderer.drawLine(line, (this.lines.length - 1).toString());
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