import { Edge, QuadraticEdgeModel } from './type';

export function getEdgePath(edge: QuadraticEdgeModel): string {
  return `M ${edge.source[0]} ${edge.source[1]} Q ${edge.cp[0]} ${edge.cp[1]} ${edge.target[0]} ${edge.target[1]}`;
}

export function removeRedundantEdge(edges: Edge[]): Edge[] {
  return edges?.reduce((acc, curr) => {
    if (
      acc.some(
        (data) =>
          (data.source === curr.source && data.target === curr.target) ||
          (data.source === curr.target && data.target === curr.source)
      )
    ) {
      return acc;
    }
    return [...acc, curr];
  }, []);
}

export function calculateEllipseNodePosition({
  index,
  angleSep,
  aLength,
  bLength,
  ellipseCenter,
}: {
  index: number;
  angleSep: number;
  aLength: number;
  bLength: number;
  ellipseCenter: [number, number];
}): [number, number, number] {
  let deltaX = 0;
  let deltaY = 0;
  const angle = index * angleSep;
  if (angle > Math.PI / 2 && angle < (3 * Math.PI) / 2) {
    deltaX =
      (-aLength * bLength) /
      Math.sqrt(
        bLength * bLength +
          aLength * aLength * (Math.tan(angle) * Math.tan(angle))
      );
    deltaY =
      (-aLength * bLength * Math.tan(angle)) /
      Math.sqrt(
        bLength * bLength +
          aLength * aLength * (Math.tan(angle) * Math.tan(angle))
      );
  } else if (angle === Math.PI / 2) {
    deltaY = bLength;
  } else if (angle === (3 * Math.PI) / 2) {
    deltaY = -bLength;
  } else {
    deltaX =
      (aLength * bLength) /
      Math.sqrt(
        bLength * bLength +
          aLength * aLength * (Math.tan(angle) * Math.tan(angle))
      );
    deltaY =
      (aLength * bLength * Math.tan(angle)) /
      Math.sqrt(
        bLength * bLength +
          aLength * aLength * (Math.tan(angle) * Math.tan(angle))
      );
  }
  return [deltaX + ellipseCenter[0], deltaY + ellipseCenter[1], angle];
}
export enum NODE_FILL_COLOR {
  ALL_HEALTH = '#85DFAD',
  LOW_SEVERITY = '#ffa59f',
  MID_SEVERITY = '#ff584c',
  HIGH_SEVERITY = '#d42d3d',
  EXTRA_SEVERITY = '#a8002d',
}

export function getNodeFillColor(value: number): NODE_FILL_COLOR {
  if (!value) {
    return NODE_FILL_COLOR.ALL_HEALTH;
  } else if (value < 20) {
    return NODE_FILL_COLOR.LOW_SEVERITY;
  } else if (value < 50) {
    return NODE_FILL_COLOR.MID_SEVERITY;
  } else if (value < 70) {
    return NODE_FILL_COLOR.HIGH_SEVERITY;
  }
  return NODE_FILL_COLOR.EXTRA_SEVERITY;
}
