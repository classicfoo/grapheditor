// Create a new directed graph
var g = new dagre.graphlib.Graph();

// Set an object for the graph label
g.setGraph({
    rankdir: 'LR',  // Left to right layout
    nodesep: 50,    // Minimum space between nodes
    ranksep: 50     // Minimum space between ranks
});

// Set default node style
g.setDefaultNodeLabel(() => ({}));
// Set default edge style
g.setDefaultEdgeLabel(() => ({}));

// Add nodes to the graph
g.setNode('A', { label: 'A', width: 50, height: 30 });
g.setNode('B', { label: 'B', width: 50, height: 30 });
g.setNode('C', { label: 'C', width: 50, height: 30 });
g.setNode('D', { label: 'D', width: 50, height: 30 });
g.setNode('E', { label: 'E', width: 50, height: 30 });

// Add edges to the graph
g.setEdge('A', 'B', {});
g.setEdge('A', 'C', {});
g.setEdge('B', 'D', {});
g.setEdge('C', 'D', {});
g.setEdge('D', 'E', {});

// Run the layout algorithm
dagre.layout(g);

// Create SVG container
const svg = d3.select('svg');
const width = 800;
const height = 400;
svg.attr('width', width)
   .attr('height', height);

// Create a group for the graph
const svgGroup = svg.append('g')
    .attr('transform', 'translate(50, 50)');

// Add nodes
const nodes = svgGroup.selectAll('.node')
    .data(g.nodes().map(v => {
        return { id: v, ...g.node(v) };
    }))
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x - d.width/2}, ${d.y - d.height/2})`);

nodes.append('rect')
    .attr('width', d => d.width)
    .attr('height', d => d.height);

nodes.append('text')
    .attr('x', d => d.width / 2)
    .attr('y', d => d.height / 2)
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .text(d => d.label);

// Add edges
const edges = svgGroup.selectAll('.edge')
    .data(g.edges().map(e => {
        return {
            points: g.edge(e).points,
            source: g.node(e.v),
            target: g.node(e.w)
        };
    }))
    .enter()
    .append('g')
    .attr('class', 'edge');

edges.append('path')
    .attr('d', d => {
        let path = '';
        const points = d.points;
        
        if (points && points.length > 0) {
            path = `M${points[0].x},${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                path += `L${points[i].x},${points[i].y}`;
            }
        }
        
        return path;
    })
    .attr('fill', 'none')
    .attr('stroke', '#000');