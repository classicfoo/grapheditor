document.addEventListener('DOMContentLoaded', function() {
    // Initialize app state
    const state = {
        nodes: [
            { id: 'A', label: 'Node A', width: 100, height: 40 },
            { id: 'B', label: 'Node B', width: 100, height: 40 },
            { id: 'C', label: 'Node C', width: 100, height: 40 }
        ],
        edges: [
            { source: 'A', target: 'B', label: 'Edge 1' },
            { source: 'A', target: 'C', label: 'Edge 2' }
        ],
        settings: {
            rankdir: 'TB',
            nodesep: 50,
            ranksep: 50,
            nodeColor: '#ffffff',
            edgeColor: '#333333'
        }
    };

    // DOM elements
    const nodeTbody = document.getElementById('node-tbody');
    const edgeTbody = document.getElementById('edge-tbody');
    const addNodeBtn = document.getElementById('add-node');
    const addEdgeBtn = document.getElementById('add-edge');
    const exportSvgBtn = document.getElementById('export-svg');
    const exportPngBtn = document.getElementById('export-png');
    const rankdirSelect = document.getElementById('rankdir');
    const nodesepInput = document.getElementById('nodesep');
    const ranksepInput = document.getElementById('ranksep');
    const nodeColorInput = document.getElementById('node-color');
    const edgeColorInput = document.getElementById('edge-color');

    // Initialize tables
    function renderNodeTable() {
        nodeTbody.innerHTML = '';
        state.nodes.forEach((node, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="node-id" value="${node.id}" data-index="${index}"></td>
                <td><input type="text" class="node-label" value="${node.label}" data-index="${index}"></td>
                <td><input type="number" class="node-width" value="${node.width}" min="30" max="300" data-index="${index}"></td>
                <td><input type="number" class="node-height" value="${node.height}" min="20" max="200" data-index="${index}"></td>
                <td><button class="delete-btn delete-node" data-index="${index}">Delete</button></td>
            `;
            nodeTbody.appendChild(row);
        });

        // Add event listeners to node inputs
        document.querySelectorAll('.node-id').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                const oldId = state.nodes[index].id;
                const newId = this.value;
                
                // Update edges that reference this node
                state.edges.forEach(edge => {
                    if (edge.source === oldId) edge.source = newId;
                    if (edge.target === oldId) edge.target = newId;
                });
                
                state.nodes[index].id = newId;
                renderEdgeTable(); // Refresh edge table to show updated IDs
                generateGraph(); // Regenerate graph when node ID changes
            });
        });

        document.querySelectorAll('.node-label').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].label = this.value;
                generateGraph(); // Regenerate graph when node label changes
            });
        });

        document.querySelectorAll('.node-width').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].width = parseInt(this.value);
                generateGraph(); // Regenerate graph when node width changes
            });
        });

        document.querySelectorAll('.node-height').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].height = parseInt(this.value);
                generateGraph(); // Regenerate graph when node height changes
            });
        });

        document.querySelectorAll('.delete-node').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const nodeId = state.nodes[index].id;
                
                // Remove the node
                state.nodes.splice(index, 1);
                
                // Remove any edges connected to this node
                state.edges = state.edges.filter(edge => 
                    edge.source !== nodeId && edge.target !== nodeId
                );
                
                renderNodeTable();
                renderEdgeTable();
                generateGraph(); // Regenerate graph when node is deleted
            });
        });
    }

    function renderEdgeTable() {
        edgeTbody.innerHTML = '';
        state.edges.forEach((edge, index) => {
            const row = document.createElement('tr');
            
            // Create source dropdown
            let sourceOptions = '';
            state.nodes.forEach(node => {
                const selected = node.id === edge.source ? 'selected' : '';
                sourceOptions += `<option value="${node.id}" ${selected}>${node.id}</option>`;
            });
            
            // Create target dropdown
            let targetOptions = '';
            state.nodes.forEach(node => {
                const selected = node.id === edge.target ? 'selected' : '';
                targetOptions += `<option value="${node.id}" ${selected}>${node.id}</option>`;
            });
            
            row.innerHTML = `
                <td>
                    <select class="edge-source" data-index="${index}">
                        ${sourceOptions}
                    </select>
                </td>
                <td>
                    <select class="edge-target" data-index="${index}">
                        ${targetOptions}
                    </select>
                </td>
                <td><input type="text" class="edge-label" value="${edge.label || ''}" data-index="${index}"></td>
                <td><button class="delete-btn delete-edge" data-index="${index}">Delete</button></td>
            `;
            edgeTbody.appendChild(row);
        });

        // Add event listeners to edge inputs
        document.querySelectorAll('.edge-source').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].source = this.value;
                generateGraph(); // Regenerate graph when edge source changes
            });
        });

        document.querySelectorAll('.edge-target').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].target = this.value;
                generateGraph(); // Regenerate graph when edge target changes
            });
        });

        document.querySelectorAll('.edge-label').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].label = this.value;
                generateGraph(); // Regenerate graph when edge label changes
            });
        });

        document.querySelectorAll('.delete-edge').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                state.edges.splice(index, 1);
                renderEdgeTable();
                generateGraph(); // Regenerate graph when edge is deleted
            });
        });
    }

    // Add new node
    addNodeBtn.addEventListener('click', function() {
        // Generate a unique ID
        let newId = 'Node' + (state.nodes.length + 1);
        while (state.nodes.some(node => node.id === newId)) {
            newId = 'Node' + (parseInt(newId.replace('Node', '')) + 1);
        }
        
        state.nodes.push({
            id: newId,
            label: newId,
            width: 100,
            height: 40
        });
        
        renderNodeTable();
        renderEdgeTable();
        generateGraph(); // Regenerate graph when new node is added
    });

    // Add new edge
    addEdgeBtn.addEventListener('click', function() {
        if (state.nodes.length < 2) {
            alert('You need at least 2 nodes to create an edge.');
            return;
        }
        
        state.edges.push({
            source: state.nodes[0].id,
            target: state.nodes[1].id,
            label: ''
        });
        
        renderEdgeTable();
        generateGraph(); // Regenerate graph when new edge is added
    });

    // Update settings
    rankdirSelect.addEventListener('change', function() {
        state.settings.rankdir = this.value;
        generateGraph(); // Regenerate graph when direction changes
    });

    nodesepInput.addEventListener('change', function() {
        state.settings.nodesep = parseInt(this.value);
        generateGraph(); // Regenerate graph when node separation changes
    });

    ranksepInput.addEventListener('change', function() {
        state.settings.ranksep = parseInt(this.value);
        generateGraph(); // Regenerate graph when rank separation changes
    });

    nodeColorInput.addEventListener('change', function() {
        state.settings.nodeColor = this.value;
        generateGraph(); // Regenerate graph when node color changes
    });

    edgeColorInput.addEventListener('change', function() {
        state.settings.edgeColor = this.value;
        generateGraph(); // Regenerate graph when edge color changes
    });

    // Generate graph
    function generateGraph() {
        // Create a new directed graph
        const g = new dagre.graphlib.Graph();

        // Set graph settings
        g.setGraph({
            rankdir: state.settings.rankdir,
            nodesep: state.settings.nodesep,
            ranksep: state.settings.ranksep,
            marginx: 20,
            marginy: 20
        });

        // Set default node and edge labels
        g.setDefaultNodeLabel(() => ({}));
        g.setDefaultEdgeLabel(() => ({}));

        // Add nodes to the graph
        state.nodes.forEach(node => {
            g.setNode(node.id, {
                label: node.label,
                width: node.width,
                height: node.height
            });
        });

        // Add edges to the graph
        state.edges.forEach(edge => {
            g.setEdge(edge.source, edge.target, {
                label: edge.label
            });
        });

        // Run the layout algorithm
        dagre.layout(g);

        // Render the graph
        renderSvgGraph(g);
    }

    function renderSvgGraph(g) {
        const svg = d3.select('#graph');
        
        // Clear the SVG
        svg.selectAll('*').remove();
        
        // Get graph dimensions
        const graphWidth = g.graph().width || 300;
        const graphHeight = g.graph().height || 200;
        
        // Set SVG dimensions with some padding
        svg.attr('viewBox', `0 0 ${graphWidth + 40} ${graphHeight + 40}`);
        
        // Create a group for the graph
        const svgGroup = svg.append('g')
            .attr('transform', 'translate(20, 20)');
        
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
            .attr('height', d => d.height)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', state.settings.nodeColor);
        
        nodes.append('text')
            .attr('x', d => d.width / 2)
            .attr('y', d => d.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text(d => d.label);
        
        // Add edges
        const edges = svgGroup.selectAll('.edge')
            .data(g.edges().map(e => {
                return {
                    points: g.edge(e).points,
                    source: g.node(e.v),
                    target: g.node(e.w),
                    label: g.edge(e).label
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
            .attr('stroke', state.settings.edgeColor)
            .attr('marker-end', 'url(#arrowhead)');
        
        // Add edge labels
        edges.filter(d => d.label)
            .append('text')
            .attr('class', 'edge-label')
            .attr('x', d => {
                const points = d.points;
                // Find the middle point of the path
                const midIndex = Math.floor(points.length / 2);
                return (points[midIndex-1].x + points[midIndex].x) / 2;
            })
            .attr('y', d => {
                const points = d.points;
                const midIndex = Math.floor(points.length / 2);
                return (points[midIndex-1].y + points[midIndex].y) / 2;
            })
            .attr('dy', 0) // Remove the vertical offset
            .attr('text-anchor', 'middle') // Center horizontally
            .attr('dominant-baseline', 'middle') // Center vertically
            .attr('fill', '#000')
            .text(d => d.label);
        
        // Add arrowhead marker
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 9)
            .attr('refY', 5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z')
            .attr('fill', state.settings.edgeColor);
    }

    // Export functions
    exportSvgBtn.addEventListener('click', function() {
        const svgElement = document.getElementById('graph');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        saveAs(blob, 'graph.svg');
    });

    exportPngBtn.addEventListener('click', function() {
        const svgElement = document.getElementById('graph');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const svgSize = svgElement.getBoundingClientRect();
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;
        const ctx = canvas.getContext('2d');
        
        // Create an image from the SVG data
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(function(blob) {
                saveAs(blob, 'graph.png');
            });
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });

    // Initialize the app
    renderNodeTable();
    renderEdgeTable();
    
    generateGraph(); // Generate graph on load
});