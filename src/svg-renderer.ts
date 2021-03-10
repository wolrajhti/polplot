import { PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";
import { Polygon } from "./polygon";
import { Vector2 } from "./vector2";

const gTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'g');
gTemplate.setAttribute('stroke', 'black');
gTemplate.setAttribute('stroke-width', '0.4px');

const lineTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'line');
lineTemplate.setAttribute('stroke-dasharray', '10, 4, 1, 4');

const anchorTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
anchorTemplate.setAttribute(
  'd',
  'M 0, 0' +
  'A 10, 10, 0, 0, 0, -5, -5' + 
  'A 10, 10, 0, 1, 1, 5, -5' +
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

const pointTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
pointTemplate.setAttribute('fill', 'green');
pointTemplate.setAttribute('r', '3');

const polygonTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
polygonTemplate.setAttribute('fill', 'green');
polygonTemplate.setAttribute('fill-opacity', '0.7');
polygonTemplate.setAttribute('stroke-width', '3');
polygonTemplate.setAttribute('stroke', 'grey');

export class SvgRenderer implements PolplotRenderer {
  readonly svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private intersectionContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  private polygonContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  private svgGByLine = new Map<Line, SVGGElement>();
  private lineBySvgG = new Map<SVGGElement, Line>();
  private handlers: Record<string, (event: MouseEvent) => void> = {};
  constructor() {
    this.svg.appendChild(this.intersectionContainer);
    this.svg.appendChild(this.polygonContainer);
  }
  private _setEventHandler(event: string, handler: (event: MouseEvent) => void): void {
    if (this.handlers[event]) {
      this.svg.removeEventListener(event, this.handlers[event]);
    }
    this.handlers[event] = handler;
    this.svg.addEventListener(event, this.handlers[event]);
  }
  setMouseDownHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler('mousedown', handler);
  }
  setMouseUpHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler('mouseup', handler);
  }
  setMouseMoveHandler(handler: (event: MouseEvent) => void): void {
    this._setEventHandler('mousemove', handler);
  }
  drawLine(line: Line, name: string): void {
    let svgG: SVGGElement;
    if (!this.svgGByLine.has(line)) {
      svgG = gTemplate.cloneNode(true) as SVGGElement;
      this.svg.appendChild(svgG);
      this.svgGByLine.set(line, svgG);
      this.lineBySvgG.set(svgG, line);
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
      this.svg.removeChild(svgG);
      this.svgGByLine.delete(line);
    }
  }
  drawPoint(point: Vector2): void {
    const svgCircle = pointTemplate.cloneNode() as SVGCircleElement;
    svgCircle.setAttribute('cx', point.x.toFixed());
    svgCircle.setAttribute('cy', point.y.toFixed());
    this.intersectionContainer.appendChild(svgCircle);
  }
  private clearContainer(container: SVGGElement): void {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
  clearIntersections(): void {
    this.clearContainer(this.intersectionContainer);
  }
  drawPolygon(polygon: Polygon): void {
    const svgPath = polygonTemplate.cloneNode() as SVGPathElement;
    svgPath.setAttribute('d', 'M ' + polygon.vertices.map(v => `${v.x.toFixed()} ${v.y.toFixed()}`).join(' L ') + 'Z');
    svgPath.setAttribute('fill', '#' + (Math.floor((16777215 - 1e5) * Math.random()) + 1e5).toString(16));
    this.polygonContainer.appendChild(svgPath);
  }
  clearPolygons(): void {
    this.clearContainer(this.polygonContainer);
  }
}