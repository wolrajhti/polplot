import { Line } from './line';
import { InterRenderer } from './interRenderer';

export class LineRenderer {
  private svgLines = new Map<Line, SVGLineElement>();
  private startSvgCircles = new Map<Line, SVGCircleElement>();
  private endSvgCircles = new Map<Line, SVGCircleElement>();
  private lines = new Map<SVGLineElement, Line>();
  private startCircles = new Map<SVGCircleElement, Line>();
  private endCircles = new Map<SVGCircleElement, Line>();
  private draggedCircle: SVGCircleElement;

  private interRenderer = new InterRenderer(this.svg);

  constructor(readonly svg: SVGSVGElement) {

  }
  isDragging(): boolean {
    return !!this.draggedCircle;
  }
  draw(lines: Line[], line: Line) {
    let svgLine: SVGLineElement;
    let startSvgCircle: SVGCircleElement;
    let endSvgCircle: SVGCircleElement;
    if (!this.svgLines.has(line)) {
      svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svgLine.setAttribute('stroke', 'black');
      this.svgLines.set(line, svgLine);
      this.lines.set(svgLine, line);
      this.svg.appendChild(svgLine);
      startSvgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      startSvgCircle.setAttribute('fill', 'red');
      startSvgCircle.setAttribute('r', '5');
      this.startSvgCircles.set(line, startSvgCircle);
      this.startCircles.set(startSvgCircle, line);
      this.svg.appendChild(startSvgCircle);
      endSvgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      endSvgCircle.setAttribute('fill', 'blue');
      endSvgCircle.setAttribute('r', '5');
      this.endSvgCircles.set(line, endSvgCircle);
      this.endCircles.set(endSvgCircle, line);
      this.svg.appendChild(endSvgCircle);
    } else {
      svgLine = this.svgLines.get(line);
      startSvgCircle = this.startSvgCircles.get(line);
      endSvgCircle = this.endSvgCircles.get(line);
    }
    svgLine.setAttribute('x1', line.x1.toFixed());
    svgLine.setAttribute('y1', line.y1.toFixed());
    svgLine.setAttribute('x2', line.x2.toFixed());
    svgLine.setAttribute('y2', line.y2.toFixed());
    startSvgCircle.setAttribute('cx', line.before(10).x.toFixed());
    startSvgCircle.setAttribute('cy', line.before(10).y.toFixed());
    endSvgCircle.setAttribute('cx', line.after(10).x.toFixed());
    endSvgCircle.setAttribute('cy', line.after(10).y.toFixed());
    this.interRenderer.addLine(lines, line);
  }
  drag(circle: SVGCircleElement): void {
    this.draggedCircle = circle;
  }
  moveTo(lines: Line[], x: number, y: number): void {
    if (this.startCircles.has(this.draggedCircle)) {
      const line = this.startCircles.get(this.draggedCircle);
      const newLine = new Line(x, y, line.x2, line.y2);
      line.v1 = newLine.before(-10);
      this.draw(lines, line);
    } else if (this.endCircles.has(this.draggedCircle)) {
      const line = this.endCircles.get(this.draggedCircle);
      const newLine = new Line(line.x1, line.y1, x, y);
      line.v2 = newLine.after(-10);
      this.draw(lines, line);
    }
  }
  drop(): void {
    this.draggedCircle = null;
  }
}