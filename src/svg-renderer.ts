import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { Polygon } from "./polygon";
import { Survey } from "./survey";
import { Vector2 } from "./vector2";

// line
const gTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'g');
gTemplate.setAttribute('stroke', 'black');
gTemplate.setAttribute('stroke-width', '0.4px');

const lineTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'line');
lineTemplate.setAttribute('stroke-dasharray', '10, 4, 1, 4');

const anchorTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
anchorTemplate.setAttribute(
  'd',
  'M 0, 0 ' +
  'A 10, 10, 0, 0, 0, -5, -5 ' +
  'A 10, 10, 0, 1, 1, 5, -5 ' +
  'A 10, 10, 0, 0, 0, 0, 0'
);
anchorTemplate.setAttribute('fill', 'white');

const textTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'text');
textTemplate.setAttribute('text-anchor', 'middle');
textTemplate.setAttribute('alignment-baseline', 'central');
textTemplate.setAttribute('font-family', 'consolas, "Liberation Mono", courier, monospace');
textTemplate.setAttribute('font-weight', '100');
textTemplate.setAttribute('font-size', '14px');

gTemplate.appendChild(lineTemplate);
gTemplate.appendChild(anchorTemplate);
gTemplate.appendChild(anchorTemplate.cloneNode());
gTemplate.appendChild(textTemplate);
gTemplate.appendChild(textTemplate.cloneNode());

// point
const gPointTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'g');
gPointTemplate.setAttribute('stroke', 'black');
gPointTemplate.setAttribute('stroke-width', '0.4px');

const pointTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
pointTemplate.setAttribute('fill', 'green');
pointTemplate.setAttribute('r', '3');

const textPointTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'text');
textPointTemplate.setAttribute('transform', 'translate(0, 10)');
textPointTemplate.setAttribute('text-anchor', 'middle');
textPointTemplate.setAttribute('alignment-baseline', 'hanging');
textPointTemplate.setAttribute('font-family', 'consolas, "Liberation Mono", courier, monospace');
textPointTemplate.setAttribute('font-weight', '100');
textPointTemplate.setAttribute('font-size', '14px');
textPointTemplate.setAttribute('font-style', 'italic');

gPointTemplate.appendChild(pointTemplate);
gPointTemplate.appendChild(textPointTemplate);

// polygon
const polygonTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
polygonTemplate.setAttribute('fill', 'green');
polygonTemplate.setAttribute('fill-opacity', '0.7');
polygonTemplate.setAttribute('stroke-width', '0.8px');
polygonTemplate.setAttribute('stroke-dasharray', '5, 2');
polygonTemplate.setAttribute('stroke', 'black');

// survey
const gSurveyTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'g');
gSurveyTemplate.setAttribute('transform', 'translate(300, 100)');

const surveyBottomPolygonTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
surveyBottomPolygonTemplate.setAttribute('fill', 'url(#earth-hatch)');
surveyBottomPolygonTemplate.setAttribute('stroke-width', '0');

const surveyTopPolygonTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
surveyTopPolygonTemplate.setAttribute('fill-opacity', '0');
surveyTopPolygonTemplate.setAttribute('stroke', 'black');
surveyTopPolygonTemplate.setAttribute('stroke-width', '0.8px');

const surveyLithologyTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'g');

gSurveyTemplate.appendChild(surveyLithologyTemplate);
gSurveyTemplate.appendChild(surveyBottomPolygonTemplate);
gSurveyTemplate.appendChild(surveyTopPolygonTemplate);

// lithologicalLayer
const lithologicalLayerRectTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

// earthHatch
const hatchPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
hatchPattern.id = 'earth-hatch';
hatchPattern.setAttribute('patternUnits', 'userSpaceOnUse');
hatchPattern.setAttribute('width', '25');
hatchPattern.setAttribute('height', '25');
hatchPattern.setAttribute('stroke', '#222d32');
hatchPattern.setAttribute('stroke-width', '0.4px');

let hatchPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
const hatchDs = [
  'M-1,1 l2,-2',
  'M-1,9 l10,-10',

  'M-1,18 l4,-4',
  'M-1,26 l8,-8',
  // 'M6,26 l4,-4',
  'M7,26 l4,-4',

  // 'M15,26 l10,-10',
  'M16,26 l10,-10',
  // 'M23,26 l2,-2',
  'M24,26 l2,-2',

  'M14,3 l4,-4',
  'M18,7 l8,-8',
  'M22,11 l4,-4',

  'M2,11 l13,13',
  'M6,7 l13,13',
  'M10,3 l13,13',
];
for (const d of hatchDs) {
  hatchPath.setAttribute('d', d);
  hatchPattern.appendChild(hatchPath);
  hatchPath = hatchPath.cloneNode() as SVGPathElement
}

// type select
const selectTemplate = document.createElement('select');
selectTemplate.style.position = 'absolute';
selectTemplate.style.transform = 'translateY(-49%)';
selectTemplate.style.left = '24px';
let optionTemplate = document.createElement('option');
const values = [
  'non identifié',
  'argile',
  'calcaire'
];
const colors = new Map([
  [values[0], '#fde312'],
  [values[1], '#289fde'],
  [values[2], '#abfe12']
]);

for (const value of values) {
  optionTemplate.innerHTML = value;
  optionTemplate.setAttribute('value', value);
  selectTemplate.appendChild(optionTemplate);
  optionTemplate = optionTemplate.cloneNode() as HTMLOptionElement;
}

// quantity
const pTemplate = document.createElement('p');
pTemplate.style.borderLeftWidth = '14px';
pTemplate.style.fontFamily = 'consolas, "Liberation Mono", courier, monospace';
pTemplate.style.fontWeight = '100';
pTemplate.style.fontSize = '14px';
pTemplate.style.height = '14px';
pTemplate.style.paddingLeft = '8px';

// contour
const contourTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
contourTemplate.setAttribute('fill', '#0005');

