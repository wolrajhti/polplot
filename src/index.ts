import { PolPlot } from "./polplot";
import { SvgRenderer } from "./svg-renderer";

const svgRenderer = new SvgRenderer();
const polplot = new PolPlot(svgRenderer);
const body = document.querySelector('body');
body.appendChild(svgRenderer.svg);