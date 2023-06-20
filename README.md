# D3 + Lit  Example

This repo demonstrates how to render and animate a simple line chart using d3 inside of a lit web component. 

## Build and run

 1. `npm i` to install dependencies
 2. `npm run dev` to run the dev server
 3. navigate to http://localhost:5174/  to see the component 


## Using d3 and lit together

#### Setting up your data
The example in this repository uses mock data set in internal lit component state. In a real world use case, your charts will likely use some external source. Therefore the following:

```typescript
@state() 
protected data: ConnectionData[]
```
would become: 
```typescript
@property() 
data: ConnectionData[]
```

#### Initial draw
Lit web components receive [reactive lifecycle methods](https://lit.dev/docs/components/lifecycle/#reactive-update-cycle) to hook into. For the first draw we use `firstUpdated()`. Here is where the bulk of your d3 code should live. Define your scales, axes, lines, bars and areas here. If you are rendering additional menus or tooltips, their respective mouse handlers can also be defined here.


#### Animations

To animate the d3 elements when data has changed, define those transitions in the `updated()` lifecycle method. Anything that you've defined in the initial draw that requires animation should be moved into lit component state. For example, animating the line :

```typescript
updated() {  
	this.linePath.datum(this.data)
		.transition()  
        .duration(2000)  
        .attr("d", this.line)  
}
```
Requires the following state declarations at the top of your component:

```typescript
@state()  
protected line: Line<ConnectionData>  
@state()  
protected linePath: Selection<SVGPathElement, ConnectionData[], HTMLElement, any>  
```

Which are set inside of the first draw inside:
```typescript
protected firstUpdated() {
	...
	
	this.line = d3.line<ConnectionData>()
	.x((d) =>  xScale(d.time))
	.y((d) =>  yScale(d.connections))
	.curve(d3.curveMonotoneX)
	
	this.linePath = svg
	.append('path')
	.datum(this.data)
	.attr('fill', 'none')
	.attr('stroke', 'rgba(52, 107, 119)')
	.attr('stroke-width', 1.5)
	.attr('d', this.line)
	
	...
}
``` 