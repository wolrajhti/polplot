import { PolplotRenderer } from '../src/interfaces/polplot-renderer';
import { Polplot } from '../src/polplot';
import { Polygon } from '../src/polygon';
import { Survey } from '../src/survey';
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
  setSidebarMouseDownHandler(): void { }
  setSidebarMouseUpHandler(): void { }
  setSidebarMouseMoveHandler(): void { }
  drawSurvey(survey: Survey): void { }
  clearSurvey(): void { }
}

describe('PolPlot', () => {
  describe('buildPartialsFromPoints', () => {
    const polplot = new Polplot(new FakeRenderer());
    const intersections = [
      new Vector2(0, 0),
      new Vector2(-1, 0),
      new Vector2(0, -1),
      new Vector2(1, 0),
      new Vector2(0, 1),
    ];
    test('case 01: PL, PF, NL, NF', () => {
      //          NF
      //       PL L  NL
      //          PF
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [1, 2, 3, 4]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(4);
      expect(polygons[0].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
      expect(polygons[1].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(polygons[2].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(polygons[3].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
    });
    test('case 02: .., PF, NL, NF', () => {
      //          NF
      //          L  NL
      //          PF
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [null, 2, 3, 4]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(3);
      expect(polygons[0].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(polygons[1].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(polygons[2].toString()).toBe('3 points: (0, 1), (0, 0), (0, -1) (area: 0)');
    });
    test('case 03: .., .., NL, NF', () => {
      //          NF
      //          L  NL
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [null, null, 3, 4]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(2);
      expect(polygons[0].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(polygons[1].toString()).toBe('3 points: (0, 1), (0, 0), (1, 0) (area: -1)');
    });
    test('case 04: .., PF, .., NF', () => {
      //          NF
      //          L
      //          PF
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [null, 2, null, 4]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(2);
      expect(polygons[0].toString()).toBe('3 points: (0, -1), (0, 0), (0, 1) (area: 0)');
      expect(polygons[1].toString()).toBe('3 points: (0, 1), (0, 0), (0, -1) (area: 0)');
    });
    test('case 05: .., PF, NL, ..', () => {
      //          L  NL
      //          PF
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [null, 2, 3, null]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(2);
      expect(polygons[0].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(polygons[1].toString()).toBe('3 points: (1, 0), (0, 0), (0, -1) (area: -1)');
    });
    test('case 06: PL, .., NL, NF', () => {
      //          NF
      //       PL L  NL
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [1, null, 3, 4]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(3);
      expect(polygons[0].toString()).toBe('3 points: (-1, 0), (0, 0), (1, 0) (area: 0)');
      expect(polygons[1].toString()).toBe('3 points: (1, 0), (0, 0), (0, 1) (area: 1)');
      expect(polygons[2].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
    });
    test('case 07: PL, .., .., NF', () => {
      //          NF
      //       PL L
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [1, null, null, 4]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(2);
      expect(polygons[0].toString()).toBe('3 points: (-1, 0), (0, 0), (0, 1) (area: -1)');
      expect(polygons[1].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
    });
    test('case 08: PL, .., NL, ..', () => {
      //       PL L  NL
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [1, null, 3, null]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(2);
      expect(polygons[0].toString()).toBe('3 points: (-1, 0), (0, 0), (1, 0) (area: 0)');
      expect(polygons[1].toString()).toBe('3 points: (1, 0), (0, 0), (-1, 0) (area: 0)');
    });
    test('case 09: PL, PF, .., NF', () => {
      //          NF
      //       PL L
      //          PF
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [1, 2, null, 4]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(3);
      expect(polygons[0].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
      expect(polygons[1].toString()).toBe('3 points: (0, -1), (0, 0), (0, 1) (area: 0)');
      expect(polygons[2].toString()).toBe('3 points: (0, 1), (0, 0), (-1, 0) (area: 1)');
    });
    test('case 10: PL, PF, .., ..', () => {
      //       PL L
      //          PF
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [1, 2, null, null]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(2);
      expect(polygons[0].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
      expect(polygons[1].toString()).toBe('3 points: (0, -1), (0, 0), (-1, 0) (area: -1)');
    });
    test('case 11: PL, PF, NL, ..', () => {
      //       PL L  NL
      //          PF
      const parts = polplot.buildPartialsFromIntersectionIndexes(0, [1, 2, 3, null]);
      const polygons = parts.map(p => new Polygon(p.map(i => intersections[i])));
      expect(polygons.length).toBe(3);
      expect(polygons[0].toString()).toBe('3 points: (-1, 0), (0, 0), (0, -1) (area: 1)');
      expect(polygons[1].toString()).toBe('3 points: (0, -1), (0, 0), (1, 0) (area: 1)');
      expect(polygons[2].toString()).toBe('3 points: (1, 0), (0, 0), (-1, 0) (area: 0)');
    });
  });
});