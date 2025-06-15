
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PollutionResults {
  sourcePoint: any;
  thresholdPoint: any;
  pollutedSegment: any[];
  maxDistance: number;
  totalTime: number;
  finalDensity: number;
  pollutionData: any[];
  distances: number[];
  environmentalImpact: number;
  remediationTime: number;
  affectedSpecies: number;
  sensorReadings: any[];
}

interface PollutionChartProps {
  results: PollutionResults;
  viewMode: string;
  sourceIndex: number;
}

const PollutionChart: React.FC<PollutionChartProps> = ({ results, viewMode, sourceIndex }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!results || !svgRef.current) return;

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Select data series based on view mode
    let dataKey = 'density';
    let yAxisLabel = 'Pollution Density';
    let lineColor = 'steelblue';
    
    if (viewMode === 'oxygen') {
      dataKey = 'dissolvedOxygen';
      yAxisLabel = 'Dissolved Oxygen (mg/L)';
      lineColor = '#00cc66';
    } else if (viewMode === 'ph') {
      dataKey = 'pH';
      yAxisLabel = 'pH Level';
      lineColor = '#9933cc';
    } else if (viewMode === 'turbidity') {
      dataKey = 'turbidity';
      yAxisLabel = 'Turbidity (NTU)';
      lineColor = '#ff9900';
    } else if (viewMode === 'time') {
      dataKey = 'time';
      yAxisLabel = 'Travel Time (hours)';
      lineColor = '#ff3333';
    }

    // Prepare data series that corresponds to polluted segments only
    const chartData = results.pollutionData.filter((d: any) => d.distance >= results.distances[sourceIndex]);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(chartData.map((d: any) => d.distance - results.distances[sourceIndex])) || 0])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData.map((d: any) => d[dataKey])) || 0])
      .range([height - margin.bottom, margin.top]);

    // Create line generator
    const line = d3.line()
      .x((d: any) => xScale(d.distance - results.distances[sourceIndex]))
      .y((d: any) => yScale(d[dataKey]))
      .curve(d3.curveMonotoneX);

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width - margin.right)
      .attr('y', -10)
      .attr('fill', 'black')
      .text('Distance from Source (km)');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -margin.top - 100)
      .attr('fill', 'black')
      .text(yAxisLabel);

    // Draw line path
    svg
      .append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2)
      .attr('d', line as any);

    // Add area under the curve for density graph
    if (viewMode === 'density') {
      const area = d3.area()
        .x((d: any) => xScale(d.distance - results.distances[sourceIndex]))
        .y0(height - margin.bottom)
        .y1((d: any) => yScale(d.density))
        .curve(d3.curveMonotoneX);

      svg
        .append('path')
        .datum(chartData)
        .attr('fill', 'steelblue')
        .attr('fill-opacity', 0.2)
        .attr('d', area as any);
    }

    // Add dots for data points
    svg
      .selectAll('circle')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('cx', (d: any) => xScale(d.distance - results.distances[sourceIndex]))
      .attr('cy', (d: any) => yScale(d[dataKey]))
      .attr('r', 3)
      .attr('fill', lineColor);

    // Add threshold line for density view
    if (viewMode === 'density') {
      const thresholdValue = results.pollutionData[sourceIndex].density * 0.1;
      
      svg
        .append('line')
        .attr('x1', margin.left)
        .attr('y1', yScale(thresholdValue))
        .attr('x2', width - margin.right)
        .attr('y2', yScale(thresholdValue))
        .attr('stroke', 'red')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5');
        
      svg
        .append('text')
        .attr('x', margin.left + 10)
        .attr('y', yScale(thresholdValue) - 5)
        .attr('fill', 'red')
        .attr('font-size', 12)
        .text('Threshold (10%)');
    }

    // Add markers for source and threshold points
    svg
      .append('circle')
      .attr('cx', xScale(0))
      .attr('cy', yScale(chartData[0][dataKey]))
      .attr('r', 5)
      .attr('fill', 'red');

    const thresholdDistance = 
      results.pollutionData.find((d: any) => d.point.id === results.thresholdPoint.id)?.distance - 
      results.distances[sourceIndex];
      
    if (thresholdDistance) {
      const thresholdY = results.pollutionData.find((d: any) => d.point.id === results.thresholdPoint.id)?.[dataKey] || 0;
      
      svg
        .append('circle')
        .attr('cx', xScale(thresholdDistance))
        .attr('cy', yScale(thresholdY))
        .attr('r', 5)
        .attr('fill', 'green');
    }

    // Add tooltips for important points
    const tooltipData = [
      { label: 'Source', x: 0, y: chartData[0][dataKey], color: 'red' },
      { label: 'Threshold Point', x: thresholdDistance || 0, 
        y: results.pollutionData.find((d: any) => d.point.id === results.thresholdPoint.id)?.[dataKey] || 0, 
        color: 'green' }
    ];

    tooltipData.forEach(point => {
      svg
        .append('text')
        .attr('x', xScale(point.x))
        .attr('y', yScale(point.y) - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('fill', point.color)
        .text(point.label);
    });
  }, [results, viewMode, sourceIndex]);

  return (
    <div className="flex justify-center">
      <div className="w-full overflow-x-auto">
        <svg ref={svgRef} width={800} height={400}></svg>
      </div>
    </div>
  );
};

export default PollutionChart;
