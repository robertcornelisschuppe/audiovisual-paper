import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { HierarchyNode } from '../types';

interface VideoTreeProps {
  data: HierarchyNode;
  onNodeClick: (node: HierarchyNode) => void;
  studyTitle?: string;
}

const VideoTree: React.FC<VideoTreeProps> = ({ data, onNodeClick, studyTitle = "Research Study Overview" }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const container = svgRef.current.parentElement;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Define arrowhead marker and gradients
    const defs = svg.append('defs');
    
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#818cf8')
      .style('stroke', 'none');

    const gradient = defs.append('radialGradient')
      .attr('id', 'node-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ffffff');
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#fdfcfb');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Use nodeSize instead of size for more even spacing
    const treeLayout = d3.tree<HierarchyNode>()
      .nodeSize([280, 240]); 

    const root = d3.hierarchy(data);
    treeLayout(root);

    // Filter out the virtual root from being drawn
    const nodesData = root.descendants().filter(d => d.data.id !== 'root');
    const linksData = root.links().filter(l => l.source.data.id !== 'root');
    const topLevelNodes = nodesData.filter(d => d.depth === 1).sort((a, b) => a.x - b.x);

    // Calculate bounding box of all nodes to fit to screen
    const xExtent = d3.extent(nodesData, d => d.x) as [number, number];
    const yExtent = d3.extent(nodesData, d => d.y - 100) as [number, number];
    
    // Include the header in the bounding box
    const minY = Math.min(yExtent[0], -400);
    const maxY = yExtent[1] + 200;
    const minX = xExtent[0] - 200; 
    const maxX = xExtent[1] + 200;

    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    
    const padding = 80;
    const scale = Math.min(
      (width - padding * 2) / treeWidth,
      (height - padding * 2) / treeHeight,
      0.7
    );
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-centerX, -centerY);

    svg.call(zoom.transform as any, transform);

    // Draw Study Header
    const headerGroup = g.append('g')
      .attr('transform', `translate(0, -320)`);

    headerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'serif text-6xl font-light fill-slate-800 tracking-tight italic')
      .text(studyTitle);

    headerGroup.append('line')
      .attr('x1', -100)
      .attr('y1', 40)
      .attr('x2', 100)
      .attr('y2', 40)
      .attr('stroke', '#818cf8')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.5);

    // Draw horizontal line connecting main chapters
    if (topLevelNodes.length > 1) {
      const first = topLevelNodes[0];
      const last = topLevelNodes[topLevelNodes.length - 1];
      
      g.append('path')
        .attr('d', `M ${first.x} ${first.y - 120} L ${last.x + 120} ${last.y - 120}`)
        .attr('fill', 'none')
        .attr('stroke', '#818cf8')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.3)
        .attr('stroke-dasharray', '4,4')
        .attr('marker-end', 'url(#arrowhead)');
    }

    // Draw links (curved)
    g.selectAll('.link')
      .data(linksData)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.5)
      .attr('d', d3.linkVertical()
        .x((d: any) => d.x)
        .y((d: any) => d.y - 100) as any);

    // Draw nodes
    const nodes = g.selectAll('.node')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y - 100})`)
      .on('click', (event, d) => onNodeClick(d.data))
      .style('cursor', 'pointer');

    // Node circles with shadow and gradient
    nodes.append('circle')
      .attr('r', (d: any) => Math.max(24, 60 / (d.depth)))
      .attr('fill', 'url(#node-gradient)')
      .attr('stroke', '#818cf8')
      .attr('stroke-width', (d: any) => d.depth === 1 ? 3 : 2)
      .attr('class', 'transition-all duration-500 hover:stroke-indigo-400')
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))');

    // Play icon
    nodes.append('path')
      .attr('d', 'M -3 -5 L 6 0 L -3 5 Z')
      .attr('fill', '#818cf8')
      .attr('transform', (d: any) => `scale(${1.8 / (d.depth)})`);

    // Labels
    nodes.append('text')
      .attr('dy', (d: any) => Math.max(24, 60 / (d.depth)) + 45)
      .attr('text-anchor', 'middle')
      .attr('class', 'serif text-2xl font-semibold fill-slate-800')
      .text((d: any) => d.data.title);

    nodes.append('text')
      .attr('dy', (d: any) => Math.max(24, 60 / (d.depth)) + 70)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[11px] font-bold fill-slate-400 uppercase tracking-[0.2em]')
      .text((d: any) => `Chapter ${d.data.id}`);

  }, [data, onNodeClick]);

  return (
    <div className="w-full h-full overflow-hidden bg-[#fdfcfb]">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="w-full h-full"
      />
    </div>
  );
};

export default VideoTree;
