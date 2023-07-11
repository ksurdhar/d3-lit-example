import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as d3 from 'd3';
import { Selection, Stack } from 'd3';
import './line-chart.css';
import { createAxes } from './chart-axes';

interface BarChartData {
  time: Date;
  yUnit: number[];
}

interface ExtendedBarChartData extends BarChartData {
  [key: string]: number | Date | number[];
}

@customElement('bar-chart')
export class BarChart extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  @property() width: number = 575;
  @property() height: number = 275;

  @state()
  protected svg:
    | Selection<SVGSVGElement, unknown, HTMLElement, any>
    | undefined;

  @state()
  protected xScale: d3.ScaleTime<number, number, never> | undefined;

  @state()
  protected yScale: d3.ScaleLinear<number, number, never> | undefined;

  @state()
  protected stack: Stack<any, BarChartData, string> | undefined;

  @state()
  protected barGroupPath:
    | Selection<SVGGElement, unknown, HTMLElement, any>
    | undefined;

  @state()
  protected data: BarChartData[];

  constructor() {
    super();
    this.data = [
      { time: new Date(2023, 5, 15, 9, 0), yUnit: [12, 7, 5] },
      { time: new Date(2023, 5, 15, 9, 5), yUnit: [20, 10, 10] },
      { time: new Date(2023, 5, 15, 9, 10), yUnit: [10, 5, 5] },

      { time: new Date(2023, 5, 15, 9, 15), yUnit: [11, 6, 5] },
      { time: new Date(2023, 5, 15, 9, 20), yUnit: [30, 15, 15] },
      { time: new Date(2023, 5, 15, 9, 25), yUnit: [8, 4, 4] },

      { time: new Date(2023, 5, 15, 9, 30), yUnit: [20, 10, 10] },
      { time: new Date(2023, 5, 15, 9, 35), yUnit: [16, 8, 8] },
      { time: new Date(2023, 5, 15, 9, 40), yUnit: [25, 12, 13] },
    ];
  }

  randomizeData() {
    const newData = Array.from({ length: 9 }, (_, idx) => {
      const yUnit = [
        Math.floor(Math.random() * 30),
        Math.floor(Math.random() * 30),
        Math.floor(Math.random() * 30),
      ];
      return { time: new Date(2023, 5, 15, 9, idx * 5), yUnit };
    });
    this.data = newData;
  }

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    this.svg = d3
      .select('#d3-chart')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    const axes = createAxes(this.svg, this.height, this.width, this.data);
    this.xScale = axes[0];
    this.yScale = axes[1];

    const maxYLength = Math.max(...this.data.map((d) => d.yUnit.length));
    const indicies = Array.from({ length: maxYLength }, (_, i) => i.toString());
    this.stack = d3.stack<BarChartData>().keys(indicies);

    const color = d3.scaleOrdinal(['#356F7B', '#6195A1', '#8DBBC7', '#B9E1ED']);

    this.barGroupPath = this.svg.append('g');

    this.barGroupPath
      .selectAll('g')
      .data(this.getStackedData() as d3.Series<BarChartData, string>[])
      .enter()
      .append('g')
      .attr('fill', (d) => color(d.key))
      .selectAll('rect')
      .data((d) => d)
      .enter()
      .append('rect')
      .attr('x', (d) => axes[0](d.data.time))
      .attr('width', 30)
      .attr('y', (d) => axes[1](d[1]))
      .attr('height', (d) => axes[1](d[0]) - axes[1](d[1]));
  }

  protected updated() {
    if (this.stack && this.xScale && this.yScale && this.barGroupPath) {
      const axes = [this.xScale, this.yScale];

      const groups = this.barGroupPath
        .selectAll<SVGGElement, number[]>('g')
        .data(this.getStackedData() as d3.Series<BarChartData, string>[]);

      const bars = groups
        .selectAll<SVGRectElement, number[]>('rect')
        .data((d) => d);

      bars
        .transition()
        .duration(2000)
        .attr('y', (d) => axes[1](d[1]))
        .attr('height', (d) => axes[1](d[0]) - axes[1](d[1]));
    }
  }

  private getStackedData() {
    if (this.stack) {
      return this.stack(
        this.data.map((d) => {
          const entry: ExtendedBarChartData = { ...d };
          d.yUnit.forEach((value, i) => {
            entry[i.toString()] = value;
          });
          return entry;
        })
      );
    } else {
      return d3.stack<BarChartData>().keys([]);
    }
  }

  render() {
    return html`
            <div>
                <div id="d3-chart"></div>
                <button @click="${this.randomizeData}">rerender</button>
            </div>
        `;
  }
}
