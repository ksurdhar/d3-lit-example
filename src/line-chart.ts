import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as d3 from 'd3';
import { Area, Line, Selection } from 'd3';
import './line-chart.css';
import { createAxes } from './chart-axes';

interface LineChartData {
  time: Date;
  yUnit: number[];
}

@customElement('line-chart')
export class LineChart extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  @property() width: number = 575;
  @property() height: number = 275;

  @state()
  protected data: LineChartData[];

  @state()
  protected yUnitLabels: string[];

  @state()
  protected yUnitColors: string[];

  @state()
  protected lines: Line<LineChartData>[] = [];

  @state()
  protected areas: Area<LineChartData>[] = [];

  @state()
  protected linePaths:
    | Selection<SVGPathElement, LineChartData[], HTMLElement, any>[] = [];

  @state()
  protected areaPaths:
    | Selection<SVGPathElement, LineChartData[], HTMLElement, any>[] = [];

  @state()
  protected focusCircle:
    | Selection<SVGCircleElement, unknown, HTMLElement, any>
    | undefined;

  @state()
  protected focusLine:
    | Selection<SVGLineElement, unknown, HTMLElement, any>
    | undefined;

  constructor() {
    super();
    this.data = [
      { time: new Date(2023, 5, 15, 9, 0), yUnit: [20, 24] },
      { time: new Date(2023, 5, 15, 9, 5), yUnit: [20, 30] },
      { time: new Date(2023, 5, 15, 9, 10), yUnit: [10, 14] },
      { time: new Date(2023, 5, 15, 9, 15), yUnit: [11, 13] },
      { time: new Date(2023, 5, 15, 9, 20), yUnit: [30, 35] },
      { time: new Date(2023, 5, 15, 9, 25), yUnit: [8, 10] },
      { time: new Date(2023, 5, 15, 9, 30), yUnit: [20, 24] },
      { time: new Date(2023, 5, 15, 9, 35), yUnit: [16, 19] },
      { time: new Date(2023, 5, 15, 9, 40), yUnit: [25, 28] },
    ];
    this.yUnitLabels = ['P90', 'P99'];
    this.yUnitColors = ['185, 37, 0', '255, 139, 0'];
  }

  randomizeData() {
    const newData = Array.from({ length: 9 }, (_, idx) => {
      const yUnit1 = Math.floor(Math.random() * 30);
      const yUnit2 = Math.floor(Math.random() * 30);
      return {
        time: new Date(2023, 5, 15, 9, idx * 5),
        yUnit: [yUnit1, yUnit2],
      };
    });
    this.data = newData;
  }

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    const svg: Selection<SVGSVGElement, unknown, HTMLElement, any> = d3
      .select('.line-chart')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    const [xScale, yScale] = createAxes(
      svg,
      this.height,
      this.width,
      this.data
    );

    this.yUnitLabels.forEach((_, i) => {
      this.lines = this.lines.concat(
        d3
          .line<LineChartData>()
          .x((d) => xScale(d.time))
          .y((d) => yScale(d.yUnit[i]))
          .curve(d3.curveMonotoneX)
      );

      this.areas = this.areas.concat(
        d3
          .area<LineChartData>()
          .x((d) => xScale(d.time))
          .y0(this.height - margin.bottom)
          .y1((d) => yScale(d.yUnit[i]))
          .curve(d3.curveMonotoneX)
      );

      svg
        .append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0)
        .attr('y2', yScale(0))
        .attr('x2', 0)
        .attr('y1', yScale(d3.max(this.data, (d) => d.yUnit[i]) as number))
        .selectAll('stop')
        .data([
          { offset: '0%', color: `rgba(${this.yUnitColors[i]}, .12)` },
          { offset: '100%', color: 'transparent' },
        ])
        .enter()
        .append('stop')
        .attr('offset', (d) => d.offset)
        .attr('stop-color', (d) => d.color);

      this.areaPaths = this.areaPaths.concat(
        svg
          .append('path')
          .datum(this.data)
          .attr('fill', 'url(#area-gradient)')
          .attr('d', this.areas[i])
      );

      this.linePaths = this.linePaths.concat(
        svg
          .append('path')
          .datum(this.data)
          .attr('fill', 'none')
          .attr('stroke', `rgb(${this.yUnitColors[i]})`)
          .attr('stroke-width', 1.5)
          .attr('d', this.lines[i])
      );
    });

    // this.focusLine = svg
    //   .append('line')
    //   .style('stroke', 'black')
    //   .style('stroke-dasharray', '3, 3')
    //   .style('opacity', 0)
    //   .attr('y1', 0)
    //   .attr('y2', this.height - margin.bottom);

    // this.focusCircle = svg
    //   .append('circle')
    //   .attr('r', 5)
    //   .attr('class', 'tooltip circle')
    //   .style('opacity', 0)
    //   .style('stroke', 'black')
    //   .style('fill', 'white');

    const tooltip = d3
      .select('.line-chart')
      .append('div')
      // .style('opacity', 0)
      .attr('class', 'tooltip')

    const mouseover = () => {
      tooltip.style('opacity', 1);
      // if (this.focusCircle) this.focusCircle.style('opacity', 1);
    };

    const mousemove = (e: MouseEvent) => {
      // Select the path element of the line chart
      const pathEl = this.linePaths[0]?.node();
      if (!pathEl) return;
      // if (!this.focusCircle) return;

      // Convert the mouse event's x-coordinate into the corresponding data value
      const x0 = xScale.invert(d3.pointer(e, this)[0]) as Date;

      // Convert the data value back to pixel coordinates
      const x0Pixel = xScale(x0);

      // Find the index of the data item closest to the mouse's x-coordinate
      const i = d3
        .bisector((d: LineChartData) => d.time)
        .left(this.data, x0, 1);

      // Compare the mouse's x-coordinate to the data items before and after it to decide which one it's closest to
      const d0 = this.data[i - 1];
      const d1 = this.data[i];
      const d =
        x0.getTime() - d0.time.getTime() > d1.time.getTime() - x0.getTime()
          ? d1
          : d0;

      // Perform binary search on the path to find the point on the line that's closest to the mouse's x-coordinate
      let beginning = 0;
      let end = pathEl.getTotalLength();
      let target = null;
      let pos;

      while (true) {
        target = Math.floor((beginning + end) / 2);
        pos = pathEl.getPointAtLength(target);
        if ((target === end || target === beginning) && pos.x !== x0Pixel) {
          break;
        }
        if (pos.x > x0Pixel) end = target;
        else if (pos.x < x0Pixel) beginning = target;
        else break;
      }

      // Move the focus circle to the point on the line closest to the mouse's x-coordinate
      // this.focusCircle.attr('cx', pos.x).attr('cy', pos.y);

      // Show the focus line at the position of the focus circle
      // if (this.focusLine) {
      //   this.focusLine
      //     .style('opacity', 1)
      //     .attr('x1', pos.x)
      //     .attr('y1', pos.y)
      //     .attr('x2', pos.x)
      //     .attr('y2', this.height - margin.bottom);
      // }

      // Show the tooltip with the data value closest to the mouse's x-coordinate

        let fragments = d.yUnit.map((val, i) => {
          return `<div>${this.yUnitLabels[i]}: ${val}</div>`
        })
        const hours = d.time.getHours().toString().padStart(2, '0');
        const minutes = d.time.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`

        fragments = fragments.concat(`<div>${timeString}</div>`)
        
        tooltip
        .style('left', d3.pointer(e)[0] + 20 + 'px')
        .style('top', d3.pointer(e)[1] + 15 + 'px')
        .html(`<div>${fragments.join('')}</div>`);

    };

    const mouseleave = () => {
      tooltip.style('opacity', 0);
      // if (this.focusCircle) this.focusCircle.style('opacity', 0);
      // if (this.focusLine) this.focusLine.style('opacity', 0);
      // d3.select(this).style('stroke', 'none').style('opacity', 0.8);
    };

    d3.select('.line-chart')
    .on('mouseover', () => mouseover())
    .on('mousemove', (e) => mousemove(e))
    .on('mouseleave', () => mouseleave());
  }

  protected updated() {
    if (this.linePaths && this.lines && this.areaPaths && this.areas) {
      this.yUnitLabels.forEach((_, i) => {
        this.linePaths[i]
          .datum(this.data)
          .transition()
          .duration(2000)
          .attr('d', this.lines[i]);

        this.areaPaths[i]
          .datum(this.data)
          .transition()
          .duration(2000)
          .attr('d', this.areas[i]);
      });
    }
  }

  render() {
    return html`
            <div>
                <div class="line-chart"></div>
                <button @click="${this.randomizeData}">rerender</button>
            </div>
        `;
  }
}
