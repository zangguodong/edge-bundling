export interface Node {
  id: string;
  label: string;
  value?: number; // from [0, 100]
}
export interface Edge {
  source: string; // Source node's id
  target: string; // Target node's id
  isBgLine: boolean;
}
export interface EdgeBundlingDataModel {
  nodes: Node[];
  edges: Edge[];
}

export interface PaintNodeDefinition {
  center: [number, number];
  radius: number;
  nodeSource: Node;
  angle?: number;
  fill?: string;
  label?: string;
  // 是否因为绘制线，导致
  isActive?: boolean;
}

export interface QuadraticEdgeModel {
  source: [number, number];
  cp: [number, number];
  target: [number, number];
}
export interface PaintEdgeDefinition {
  path: string;
  stroke?: string;
  strokeWidth?: number;
  boundNodes: [PaintNodeDefinition, PaintNodeDefinition];
}

export interface SizeDefinition {
  width: number;
  height: number;
}
