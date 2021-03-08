import { PolplotRenderer } from '../src/interfaces/polplot-renderer';
import { Line } from '../src/line';
import { Polplot } from '../src/polplot';
import { Vector2 } from '../src/vector2';

class FakeRenderer implements PolplotRenderer {
  drawLine(): void { }
  eraseLine(): void { }
  clearIntersections(): void { }
  drawPoint(): void { }
  clearPolygons(): void { }
  drawPolygon(): void { }
  setMouseDownHandler(): void { }
  setMouseUpHandler(): void { }
  setMouseMoveHandler(): void { }
}

describe('PolPlot', () => {
  describe('buildPartialsFromPoints', () => {
    const polplot = new Polplot(new FakeRenderer());
    test('case 01: PL, NF, NL, PF', () => {
      //          NF
      //       PL L  NL
      //          PF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          new Vector2(0, 1),
          new Vector2(1, 0),
          new Vector2(0, -1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(4);
      expect(parts[0].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
      expect(parts[1].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(parts[2].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(parts[3].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
    });
    test('case 01: PL, NF, NL, PF (F reversed)', () => {
      //          PF
      //       PL L  NL
      //          NF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          new Vector2(0, -1),
          new Vector2(1, 0),
          new Vector2(0, 1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, 1, 0, -1),
      );
      expect(parts.length).toBe(4);
      parts.forEach(p => console.log(p.toString()));
      // expect(parts[0].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
      // expect(parts[1].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      // expect(parts[2].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      // expect(parts[3].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
    });
    test('case 02: .., NF, NF, PF', () => {
      //          NF
      //          L  NL
      //          PF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          null,
          new Vector2(0, 1),
          new Vector2(1, 0),
          new Vector2(0, -1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(3);
      expect(parts[0].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(parts[1].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(parts[2].toString()).toBe('3 points: (0, 1), (0, 0), (0, -1) (area: 0)');
    });
    test('case 03: .., .., NL, PF', () => {
      //          L  NL
      //          PF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          null,
          null,
          new Vector2(1, 0),
          new Vector2(0, -1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(2);
      expect(parts[0].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(parts[1].toString()).toBe('3 points: (1, 0), (0, 0), (0, -1) (area: -1)');
    });
    test('case 04: .., NF, .., PF', () => {
      //          NF
      //          L
      //          PF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          null,
          new Vector2(0, 1),
          null,
          new Vector2(0, -1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(2);
      expect(parts[0].toString()).toBe('3 points: (0, -1), (0, 0), (0, 1) (area: 0)');
      expect(parts[1].toString()).toBe('3 points: (0, 1), (0, 0), (0, -1) (area: 0)');
    });
    test('case 05: .., NF, NL, ..', () => {
      //          NF
      //          L  NL
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          null,
          new Vector2(0, 1),
          new Vector2(1, 0),
          null,
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(2);
      expect(parts[0].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(parts[1].toString()).toBe('3 points: (0, 1), (0, 0), (1, 0) (area: -1)');
    });
    test('case 06: PL, .., NL, PF', () => {
      //       PL L  NL
      //          PF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          null,
          new Vector2(1, 0),
          new Vector2(0, -1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(3);
      expect(parts[0].toString()).toBe('3 points: (1, 0), (0, 0), (-1, 0) (area: 0)');
      expect(parts[1].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(parts[2].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
    });
    test('case 07: PL, .., .., PF', () => {
      //       PL L
      //          PF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          null,
          null,
          new Vector2(0, -1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(2);
      expect(parts[0].toString()).toBe('3 points: (0, -1), (0, 0), (-1, 0) (area: -1)');
      expect(parts[1].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
    });
    test('case 08: PL, .., NL, ..', () => {
      //       PL L  NL
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          null,
          new Vector2(1, 0),
          null,
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(2);
      expect(parts[0].toString()).toBe('3 points: (1, 0), (0, 0), (-1, 0) (area: 0)');
      expect(parts[1].toString()).toBe('3 points: (-1, 0), (0, 0), (1, 0) (area: 0)');
    });
    test('case 09: PL, NF, .., PF', () => {
      //          NF
      //       PL L
      //          PF
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          new Vector2(0, 1),
          null,
          new Vector2(0, -1),
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(3);
      expect(parts[0].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
      expect(parts[1].toString()).toBe('3 points: (0, -1), (0, 0), (0, 1) (area: 0)');
      expect(parts[2].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
    });
    test('case 10: PL, NF, .., ..', () => {
      //          NF
      //       PL L
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          new Vector2(0, 1),
          null,
          null,
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(2);
      expect(parts[0].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
      expect(parts[1].toString()).toBe('3 points: (-1, 0), (0, 0), (0, 1) (area: -1)');
    });
    test('case 11: PL, NF, NL, ..', () => {
      //          NF
      //       PL L  NL
      const parts = polplot.buildPartialsFromPoints(
        new Vector2(0, 0),
        [
          new Vector2(-1, 0),
          new Vector2(0, 1),
          new Vector2(1, 0),
          null,
        ],
        new Line(-1, 0, 1, 0),
        new Line(0, -1, 0, 1),
      );
      expect(parts.length).toBe(3);
      expect(parts[0].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
      expect(parts[1].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(parts[2].toString()).toBe('3 points: (-1, 0), (0, 0), (1, 0) (area: 0)');
    });
  });
});