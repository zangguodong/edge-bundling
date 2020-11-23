import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  calculateEllipseNodePosition,
  getEdgePath,
  getNodeFillColor,
  removeRedundantEdge,
} from './util';
import {
  Edge,
  Node,
  EdgeBundlingDataModel,
  PaintEdgeDefinition,
  PaintNodeDefinition,
  SizeDefinition,
} from './type';

const NODE_RADIUS = 5;
const BG_LINE_COLOR = '#ededed';
const BG_LINE_WEIGHT = 1;
const ACTIVE_LINE_COLOR = '#E54545';
const ACTIVE_LINE_WEIGHT = 2;

@Component({
  selector: 'app-edge-bundling',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EdgeBundlingComponent implements OnChanges, OnInit, OnDestroy {
  @Input()
  data: EdgeBundlingDataModel;

  // 整个 SVG 的尺寸
  @Input()
  outterSize: SizeDefinition = {
    width: 600,
    height: 600,
  };

  // 网状图尺寸
  @Input()
  innerSize: SizeDefinition = {
    width: 390,
    height: 390,
  };

  // 标签距离节点圆心偏移量
  @Input()
  labelOffset = 8;

  @Input()
  noEdgeTip = '节点联通正常，无异常节点';

  // 节点点击时触发函数
  @Output()
  nodeSelected = new EventEmitter<Node>();

  nodeDefs: PaintNodeDefinition[];
  edgeDefs: PaintEdgeDefinition[];

  nodeChosen: PaintNodeDefinition;
  nodeHover: PaintNodeDefinition;

  destroy$ = new Subject<void>();
  ACTIVE_LINE_COLOR = ACTIVE_LINE_COLOR;
  rawEdges: Edge[];
  // 储存节点和相关联的边信息
  private nodeEdgeMap = new Map<
    PaintNodeDefinition,
    Set<PaintEdgeDefinition>
  >();

  ngOnChanges(): void {
    this.rawEdges = this.data.edges.slice();
    // 补齐背景edge
    this.data.edges = this.patchNodeEdge(this.data.edges, this.data.nodes);
    this.nodeDefs = this.getNodes();
    this.edgeDefs = this.getEdges(this.nodeDefs);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  // 修正当前edge，填充背景edge
  patchNodeEdge(edges: Edge[], allNodes: Node[]): Edge[] {
    edges = edges.map((i) => ({ ...i, isBgLine: false }));
    const rawEdge = edges.slice();
    allNodes.forEach((nodeA) => {
      allNodes
        .filter((node) => node !== nodeA)
        .forEach((nodeB) => {
          if (
            !rawEdge.some((i) => i.source === nodeA.id && i.target === nodeB.id)
          ) {
            edges.push({ source: nodeA.id, target: nodeB.id, isBgLine: true });
          }
        });
    });

    return edges;
  }

  ngOnInit(): void {
    fromEvent(document.getElementById('egde-bundling'), 'click')
      .pipe(takeUntil(this.destroy$))
      .subscribe((ev: any) => {
        if (!ev.target?.classList?.contains('edge-bundling-node')) {
          if (this.nodeChosen) {
            this.onNodeBlur(this.nodeChosen);
          }
          this.nodeChosen = null;
        }
      });
  }

  getNodes(): PaintNodeDefinition[] {
    return !this.data?.nodes ? [] : this.renderNode(this.data.nodes);
  }

  getEdges(nodePaints: PaintNodeDefinition[]): PaintEdgeDefinition[] {
    this.nodeEdgeMap.clear();
    nodePaints.forEach((node) => {
      this.nodeEdgeMap.set(node, new Set());
    });
    return !this.data?.edges
      ? []
      : this.renderEdge(removeRedundantEdge(this.data.edges), nodePaints);
  }

  renderNode(data: Node[]): PaintNodeDefinition[] {
    const angleSep = (2 * Math.PI) / data.length;
    const aLength = this.innerSize.width / 2;
    const bLength = this.innerSize.height / 2;

    return data?.map((nodeSource, index) => {
      nodeSource.value = 0;
      this.data.edges.forEach((i) => {
        if ([i.source, i.target].includes(nodeSource.id) && !i.isBgLine) {
          nodeSource.value += 100 / this.data.nodes.length;
        }
      });
      // calculateEllipseNodePosition 支持椭圆，正圆的位置分布
      const positionInfo = calculateEllipseNodePosition({
        index,
        angleSep,
        aLength,
        bLength,
        ellipseCenter: [this.outterSize.width / 2, this.outterSize.height / 2],
      });
      return {
        center: [positionInfo[0], positionInfo[1]],
        nodeSource,
        label: nodeSource.label,
        radius: NODE_RADIUS,
        angle: positionInfo[2],
        fill: getNodeFillColor(nodeSource.value),
      };
    });
  }

  // 边信息，需要原始边信息，以及已绘制的node信息，从而得到node的位置
  renderEdge(
    data: Edge[],
    nodesPaints: PaintNodeDefinition[]
  ): PaintEdgeDefinition[] {
    return data
      .map(({ source, target, isBgLine }) => {
        let sourceNode: PaintNodeDefinition;
        let targeNode: PaintNodeDefinition;

        nodesPaints.forEach((nodesPaint) => {
          if (nodesPaint.nodeSource.id === source) {
            sourceNode = nodesPaint;
          } else if (nodesPaint.nodeSource.id === target) {
            targeNode = nodesPaint;
          }
        });

        if (!sourceNode || !targeNode) {
          return null;
        }
        const result: PaintEdgeDefinition = {
          path: getEdgePath({
            source: sourceNode.center,
            target: targeNode.center,
            cp: [this.outterSize.width / 2, this.outterSize.height / 2],
          }),
          stroke: BG_LINE_COLOR,
          strokeWidth: BG_LINE_WEIGHT,
          boundNodes: !isBgLine ? [sourceNode, targeNode] : null,
        };
        if (!isBgLine) {
          this.nodeEdgeMap.get(sourceNode).add(result);
          this.nodeEdgeMap.get(targeNode).add(result);
        }

        return result;
      })
      .filter((i) => !!i);
  }

  updateNode(
    node: PaintNodeDefinition,
    params: Partial<PaintNodeDefinition>
  ): PaintNodeDefinition {
    Object.assign(node, params, { nodeSource: node.nodeSource });
    return node;
  }

  updateNodeEdge(
    node: PaintNodeDefinition,
    params: Partial<PaintEdgeDefinition>,
    setActive: boolean
  ): void {
    const edges = this.nodeEdgeMap.get(node);
    const parts = [
      this.edgeDefs.filter((edge) => !edges?.has(edge)) || [],
      this.edgeDefs.filter((edge) => edges?.has(edge)) || [],
    ];
    parts[1].forEach((edge) => {
      Object.assign(edge, params || {}, { path: edge.path });
      const [nodeA, nodeB] = edge.boundNodes;
      Object.assign(nodeA, { isActive: setActive });
      Object.assign(nodeB, { isActive: setActive });
    });

    this.edgeDefs = [...parts[0], ...parts[1]];
  }

  getRotate(ang: number): string {
    return `transform: rotate(${(ang / Math.PI) * 180}deg);`;
  }

  onTouchNode(node: PaintNodeDefinition): void {
    this.nodeHover = node;
    if (this.nodeChosen === node || node.isActive) {
      return;
    }
    // 给 hover 的 node 展示名字
    Object.assign(node, { isActive: true });
  }

  onLeaveNode(node: PaintNodeDefinition): void {
    this.nodeHover = null;
    if (this.isNodeBundling(node)) {
      return;
    }
    // 给 hover 的 node 展示名字
    Object.assign(node, { isActive: false });
  }

  isNodeBundling(node: PaintNodeDefinition): boolean {
    if (!this.nodeChosen) {
      return false;
    }
    return Array.from(this.nodeEdgeMap.get(this.nodeChosen))
      ?.reduce((acc, curr) => {
        return [...acc, ...curr.boundNodes];
      }, [])
      .includes(node);
  }

  onClickNode(node: PaintNodeDefinition): void {
    if (!this.nodeEdgeMap.get(node)?.size) {
      return;
    }
    if (this.nodeChosen !== node) {
      this.onNodeBlur(this.nodeChosen);
    }
    this.nodeChosen = node;
    this.updateNodeEdge(
      node,
      {
        stroke: ACTIVE_LINE_COLOR,
        strokeWidth: ACTIVE_LINE_WEIGHT,
      },
      true
    );
    this.nodeSelected.next(node.nodeSource);
  }

  onNodeBlur(node: PaintNodeDefinition): void {
    if (!node) {
      return;
    }
    this.updateNode(node, {});
    this.updateNodeEdge(
      node,
      {
        stroke: BG_LINE_COLOR,
        strokeWidth: BG_LINE_WEIGHT,
      },
      false
    );
  }
}
