import { html, LitElement, PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import * as d3 from 'd3'
import { Area, Line, Selection } from 'd3'
import './line-chart.css'

interface BarChartData {
  time: Date
  yUnit: number[]
}

@customElement('line-chart')
export class LineChart extends LitElement {

  protected createRenderRoot() {
    return this
  }

  @property() width: number = 575
  @property() height: number = 275

  @state()
  protected line: Line<BarChartData> | undefined

  @state()
  protected area: Area<BarChartData> | undefined

  @state()
  protected linePath: Selection<
    SVGPathElement,
    BarChartData[],
    HTMLElement,
    any
  > | undefined

  @state()
  protected areaPath: Selection<
    SVGPathElement,
    BarChartData[],
    HTMLElement,
    any
  > | undefined

  @state()
  protected focusCircle: Selection<SVGCircleElement, unknown, HTMLElement, any> | undefined

  @state()
  protected focusLine: Selection<SVGLineElement, unknown, HTMLElement, any> | undefined

  @state()
  protected data: BarChartData[]

  constructor() {
    super()
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
        Math.floor(Math.random() * 30)
      ]
      return { time: new Date(2023, 5, 15, 9, idx * 5), yUnit }
    })
    this.data = newData
  }

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties)
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    const svg: Selection<SVGSVGElement, unknown, HTMLElement, any> = d3
      .select('#d3-chart')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    const xScale = d3
    .scaleTime()
    .domain(d3.extent(this.data, (d) => d.time) as Iterable<number>)
    .range([margin.left, this.width - margin.right]);
      
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, d => d3.sum(d.yUnit)) || 0])
      .range([this.height - margin.bottom, margin.top]);

      const makeYGridlines = () => {
        return d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-(this.width - margin.left - margin.right))
    }

      svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(makeYGridlines())
      .attr('opacity', 0.1)
      .call(g => g.selectAll(".tick text").remove())

  const xAxis = d3.axisBottom(xScale).ticks(5)
  const yAxis = d3.axisLeft(yScale).ticks(5)

      svg
      .append('g')
      .attr('transform', `translate(0, ${this.height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.selectAll(".tick line").style('stroke', 'transparent'))
      .call(g => g.select(".domain").style('stroke', 'transparent'))
  svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .call(g => g.selectAll(".tick line").style('stroke', 'transparent'))
      .call(g => g.select(".domain").style('stroke', 'transparent'))

      const stack = d3.stack<BarChartData>().keys(["0", "1", "2"]);

      const stackedData = stack(this.data.map(d => ({...d, '0': d.yUnit[0], '1': d.yUnit[1], '2': d.yUnit[2]})));
  
      const color = d3.scaleOrdinal(["#6f3d30", "#e69727", "#d3e218"]);
  
      const barsGroup = svg.append('g')

      barsGroup.selectAll('g')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('fill', d => color(d.key))
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', (d, i) => xScale(this.data[i].time))
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', 25);

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
