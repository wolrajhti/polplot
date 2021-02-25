import { Line } from './line';
import { LineRenderer } from './lineRenderer';

const body = document.querySelector('body');

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

const lines: Line[] = [];
let x1: number = null;
let y1: number = null;
const lineRenderer = new LineRenderer(svg);

let elementAt: Element;

svg.addEventListener('mousedown', event => {
  if (
    (elementAt = document.elementFromPoint(event.clientX, event.clientY)) &&
    elementAt instanceof SVGCircleElement
  ) {
    lineRenderer.drag(elementAt);
  }
});

svg.addEventListener('mouseup', event => {
  if (lineRenderer.isDragging()) {
    lineRenderer.drop();
  } else {
    if (x1 === null && y1 === null) {
      // record tmp point
      x1 = event.clientX;
      y1 = event.clientY;
    } else {
      const line = new Line(x1, y1, event.clientX, event.clientY);
      x1 = null;
      y1 = null;
      lines.push(line);
      lineRenderer.draw(lines, line);
    }
  }
});

svg.addEventListener('mousemove', event => {
  lineRenderer.moveTo(lines, event.clientX, event.clientY);
});

body.appendChild(svg);