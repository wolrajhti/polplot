import { Line } from './line';
import { Vector2 } from './vector2';

export class InterRenderer {
  intersectionTimes: Vector2[][] = [];
  intersections = new Map<Line, Map<Line, SVGCircleElement>>();
  constructor(readonly svg: SVGSVGElement) {

  }
  addLine(lines: Line[], line: Line): void {
    let interTimes: Vector2;
    for (let i = 0; i < lines.length - 1; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[i] === line || lines[j] === line) {
          interTimes = lines[i].intersectionTimesWith(lines[j]);
          if (interTimes && 0 <= interTimes.x && interTimes.x < 1) {
            const intersections = this.intersections.get(lines[i]) || new Map<Line, SVGCircleElement>();
            if (intersections.has(lines[j])) {
              this.erase(intersections.get(lines[j]));
            }
            intersections.set(lines[j], this.draw(lines[i].v1.add(lines[i].v2.sub(lines[i].v1).mul(interTimes.x))));
          }
        }
      }
    }
  }
  removeLine(line: Line): void {
    this.intersections.forEach((intersections, l) => {
      if (l === line) {
        intersections.forEach(inter => this.erase(inter));
      } else if (intersections.has(line)) {
        this.erase(intersections.get(line));
        intersections.delete(line);
      }
    });
    this.intersections.delete(line);
  }
  draw(inter: Vector2): SVGCircleElement {
    const svgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    svgCircle.setAttribute('fill', 'green');
    svgCircle.setAttribute('r', '3');
    svgCircle.setAttribute('cx', inter.x.toFixed());
    svgCircle.setAttribute('cy', inter.y.toFixed());
    this.svg.appendChild(svgCircle);
    return svgCircle;
  }
  erase(svgCircleElement: SVGCircleElement): SVGCircleElement {
    return this.svg.removeChild(svgCircleElement);
  }
}