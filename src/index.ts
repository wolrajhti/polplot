import { Polplot } from "./polplot";
import { SvgRenderer } from "./svg-renderer";

const svgRenderer = new SvgRenderer();
const polplot = new Polplot(svgRenderer);
const body = document.querySelector('body');
body.appendChild(svgRenderer.svg);