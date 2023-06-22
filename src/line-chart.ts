import { html, LitElement, PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import * as d3 from 'd3'
import { Area, Line, Selection } from 'd3'
import './line-chart.css'

interface ConnectionData {
  time: Date
  connections: number
}

@customElement('line-chart')
export class LineChart extends LitElement {
  protected createRenderRoot() {
    return this
  }

  @property() width: number = 575
  @property() height: number = 275

  @state()
  protected line: Line<ConnectionData>|undefined
  @state()
  protected area: Area<ConnectionData>|undefined
  @state()
  protected linePath: Selection<
    SVGPathElement,
    ConnectionData[],
    HTMLElement,
    any
  >|undefined
  @state()
  protected areaPath: Selection<
    SVGPathElement,
    ConnectionData[],
    HTMLElement,
    any
  >|undefined

  @state()
  protected focusCircle: Selection<SVGCircleElement, unknown, HTMLElement, any>|undefined

  @state()
  protected focusLine: Selection<SVGLineElement, unknown, HTMLElement, any>|undefined

  @state()
  protected data: ConnectionData[]

  constructor() {
    super()
    this.data = [
      { time: new Date(2023, 5, 15, 9, 0), connections: 12 },
      { time: new Date(2023, 5, 15, 9, 5), connections: 20 },
      { time: new Date(2023, 5, 15, 9, 10), connections: 10 },
      { time: new Date(2023, 5, 15, 9, 15), connections: 11 },
      { time: new Date(2023, 5, 15, 9, 20), connections: 30 },
      { time: new Date(2023, 5, 15, 9, 25), connections: 8 },
      { time: new Date(2023, 5, 15, 9, 30), connections: 20 },
      { time: new Date(2023, 5, 15, 9, 35), connections: 16 },
      { time: new Date(2023, 5, 15, 9, 40), connections: 25 },
    ]
    
  }

  randomizeData() {
    const newData = Array.from({ length: 10 }, (_, idx) => {
      const connections = Math.floor(Math.random() * 30)
      return { time: new Date(2023, 5, 15, 9, idx * 5), connections }
    })
    this.data = newData
  }

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties)
    const margin = { top: 20, right: 20, bottom: 50, left: 50 }

    const svg: Selection<SVGSVGElement, unknown, HTMLElement, any> = d3
      .select('#d3-chart')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(this.data, (d) => d.time) as Iterable<number>)
      .range([margin.left, this.width - margin.right])
    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(this.data, (d) => d.connections) + 10,
      ] as Iterable<number>)
      .range([this.height - margin.bottom, margin.top])

    const xAxis = d3.axisBottom(xScale).ticks(5)
    const yAxis = d3.axisLeft(yScale).ticks(5)

    svg
      .append('g')
      .attr('transform', `translate(0, ${this.height - margin.bottom})`)
      .call(xAxis)
    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)

    this.line = d3
      .line<ConnectionData>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.connections))
      .curve(d3.curveMonotoneX)

    this.area = d3
      .area<ConnectionData>()
      .x((d) => xScale(d.time))
      .y0(this.height - margin.bottom)
      .y1((d) => yScale(d.connections))
      .curve(d3.curveMonotoneX)

    svg
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y2', yScale(0))
      .attr('x2', 0)
      .attr(
        'y1',
        yScale(d3.max(this.data, (d) => d.connections) as number)
      )
      .selectAll('stop')
      .data([
        { offset: '0%', color: 'rgba(52, 107, 119, 0.12)' },
        { offset: '100%', color: 'transparent' },
      ])
      .enter()
      .append('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color)

    this.areaPath = svg
      .append('path')
      .datum(this.data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', this.area)

    this.linePath = svg
      .append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(52, 107, 119)')
      .attr('stroke-width', 1.5)
      .attr('d', this.line)

    this.focusCircle = svg
      .append('circle')
      .attr('r', 5)
      .attr('class', 'tooltip circle')
      .style('opacity', 0)
      .style('stroke', 'black')
      .style('fill', 'white')    

    this.focusLine = svg
      .append('line')
      .style('stroke', 'black')
      .style('stroke-dasharray', '3, 3')
      .style('opacity', 0)
      .attr('y1', 0)
      .attr('y2', this.height - margin.bottom);  // line height

    const tooltip = d3
      .select('#d3-chart')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'white')
      .style('border', 'solid')
      .style('border-width', '2px')
      .style('border-radius', '5px')
      .style('padding', '5px')
      .style('position', 'absolute')

    const mouseover = () => {
      tooltip.style('opacity', 1)
      if (this.focusCircle) this.focusCircle.style('opacity', 1)
    }

    const mousemove = (e: MouseEvent) => {
      const pathEl = this.linePath?.node()
      if (!pathEl) return
      if (!this.focusCircle) return
      const x0 = xScale.invert(d3.pointer(e, this)[0]);
      const x0Pixel = xScale(x0);
      const i = d3.bisector((d: ConnectionData) => d.time).left(this.data, x0, 1);
      const d0 = this.data[i - 1];
      const d1 = this.data[i];
      const d = x0.getTime() - d0.time.getTime() > d1.time.getTime() - x0.getTime() ? d1 : d0;
      
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
        else break; // position found
      }
    
      this.focusCircle.attr('cx', pos.x).attr('cy', pos.y);

      if (this.focusLine) {
        this.focusLine
          .style('opacity', 1)
          .attr('transform', 'translate(' + pos.x + ',0)');
      }
      
      tooltip
        .style('left', d3.pointer(e)[0] + 30 + 'px')
        .style('top', d3.pointer(e)[1] + 45 + 'px')
        .html('connections: ' + d.connections);
    }
  
    const mouseleave = () => {
      tooltip.style('opacity', 0)
      if (this.focusCircle) this.focusCircle.style('opacity', 0)
      d3.select(this).style('stroke', 'none').style('opacity', 0.8)
    }

    d3.select('#d3-chart')
      .on('mouseover', () => mouseover())
      .on('mousemove', (e) => mousemove(e))
      .on('mouseleave', () => mouseleave())
  }

  protected updated() {
    if (this.linePath && this.line && this.areaPath && this.area) {
      this.linePath
        .datum(this.data)
        .transition()
        .duration(2000)
        .attr('d', this.line)
      this.areaPath
        .datum(this.data)
        .transition()
        .duration(2000)
        .attr('d', this.area)
    }
  }

  render() {
    return html`
            <div>
                <div id="d3-chart"></div>
                <button @click="${this.randomizeData}">rerender</button>
            </div>
        `
  }
}
