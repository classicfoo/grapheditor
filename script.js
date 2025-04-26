document.addEventListener('DOMContentLoaded', function() {
    // Initialize app state
    let state = {
        nodes: [
            { id: 'A', label: 'Node A', width: 100, height: 40, shape: 'rect' },
            { id: 'B', label: 'Node B', width: 100, height: 40, shape: 'rect' },
            { id: 'C', label: 'Node C', width: 100, height: 40, shape: 'rect' }
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

    // Load state from local storage if available
    function loadFromLocalStorage() {
        const savedState = localStorage.getItem('graphEditorState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                if (parsedState.nodes && parsedState.edges && parsedState.settings) {
                    state = parsedState;
                    
                    // Update UI elements to reflect loaded settings
                    rankdirSelect.value = state.settings.rankdir;
                    nodesepInput.value = state.settings.nodesep;
                    ranksepInput.value = state.settings.ranksep;
                    nodeColorInput.value = state.settings.nodeColor;
                    edgeColorInput.value = state.settings.edgeColor;
                    
                    console.log('State loaded from local storage');
                }
            } catch (error) {
                console.error('Error loading state from local storage:', error);
            }
        }
    }

    // Save state to local storage
    function saveToLocalStorage() {
        try {
            localStorage.setItem('graphEditorState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }

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
    const exportProjectBtn = document.getElementById('export-project');
    const importProjectInput = document.getElementById('import-project');

    // Initialize tables
    function renderNodeTable() {
        nodeTbody.innerHTML = '';
        state.nodes.forEach((node, index) => {
            const row = document.createElement('tr');
            
            // Create shape dropdown options
            const shapeOptions = [
                { value: 'rect', label: 'Rectangle' },
                { value: 'ellipse', label: 'Ellipse' },
                { value: 'diamond', label: 'Diamond' }
            ];
            
            let shapeOptionsHTML = '';
            shapeOptions.forEach(option => {
                const selected = node.shape === option.value ? 'selected' : '';
                shapeOptionsHTML += `<option value="${option.value}" ${selected}>${option.label}</option>`;
            });
            
            row.innerHTML = `
                <td><input type="text" class="node-id" value="${node.id}" data-index="${index}"></td>
                <td><input type="text" class="node-label" value="${node.label}" data-index="${index}"></td>
                <td><input type="number" class="node-width" value="${node.width}" min="30" max="300" data-index="${index}"></td>
                <td><input type="number" class="node-height" value="${node.height}" min="20" max="200" data-index="${index}"></td>
                <td>
                    <select class="node-shape" data-index="${index}">
                        ${shapeOptionsHTML}
                    </select>
                </td>
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
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.node-label').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].label = this.value;
                generateGraph(); // Regenerate graph when node label changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.node-width').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].width = parseInt(this.value);
                generateGraph(); // Regenerate graph when node width changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.node-height').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].height = parseInt(this.value);
                generateGraph(); // Regenerate graph when node height changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        // Add event listener for shape dropdown
        document.querySelectorAll('.node-shape').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].shape = this.value;
                generateGraph(); // Regenerate graph when node shape changes
                saveToLocalStorage(); // Save changes to local storage
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
                saveToLocalStorage(); // Save changes to local storage
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
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.edge-target').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].target = this.value;
                generateGraph(); // Regenerate graph when edge target changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.edge-label').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].label = this.value;
                generateGraph(); // Regenerate graph when edge label changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.delete-edge').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                state.edges.splice(index, 1);
                renderEdgeTable();
                generateGraph(); // Regenerate graph when edge is deleted
                saveToLocalStorage(); // Save changes to local storage
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
            height: 40,
            shape: 'rect' // Default shape is rectangle
        });
        
        renderNodeTable();
        renderEdgeTable();
        generateGraph(); // Regenerate graph when new node is added
        saveToLocalStorage(); // Save changes to local storage
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
        saveToLocalStorage(); // Save changes to local storage
    });

    // Update settings
    rankdirSelect.addEventListener('change', function() {
        state.settings.rankdir = this.value;
        generateGraph(); // Regenerate graph when direction changes
        saveToLocalStorage(); // Save changes to local storage
    });

    nodesepInput.addEventListener('change', function() {
        state.settings.nodesep = parseInt(this.value);
        generateGraph(); // Regenerate graph when node separation changes
        saveToLocalStorage(); // Save changes to local storage
    });

    ranksepInput.addEventListener('change', function() {
        state.settings.ranksep = parseInt(this.value);
        generateGraph(); // Regenerate graph when rank separation changes
        saveToLocalStorage(); // Save changes to local storage
    });

    nodeColorInput.addEventListener('change', function() {
        state.settings.nodeColor = this.value;
        generateGraph(); // Regenerate graph when node color changes
        saveToLocalStorage(); // Save changes to local storage
    });

    edgeColorInput.addEventListener('change', function() {
        state.settings.edgeColor = this.value;
        generateGraph(); // Regenerate graph when edge color changes
        saveToLocalStorage(); // Save changes to local storage
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
                height: node.height,
                shape: node.shape
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
        
        // Add nodes with different shapes
        const nodes = svgGroup.selectAll('.node')
            .data(g.nodes().map(v => {
                return { id: v, ...g.node(v) };
            }))
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x - d.width/2}, ${d.y - d.height/2})`);
        
        // Function to create a diamond path
        function diamondPath(width, height) {
            return `M${width/2},0 L${width},${height/2} L${width/2},${height} L0,${height/2} Z`;
        }
        
        // Add the appropriate shape based on node.shape
        nodes.each(function(d) {
            const node = d3.select(this);
            
            switch(d.shape) {
                case 'ellipse':
                    node.append('ellipse')
                        .attr('cx', d.width / 2)
                        .attr('cy', d.height / 2)
                        .attr('rx', d.width / 2)
                        .attr('ry', d.height / 2)
                        .attr('fill', state.settings.nodeColor)
                        .attr('stroke', '#333')
                        .attr('stroke-width', '1.5px');
                    break;
                
                case 'diamond':
                    node.append('path')
                        .attr('d', diamondPath(d.width, d.height))
                        .attr('fill', state.settings.nodeColor)
                        .attr('stroke', '#333')
                        .attr('stroke-width', '1.5px');
                    break;
                
                case 'rect':
                default:
                    node.append('rect')
                        .attr('width', d.width)
                        .attr('height', d.height)
                        .attr('rx', 5)
                        .attr('ry', 5)
                        .attr('fill', state.settings.nodeColor)
                        .attr('stroke', '#333')
                        .attr('stroke-width', '1.5px');
                    break;
            }
        });
        
        // Add text labels to nodes
        nodes.append('text')
            .attr('x', d => d.width / 2)
            .attr('y', d => d.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text(d => d.label);
        
        // Function to adjust edge endpoints based on node shape
        function adjustEdgeEndpoints(points, sourceNode, targetNode) {
            if (!points || points.length < 2) return points;
            
            const adjustedPoints = [...points];
            
            // Adjust start point (source node)
            if (sourceNode) {
                const firstPoint = adjustedPoints[0];
                const secondPoint = adjustedPoints[1];
                const sourceX = sourceNode.x;
                const sourceY = sourceNode.y;
                
                // Calculate direction vector from source node center to first edge point
                const dx = firstPoint.x - sourceX;
                const dy = firstPoint.y - sourceY;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                // Normalize direction vector
                const ndx = dx / length;
                const ndy = dy / length;
                
                // Adjust based on shape
                let intersectionPoint;
                switch(sourceNode.shape) {
                    case 'ellipse':
                        // Ellipse intersection (approximation)
                        const rxs = sourceNode.width / 2;
                        const rys = sourceNode.height / 2;
                        const scale = rxs * rys / Math.sqrt(rys * rys * ndx * ndx + rxs * rxs * ndy * ndy);
                        intersectionPoint = {
                            x: sourceX + ndx * scale,
                            y: sourceY + ndy * scale
                        };
                        break;
                        
                    case 'diamond':
                        // Diamond corners
                        const halfWidth = sourceNode.width / 2;
                        const halfHeight = sourceNode.height / 2;
                        
                        // Diamond corners
                        const top = { x: sourceX, y: sourceY - halfHeight };
                        const right = { x: sourceX + halfWidth, y: sourceY };
                        const bottom = { x: sourceX, y: sourceY + halfHeight };
                        const left = { x: sourceX - halfWidth, y: sourceY };
                        
                        // Determine which edge to intersect with based on the direction
                        let edge1, edge2;
                        
                        if (ndx >= 0 && ndy >= 0) {
                            // Bottom-right quadrant
                            edge1 = { p1: right, p2: bottom };
                        } else if (ndx < 0 && ndy >= 0) {
                            // Bottom-left quadrant
                            edge1 = { p1: bottom, p2: left };
                        } else if (ndx < 0 && ndy < 0) {
                            // Top-left quadrant
                            edge1 = { p1: left, p2: top };
                        } else {
                            // Top-right quadrant
                            edge1 = { p1: top, p2: right };
                        }
                        
                        // Find intersection with the line from center to the edge point
                        const line = { p1: { x: sourceX, y: sourceY }, p2: { x: sourceX + ndx, y: sourceY + ndy } };
                        
                        // Line-line intersection
                        const x1 = edge1.p1.x, y1 = edge1.p1.y;
                        const x2 = edge1.p2.x, y2 = edge1.p2.y;
                        const x3 = line.p1.x, y3 = line.p1.y;
                        const x4 = line.p2.x, y4 = line.p2.y;
                        
                        const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
                        
                        if (denominator !== 0) {
                            const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
                            
                            if (ua >= 0 && ua <= 1) {
                                intersectionPoint = {
                                    x: x1 + ua * (x2 - x1),
                                    y: y1 + ua * (y2 - y1)
                                };
                            }
                        }
                        
                        // If no intersection found (shouldn't happen), use the old method as fallback
                        if (!intersectionPoint) {
                            if (Math.abs(ndx) > Math.abs(ndy)) {
                                // Intersect with left/right edge
                                intersectionPoint = {
                                    x: sourceX + Math.sign(ndx) * halfWidth,
                                    y: sourceY + ndy * (halfWidth / Math.abs(ndx))
                                };
                            } else {
                                // Intersect with top/bottom edge
                                intersectionPoint = {
                                    x: sourceX + ndx * (halfHeight / Math.abs(ndy)),
                                    y: sourceY + Math.sign(ndy) * halfHeight
                                };
                            }
                        }
                        break;
                        
                    case 'rect':
                    default:
                        // Rectangle intersection
                        const rx = sourceNode.width / 2;
                        const ry = sourceNode.height / 2;
                        
                        // Find intersection with rectangle
                        if (Math.abs(ndx) * ry > Math.abs(ndy) * rx) {
                            // Intersect with right/left edge
                            const sx = Math.sign(ndx) * rx;
                            const sy = ndy * (sx / ndx);
                            intersectionPoint = {
                                x: sourceX + sx,
                                y: sourceY + sy
                            };
                        } else {
                            // Intersect with top/bottom edge
                            const sy = Math.sign(ndy) * ry;
                            const sx = ndx * (sy / ndy);
                            intersectionPoint = {
                                x: sourceX + sx,
                                y: sourceY + sy
                            };
                        }
                        break;
                }
                
                adjustedPoints[0] = intersectionPoint;
            }
            
            // Adjust end point (target node)
            if (targetNode) {
                const lastPoint = adjustedPoints[adjustedPoints.length - 1];
                const secondLastPoint = adjustedPoints[adjustedPoints.length - 2];
                const targetX = targetNode.x;
                const targetY = targetNode.y;
                
                // Calculate direction vector from last edge point to target node center
                const dx = targetX - lastPoint.x;
                const dy = targetY - lastPoint.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                // Normalize direction vector
                const ndx = dx / length;
                const ndy = dy / length;
                
                // Adjust based on shape
                let intersectionPoint;
                switch(targetNode.shape) {
                    case 'ellipse':
                        // Ellipse intersection (approximation)
                        const rxt = targetNode.width / 2;
                        const ryt = targetNode.height / 2;
                        const scale = rxt * ryt / Math.sqrt(ryt * ryt * ndx * ndx + rxt * rxt * ndy * ndy);
                        intersectionPoint = {
                            x: targetX - ndx * scale,
                            y: targetY - ndy * scale
                        };
                        break;
                        
                    case 'diamond':
                        // Diamond corners
                        const halfWidth = targetNode.width / 2;
                        const halfHeight = targetNode.height / 2;
                        
                        // Diamond corners
                        const top = { x: targetX, y: targetY - halfHeight };
                        const right = { x: targetX + halfWidth, y: targetY };
                        const bottom = { x: targetX, y: targetY + halfHeight };
                        const left = { x: targetX - halfWidth, y: targetY };
                        
                        // Determine which edge to intersect with based on the direction
                        let edge1, edge2;
                        
                        if (ndx >= 0 && ndy >= 0) {
                            // Bottom-right quadrant
                            edge1 = { p1: top, p2: left };
                        } else if (ndx < 0 && ndy >= 0) {
                            // Bottom-left quadrant
                            edge1 = { p1: top, p2: right };
                        } else if (ndx < 0 && ndy < 0) {
                            // Top-left quadrant
                            edge1 = { p1: bottom, p2: right };
                        } else {
                            // Top-right quadrant
                            edge1 = { p1: left, p2: bottom };
                        }
                        
                        // Find intersection with the line from center to the edge point
                        const line = { p1: { x: targetX, y: targetY }, p2: { x: targetX + ndx, y: targetY + ndy } };
                        
                        // Line-line intersection
                        const x1 = edge1.p1.x, y1 = edge1.p1.y;
                        const x2 = edge1.p2.x, y2 = edge1.p2.y;
                        const x3 = line.p1.x, y3 = line.p1.y;
                        const x4 = line.p2.x, y4 = line.p2.y;
                        
                        const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
                        
                        if (denominator !== 0) {
                            const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
                            
                            if (ua >= 0 && ua <= 1) {
                                intersectionPoint = {
                                    x: x1 + ua * (x2 - x1),
                                    y: y1 + ua * (y2 - y1)
                                };
                            }
                        }
                        
                        // If no intersection found (shouldn't happen), use the old method as fallback
                        if (!intersectionPoint) {
                            if (Math.abs(ndx) > Math.abs(ndy)) {
                                // Intersect with left/right edge
                                intersectionPoint = {
                                    x: targetX - Math.sign(ndx) * halfWidth,
                                    y: targetY - ndy * (halfWidth / Math.abs(ndx))
                                };
                            } else {
                                // Intersect with top/bottom edge
                                intersectionPoint = {
                                    x: targetX - ndx * (halfHeight / Math.abs(ndy)),
                                    y: targetY - Math.sign(ndy) * halfHeight
                                };
                            }
                        }
                        break;
                        
                    case 'rect':
                    default:
                        // Rectangle intersection
                        const rx = targetNode.width / 2;
                        const ry = targetNode.height / 2;
                        
                        // Find intersection with rectangle
                        if (Math.abs(ndx) * ry > Math.abs(ndy) * rx) {
                            // Intersect with right/left edge
                            const sx = Math.sign(ndx) * rx;
                            const sy = ndy * (sx / ndx);
                            intersectionPoint = {
                                x: targetX - sx,
                                y: targetY - sy
                            };
                        } else {
                            // Intersect with top/bottom edge
                            const sy = Math.sign(ndy) * ry;
                            const sx = ndx * (sy / ndy);
                            intersectionPoint = {
                                x: targetX - sx,
                                y: targetY - sy
                            };
                        }
                        break;
                }
                
                adjustedPoints[adjustedPoints.length - 1] = intersectionPoint;
            }
            
            return adjustedPoints;
        }
        
        // Add edges with adjusted endpoints
        const edges = svgGroup.selectAll('.edge')
            .data(g.edges().map(e => {
                const sourceNode = g.node(e.v);
                const targetNode = g.node(e.w);
                const edgeData = g.edge(e);
                
                // Adjust edge points based on node shapes
                const adjustedPoints = adjustEdgeEndpoints(
                    edgeData.points, 
                    sourceNode, 
                    targetNode
                );
                
                return {
                    points: adjustedPoints,
                    source: sourceNode,
                    target: targetNode,
                    label: edgeData.label
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
            .attr('marker-end', 'url(#arrowhead)')
            .attr('fill', 'none');
        
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
            .attr('fill', state.settings.edgeColor)
            .attr('stroke', 'none');
    }

    // Export functions
    exportSvgBtn.addEventListener('click', function() {
        const svgElement = document.getElementById('graph');
        
        // Clone the SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true);
        
        // Add inline CSS to ensure styles are preserved in the export
        const style = document.createElement('style');
        style.textContent = `
            .node rect {
                stroke: #333;
                stroke-width: 1.5px;
            }
            .node text {
                font-size: 14px;
            }
            .edge path {
                stroke-width: 1.5px;
                fill: none;
            }
            .edge-label {
                font-size: 12px;
                text-anchor: middle;
            }
        `;
        svgClone.insertBefore(style, svgClone.firstChild);
        
        const svgData = new XMLSerializer().serializeToString(svgClone);
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

    // Export project function
    exportProjectBtn.addEventListener('click', function() {
        // Create a project object with all the data
        const project = {
            nodes: state.nodes,
            edges: state.edges,
            settings: state.settings
        };
        
        // Convert to JSON string
        const projectJson = JSON.stringify(project, null, 2);
        
        // Create and download the file
        const blob = new Blob([projectJson], {type: 'application/json'});
        saveAs(blob, 'graph-project.json');
    });

    // Import project function
    importProjectInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const project = JSON.parse(e.target.result);
                
                // Validate the imported data
                if (!project.nodes || !project.edges || !project.settings) {
                    throw new Error('Invalid project file format');
                }
                
                // Update the state with imported data
                state.nodes = project.nodes;
                state.edges = project.edges;
                state.settings = project.settings;
                
                // Update UI elements to reflect imported settings
                rankdirSelect.value = state.settings.rankdir;
                nodesepInput.value = state.settings.nodesep;
                ranksepInput.value = state.settings.ranksep;
                nodeColorInput.value = state.settings.nodeColor;
                edgeColorInput.value = state.settings.edgeColor;
                
                // Refresh the tables and graph
                renderNodeTable();
                renderEdgeTable();
                generateGraph();
                saveToLocalStorage(); // Save imported project to local storage
                
                alert('Project imported successfully!');
            } catch (error) {
                alert('Error importing project: ' + error.message);
            }
            
            // Reset the file input
            event.target.value = '';
        };
        
        reader.readAsText(file);
    });

    // Add a clear local storage button (optional)
    const clearStorageBtn = document.createElement('button');
    clearStorageBtn.textContent = 'Clear Saved Data';
    clearStorageBtn.id = 'clear-storage';
    clearStorageBtn.className = 'clear-btn';
    clearStorageBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
            localStorage.removeItem('graphEditorState');
            location.reload();
        }
    });
    document.querySelector('.actions').appendChild(clearStorageBtn);

    // Initialize the app
    loadFromLocalStorage(); // Load state from local storage
    renderNodeTable();
    renderEdgeTable();
    
    generateGraph(); // Generate graph on load
});