import { Selection } from 'd3';
import * as d3 from 'd3';

interface ChartData {
  time: Date;
  yUnit: number[] | number;
}

export const createAxes = (
  svg: Selection<SVGSVGElement, unknown, HTMLElement, any>,
  height: number,
  width: number,
  data: ChartData[]
) => {
  const margin = { top: 20, right: 20, bottom: 50, left: 50 };

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.time) as Iterable<number>)
    .range([margin.left, width - margin.left]);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (d) =>
        Number(Array.isArray(d.yUnit) ? d3.sum(d.yUnit) : d.yUnit)
      ) || 0,
    ])
    .range([height - margin.bottom, margin.top]);

  const makeYGridlines = () => {
    return d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(-(width - margin.left - margin.right));
  };

  svg
    .append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(makeYGridlines())
    .attr('opacity', 0.1)
    .call((g) => g.selectAll('.tick text').remove());

  const xAxis = d3.axisBottom(xScale).ticks(5);
  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg
    .append('g')
    .attr('transform', `translate(13, ${height - margin.bottom})`)
    .call(xAxis)
    .call((g) => g.selectAll('.tick line').style('stroke', 'transparent'))
    .call((g) => g.select('.domain').style('stroke', 'transparent'));

  svg
    .append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call((g) => g.selectAll('.tick line').style('stroke', 'transparent'))
    .call((g) => g.select('.domain').style('stroke', 'transparent'));

  return [xScale, yScale]
};
