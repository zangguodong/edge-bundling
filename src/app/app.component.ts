import { Component } from '@angular/core';
import { Edge, Node, EdgeBundlingDataModel } from './edge-bundling/type';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'custom-edge-bundling';
  lineMap = new Map<string, Set<string>>();
  data: EdgeBundlingDataModel = {
    // 设置节点数
    nodes: this.nodeGenerator(25),
    // 设置边数量，联调节点数量
    edges: this.lineGenerator(0, 5),
  };

  nodeGenerator(count: number): Node[] {
    return Array(count)
      .fill(0)
      .map((_, index) => ({
        id: index + '',
        label: `222.222.222.222`,
        value: Math.random() * 10,
      }));
  }

  lineGenerator(count: number, nodeCount: number): Edge[] {
    return Array(count)
      .fill(0)
      .map(() => {
        let source = Math.round(Math.random() * nodeCount) + '';
        let target = Math.round(Math.random() * nodeCount) + '';

        while (true) {
          if (!this.lineMap.has(source)) {
            this.lineMap.set(source, new Set());
          }
          if (source === target || this.lineMap.get(source).has(target)) {
            source = Math.round(Math.random() * nodeCount) + '';
            target = Math.round(Math.random() * nodeCount) + '';
            continue;
          }

          this.lineMap.get(source).add(target);
          break;
        }
        return {
          source,
          target,
          isBgLine: false,
        };
      });
  }
}