export class SvgRenderer implements PolplotRenderer {
  private svg: SVGElement;
  private sidebarDiv: HTMLDivElement;
  private sidebarSvg: SVGElement;
  private selectContainer = document.createElement('div');
  private pointContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  private polygonContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  private lineContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  private surveyContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  private quantitiesContainer: HTMLDivElement;
  private svgGByLine = new Map<Line, SVGGElement>();
  private svgPathByPolygon = new Map<Polygon, SVGPathElement>();
  private svgGByPoint = new Map<Vector2, SVGGElement>();
  private handlers: Record<string, (event: MouseEvent) => void> = {};
  public lithoChangeHandler: () => void;
  private svgContourPath: SVGPathElement;
  constructor() {
    this.svgContourPath = contourTemplate.cloneNode() as SVGPathElement;
    this.svg = document.querySelector('.content');
    this.sidebarDiv = document.querySelector('.sidebar');
    this.sidebarSvg = document.querySelector('.sidebar > svg');
    this.svg.prepend(this.svgContourPath);
    this.svg.appendChild(hatchPattern);
    this.svg.appendChild(this.polygonContainer);
    this.svg.appendChild(this.lineContainer);
    this.svg.appendChild(this.pointContainer);
    this.quantitiesContainer = document.querySelector('.quantities.container');
    this.sidebarSvg.appendChild(this.surveyContainer);
    this.sidebarDiv.appendChild(this.selectContainer);
  }
  private _setEventHandler(svg: SVGElement, event: string, handler: (event: MouseEvent) => void): void {
    if (this.handlers[event]) {
      svg.removeEventListener(event, this.handlers[event]);
    }
    this.handlers[event] = handler;
    svg.addEventListener(event, this.handlers[event]);
  }
  setMouseDownHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler(this.svg, 'mousedown', handler);
  }
  setMouseUpHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler(this.svg, 'mouseup', handler);
  }
  setMouseMoveHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler(this.svg, 'mousemove', handler);
  }
  setSidebarMouseDownHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler(this.sidebarSvg, 'mousedown', handler);
  }
  setSidebarMouseUpHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler(this.sidebarSvg, 'mouseup', handler);
  }
  setSidebarMouseMoveHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler(this.sidebarSvg, 'mousemove', handler);
  }
  drawLine(line: Line, name: string): void {
    let svgG: SVGGElement;
    if (!this.svgGByLine.has(line)) {
      svgG = gTemplate.cloneNode(true) as SVGGElement;
      this.lineContainer.appendChild(svgG);
      this.svgGByLine.set(line, svgG);
    } else {
      svgG = this.svgGByLine.get(line);
    }
    const svgLine = svgG.children[0] as SVGLineElement;
    const svgPathAnchorStart = svgG.children[1] as SVGPathElement;
    const svgPathAnchorEnd = svgG.children[2] as SVGPathElement;
    const svgTextStart = svgG.children[3] as SVGTextElement;
    const svgTextEnd = svgG.children[4] as SVGTextElement;
    const x1 = line.x1.toFixed();
    const y1 = line.y1.toFixed();
    const x2 = line.x2.toFixed();
    const y2 = line.y2.toFixed();
    svgLine.setAttribute('x1', x1);
    svgLine.setAttribute('y1', y1);
    svgLine.setAttribute('x2', x2);
    svgLine.setAttribute('y2', y2);
    svgTextStart.innerHTML = name;
    svgTextEnd.innerHTML = name;
    const angle = 180 * (line.v2.sub(line.v1).angle() - Math.PI / 2) / Math.PI;
    const before = line.before(14);
    const after = line.after(14);
    svgPathAnchorStart.setAttribute('transform', `translate(${x1}, ${y1}) rotate(${isNaN(angle) ? 0 : angle})`);
    svgPathAnchorEnd.setAttribute('transform', `translate(${x2}, ${y2}) rotate(${isNaN(angle) ? 0 : 180 + angle})`);
    svgTextStart.setAttribute('transform', `translate(${isNaN(before.x) ? x1 : before.x.toFixed()}, ${isNaN(before.y) ? y1 : before.y.toFixed()})`);
    svgTextEnd.setAttribute('transform', `translate(${isNaN(after.x) ? x2 : after.x.toFixed()}, ${isNaN(after.y) ? y2 : after.y.toFixed()})`);
  }
  eraseLine(line: Line): void {
    const svgG = this.svgGByLine.get(line);
    if (svgG) {
      this.lineContainer.removeChild(svgG);
      this.svgGByLine.delete(line);
    }
  }
  drawPoint(point: Vector2, name: string): void {
    let svgG: SVGGElement;
    if (!this.svgGByPoint.has(point)) {
      svgG = gPointTemplate.cloneNode(true) as SVGGElement;
      this.pointContainer.appendChild(svgG);
      this.svgGByPoint.set(point, svgG);
    } else {
      svgG = this.svgGByPoint.get(point);
    }
    const svgText = svgG.children[1] as SVGTextElement;
    svgG.setAttribute('transform', `translate(${point.x.toFixed()}, ${point.y.toFixed()})`);
    svgText.innerHTML = name;
  }
  private clearContainer(container: Element): void {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
  clearIntersections(): void {
    this.clearContainer(this.pointContainer);
  }
  drawPolygon(polygon: Polygon, fill = '#' + (Math.floor((16777215 - 1e5) * Math.random()) + 1e5).toString(16)): void {
    let svgPath: SVGPathElement;
    if (!this.svgPathByPolygon.has(polygon)) {
      svgPath = polygonTemplate.cloneNode() as SVGPathElement;
      this.polygonContainer.appendChild(svgPath);
      this.svgPathByPolygon.set(polygon, svgPath);
    } else {
      svgPath = this.svgPathByPolygon.get(polygon);
    }
    svgPath.setAttribute('d', 'M ' + polygon.vertices.map(v => `${v.x.toFixed()} ${v.y.toFixed()}`).join(' L ') + ' Z');
    svgPath.setAttribute('fill', fill);
  }
  drawContour(polygon: Polygon): void {
    this.svgContourPath.setAttribute('d', 'M ' + polygon.vertices.map(v => `${v.x.toFixed()} ${v.y.toFixed()}`).join(' L ') + ' Z');
  }
  clearPolygons(): void {
    this.clearContainer(this.polygonContainer);
  }

  drawSurvey(survey: Survey): void {
    this.clearContainer(this.surveyContainer);
    this.clearContainer(this.selectContainer);
    const WIDTH = 200;
    const THICKNESS = 10;
    const DIAMETER = 50;
    const d = `M ${(-WIDTH / 2).toFixed()}, 0 ` +
      `h ${((WIDTH - DIAMETER) / 2).toFixed()} ` +
      `v ${survey.depth().toFixed()} ` +
      `h ${DIAMETER.toFixed()} ` +
      `v ${-survey.depth().toFixed()} ` +
      `h ${((WIDTH - DIAMETER) / 2).toFixed()}`;
    const dBottom = d + ' ' +
      `v ${THICKNESS.toFixed()} ` +
      `h ${(THICKNESS - (WIDTH - DIAMETER) / 2).toFixed()} ` +
      `v ${survey.depth().toFixed()} ` +
      `h ${(-(2 * THICKNESS + DIAMETER)).toFixed()} ` +
      `v ${-survey.depth().toFixed()} ` +
      `h ${(THICKNESS - (WIDTH - DIAMETER) / 2).toFixed()} Z`;

    const svgG = gSurveyTemplate.cloneNode(true) as SVGGElement;
    const lithology = svgG.children[0] as SVGGElement;
    const bottomPolygon = svgG.children[1] as SVGPathElement;
    const topPolygon = svgG.children[2] as SVGPathElement;
    bottomPolygon.setAttribute('d', dBottom);
    topPolygon.setAttribute('d', d);

    let top = 0;
    for (let i = 0; i < survey.lithology.length; i++) {
      const lithologicalLayer = lithologicalLayerRectTemplate.cloneNode() as SVGRectElement;
      lithologicalLayer.setAttribute('x', (-DIAMETER / 2).toFixed());
      lithologicalLayer.setAttribute('y', top.toFixed());
      lithologicalLayer.setAttribute('width', DIAMETER.toFixed());
      lithologicalLayer.setAttribute('height', survey.lithology[i].depth.toFixed());
      lithologicalLayer.setAttribute('fill', colors.get(survey.lithology[i].type));
      lithology.appendChild(lithologicalLayer);

      const select = selectTemplate.cloneNode(true) as HTMLSelectElement;
      select.querySelector(`option[value="${survey.lithology[i].type}"]`).setAttribute('selected', 'selected');
      select.addEventListener('change', event => {
        survey.lithology[i].type = select.value;
        lithologicalLayer.setAttribute('fill', colors.get(select.value));
        this.lithoChangeHandler();
      });
      select.style.top = (top + 100 + survey.lithology[i].depth / 2).toFixed() + 'px';

      this.selectContainer.appendChild(select);

      top += survey.lithology[i].depth;
    }

    this.surveyContainer.appendChild(svgG);
    this.sidebarDiv.classList.add('visible');
  }
  clearSurvey(): void {
    this.sidebarDiv.classList.remove('visible');
    this.clearContainer(this.surveyContainer);
    this.clearContainer(this.selectContainer);
  }
  drawQuantities(quantities: Map<string, number>): void {
    this.clearContainer(this.quantitiesContainer);
    quantities.forEach((quantity, type) => {
      const p = pTemplate.cloneNode() as HTMLParagraphElement;
      p.innerHTML = `${type} (${(quantity / (10 * 10 * 50)).toFixed(2)} m³)`;
      p.style.borderLeft = `8px solid ${colors.get(type)}`;
      this.quantitiesContainer.appendChild(p);
    });
  }
}