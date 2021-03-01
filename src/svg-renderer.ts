import { ClickHandler, PolplotRenderer } from "./interfaces/polplot-renderer";
import { Line } from "./line";

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

gTemplate.appendChild(lineTemplate);
gTemplate.appendChild(anchorTemplate);
gTemplate.appendChild(anchorTemplate.cloneNode());

export class SvgRenderer implements PolplotRenderer {
  readonly svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private svgGByLine = new Map<Line, SVGGElement>();
  private lineBySvgG = new Map<SVGGElement, Line>();
  private onMouseDown: (event: MouseEvent) => any;
  private onMouseUp: (event: MouseEvent) => any;
  private onMouseMove: (event: MouseEvent) => any;
  clickHandlerWrapper(clickHandler: ClickHandler): (event: MouseEvent) => any {
    return event => {
      const elementAt = document.elementFromPoint(event.clientX, event.clientY);
      const line = this.lineBySvgG.get(elementAt.parentNode as SVGGElement);
      if (elementAt instanceof SVGPathElement) {
        if (elementAt.parentNode.children[1] === elementAt) {
          clickHandler(event, line, line.v1);
        } else {
          clickHandler(event, line, line.v2);
        }
      } else if (elementAt instanceof SVGLineElement) {
        clickHandler(event, line);
      } else {
        clickHandler(event);
      }
    };
  }
  setMouseDownHandler(clickHandler: ClickHandler): void {
    if (this.onMouseDown) {
      this.svg.removeEventListener('mousedown', this.onMouseDown);
    }
    this.onMouseDown = this.clickHandlerWrapper(clickHandler);
    this.svg.addEventListener('mousedown', this.onMouseDown);
  }
  setMouseUpHandler(clickHandler: ClickHandler): void {
    if (this.onMouseUp) {
      this.svg.removeEventListener('mouseup', this.onMouseUp);
    }
    this.onMouseUp = this.clickHandlerWrapper(clickHandler);
    this.svg.addEventListener('mouseup', this.onMouseUp);
  }
  setMouseMoveHandler(clickHandler: ClickHandler): void {
    if (this.onMouseMove) {
      this.svg.removeEventListener('mousemove', this.onMouseMove);
    }
    this.onMouseMove = this.clickHandlerWrapper(clickHandler);
    this.svg.addEventListener('mousemove', this.onMouseMove);
  }
  drawLine(line: Line, isHovered = false, isSelected = false): void {
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
    const x1 = line.x1.toFixed();
    const y1 = line.y1.toFixed();
    const x2 = line.x2.toFixed();
    const y2 = line.y2.toFixed();
    svgLine.setAttribute('x1', x1);
    svgLine.setAttribute('y1', y1);
    svgLine.setAttribute('x2', x2);
    svgLine.setAttribute('y2', y2);
    if (isHovered) {
      svgG.setAttribute('stroke-width', '0.8px');
    } else {
      svgG.setAttribute('stroke-width', '0.4px');
    }
    if (isSelected) {
      svgG.setAttribute('stroke', '#19a194');
    } else {
      svgG.setAttribute('stroke', 'black');
    }
    const angle = 180 * (line.v2.sub(line.v1).angle() - Math.PI / 2) / Math.PI;
    svgPathAnchorStart.setAttribute('transform', `translate(${x1}, ${y1}) rotate(${isNaN(angle) ? 0 : angle})`);
    svgPathAnchorEnd.setAttribute('transform', `translate(${x2}, ${y2}) rotate(${isNaN(angle) ? 0 : 180 + angle})`);
  }
  eraseLine(line: Line): void {
    const svgG = this.svgGByLine.get(line);
    if (svgG) {
      this.svg.removeChild(svgG);
      this.svgGByLine.delete(line);
    }
  }
}