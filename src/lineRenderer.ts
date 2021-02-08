import { Line } from './line';



export class LineRenderer {
  private svgLines = new Map<Line, SVGLineElement>();
  private startSvgCircles = new Map<Line, SVGCircleElement>();
  private endSvgCircles = new Map<Line, SVGCircleElement>();
  private lines = new Map<SVGLineElement, Line>();
  private startCircles = new Map<SVGCircleElement, Line>();
  private endCircles = new Map<SVGCircleElement, Line>();
  private draggedCircle: SVGCircleElement;
  constructor(readonly svg: SVGSVGElement) {

  }
  isDragging(): boolean {
    return !!this.draggedCircle;
  }
  draw(line: Line) {
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
    startSvgCircle.setAttribute('cx', line.xBefore(10).toFixed());
    startSvgCircle.setAttribute('cy', line.yBefore(10).toFixed());
    endSvgCircle.setAttribute('cx', line.xAfter(10).toFixed());
    endSvgCircle.setAttribute('cy', line.yAfter(10).toFixed());
  }
  drag(circle: SVGCircleElement): void {
    this.draggedCircle = circle;
  }
  moveTo(x: number, y: number): void {
    if (this.startCircles.has(this.draggedCircle)) {
      const line = this.startCircles.get(this.draggedCircle);
      const newLine = new Line(x, y, line.x2, line.y2);
      line.x1 = newLine.xBefore(-10);
      line.y1 = newLine.yBefore(-10);
      this.draw(line);
    } else if (this.endCircles.has(this.draggedCircle)) {
      const line = this.endCircles.get(this.draggedCircle);
      const newLine = new Line(line.x1, line.y1, x, y);
      line.x2 = newLine.xAfter(-10);
      line.y2 = newLine.yAfter(-10);
      this.draw(line);
    }
  }
  drop(): void {
    this.draggedCircle = null;
  }
}