** Technical Specification for Interactive Bar Chart with D3.js v7**

**Overview**

This specification outlines the requirements for creating an interactive bar chart using D3.js v7, displaying China's GDP and per capita GDP from 2000 to 2025. The chart should include tooltips, a color palette, keyboard navigation, and be built using the `data/gdp_china.csv` file.

**Technical Requirements**

1. **D3.js v7**
	* Use D3.js v7 as the primary library for data visualization.
	* Ensure compatibility with modern browsers (IE 11+, Chrome, Firefox, Safari).
2. **Data**
	* Load data from `data/gdp_china.csv` file.
	* Data should be in the format of `date, gdp, per_capita_gdp`, separated by commas.
3. **Tooltip**
	* Display a tooltip when hovering over a bar, showing the date, GDP, and per capita GDP values.
	* Tooltip should be customizable, with options for color, font size, and position.
4. **Color Palette**
	* Use an observable color palette of 10 colors, as specified.
	* Ensure colors are accessible and readable for users with color vision deficiency.
5. **Keyboard Navigation**
	* Allow users to navigate the chart using their keyboard.
	* Implement arrow keys (up, down, left, right) to navigate between bars.
	* Highlight the currently selected bar when navigating.
6. **Chart Layout**
	* Use a horizontal bar chart layout.
	* Ensure bars are evenly spaced and aligned with the x-axis.
7. **Chart Dimensions**
	* Set the chart width to 800px and height to 600px.
	* Ensure the chart is responsive and scales with the window size.
8. **Interactivity**
	* Allow users to hover over bars to view tooltips.
	* Enable keyboard navigation for users with disabilities.
	* Ensure the chart is interactive and responsive.

**Code Structure**

The code will be organized into the following files:

1. `index.html`: The main HTML file, containing the chart element and links to the CSS and JavaScript files.
2. `style.css`: The CSS file, containing styles for the chart, tooltip, and color palette.
3. `script.js`: The JavaScript file, containing the D3.js code for building and interacting with the chart.

**D3.js Code**

The D3.js code will be organized into the following sections:

1. **Data Loading**
```javascript
// Load data from CSV file
d3.csv('data/gdp_china.csv')
  .then(data => {
    // Process data and prepare for charting
    const gdpData = data.filter(row => row.per_capita_gdp !== null);
    const dates = gdpData.map(row => row.date);
    const gdpValues = gdpData.map(row => row.gdp);
    const perCapitaGdpValues = gdpData.map(row => row.per_capita_gdp);
  });
```

2. **Chart Creation**
```javascript
// Create SVG element
const svg = d3.select('#chart')
  .append('svg')
  .attr('width', 800)
  .attr('height', 600);

// Set up scales and axes
const xScale = d3.scaleTime()
  .domain(d3.extent(dates))
  .range([0, 800]);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(gdpValues)])
  .range([0, 600]);

const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

// Create bar chart
const bars = svg.selectAll('rect')
  .data(gdpData)
  .enter()
  .append('rect')
  .attr('x', (d, i) => xScale(dates[i]))
  .attr('y', (d) => yScale(d.gdp))
  .attr('width', 10)
  .attr('height', (d) => yScale(d.per_capita_gdp) - yScale(d.gdp));
```

3. **Tooltip and Interaction**
```javascript
// Create tooltip
const tooltip = d3.select('#chart')
  .append('div')
  .attr('class', 'tooltip')
  .style('position', 'absolute')
  .style('font-size', '12px');

// Add event listeners for hover and click
bars.on('mouseover', (event, d) => {
  tooltip
    .text(`Date: ${d.date}\nGDP: ${d.gdp}\nPer capita GDP: ${d.per_capita_gdp}`)
    .style('left', (event.clientX + 10) + 'px')
    .style('top', (event.clientY + 10) + 'px')
    .style('visibility', 'visible');
})
.on('mouseout', () => {
  tooltip.style('visibility', 'hidden');
});

// Add event listener for keyboard navigation
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') {
    // Select previous bar
    bars.classed('selected', false);
    bars.prev().classed('selected', true);
  } else if (event.key === 'ArrowDown') {
    // Select next bar
    bars.classed('selected', false);
    bars.next().classed('selected', true);
  } else if (event.key === 'ArrowLeft') {
    // Select previous bar
    bars.classed('selected', false);
    bars.prev().classed('selected', true);
  } else if (event.key === 'ArrowRight') {
    // Select next bar
    bars.classed('selected', false);
    bars.next().classed('selected', true);
  }
});
```

**Color Palette**

The color palette will be defined in the `style.css` file:
```css
.color-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.color-palette > div {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #fff;
  cursor: pointer;
}

.color-palette > div:hover {
  background-color: #ccc;
}
```
**Observable Color Palette**

The observable color palette will be defined in the `script.js` file:
```javascript
const colorPalette = [
  '#3498db', // sky blue
  '#e74c3c', // orange
  '#f1c40f', // yellow
  '#2ecc71', // green
  '#9b59b6', // purple
  '#16a085', // pink
  '#1abc9c', // green
  '#e67e73', // red
  '#f1e6d4', // light yellow
  '#ecf0f1' // light blue
];

// Update color palette on hover
bars.on('mouseover', (event, d) => {
  d3.select('.color-palette')
    .selectAll('div')
    .attr('background-color', (i) => colorPalette[i % colorPalette.length]);
});
```
This specification outlines the requirements for creating an interactive bar chart using D3.js v7, displaying China's GDP and per capita GDP from 2000 to 2025. The chart should include tooltips, a color palette, keyboard navigation, and be built using the `data/gdp_china.csv` file.