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

    const width = 1200;
    const height = 800;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Define arrowhead marker
    svg.append('defs').append('marker')
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
      .attr('fill', '#3b82f6')
      .style('stroke', 'none');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Use nodeSize instead of size for more even spacing
    const treeLayout = d3.tree<HierarchyNode>()
      .nodeSize([240, 220]); 

    const root = d3.hierarchy(data);
    treeLayout(root);

    // Filter out the virtual root from being drawn
    const nodesData = root.descendants().filter(d => d.data.id !== 'root');
    const linksData = root.links().filter(l => l.source.data.id !== 'root');
    const topLevelNodes = nodesData.filter(d => d.depth === 1).sort((a, b) => a.x - b.x);

    // Initial transform to center the tree
    const rootChildrenCount = data.children?.length || 1;
    const initialX = 600 - (rootChildrenCount * 140);
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(initialX, 150).scale(0.7));

    // Draw Study Header
    const headerGroup = g.append('g')
      .attr('transform', `translate(0, -250)`);

    headerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-4xl font-black fill-slate-900 uppercase tracking-widest')
      .text(studyTitle);

    headerGroup.append('rect')
      .attr('x', -150)
      .attr('y', 20)
      .attr('width', 300)
      .attr('height', 4)
      .attr('fill', '#3b82f6')
      .attr('rx', 2);

    // Draw horizontal line connecting main chapters
    if (topLevelNodes.length > 1) {
      const first = topLevelNodes[0];
      const last = topLevelNodes[topLevelNodes.length - 1];
      
      g.append('line')
        .attr('x1', first.x)
        .attr('y1', first.y - 100)
        .attr('x2', last.x + 100) // Extend further for the arrow
        .attr('y2', last.y - 100)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#arrowhead)');
    }

    // Draw links
    g.selectAll('.link')
      .data(linksData)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4')
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

    // Node circles (representing videos)
    nodes.append('circle')
      .attr('r', (d: any) => Math.max(20, 50 / (d.depth))) // Main chapters bigger
      .attr('fill', '#fff')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('class', 'transition-all duration-300 hover:stroke-blue-400 hover:r-12');

    // Play icon
    nodes.append('path')
      .attr('d', 'M -4 -6 L 8 0 L -4 6 Z')
      .attr('fill', '#3b82f6')
      .attr('transform', (d: any) => `scale(${1.5 / (d.depth)})`);

    // Labels
    nodes.append('text')
      .attr('dy', (d: any) => Math.max(20, 50 / (d.depth)) + 25)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm font-bold fill-slate-800')
      .text((d: any) => d.data.title);

    nodes.append('text')
      .attr('dy', (d: any) => Math.max(20, 50 / (d.depth)) + 42)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] font-medium fill-slate-400 uppercase tracking-tighter')
      .text((d: any) => `Chapter ${d.data.id}`);

  }, [data, onNodeClick]);

  return (
    <div className="w-full h-full overflow-auto bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
      <svg
        ref={svgRef}
        width={1200}
        height={800}
        className="mx-auto"
      />
    </div>
  );
};

export default VideoTree;
