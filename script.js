document.addEventListener('DOMContentLoaded', function() {
    // Initialize app state
    let state = {
        nodes: [
            { id: 'A', label: 'Node A', shape: 'rect' },
            { id: 'B', label: 'Node B', shape: 'rect' },
            { id: 'C', label: 'Node C', shape: 'rect' }
        ],
        edges: [
            { source: 'A', target: 'B', label: 'Edge 1' },
            { source: 'A', target: 'C', label: 'Edge 2' }
        ],
        settings: {
            // Layout settings
            rankdir: 'TB',
            nodesep: 50,
            ranksep: 50,
            
            // Node appearance
            nodeColor: '#ffffff',
            nodeTextColor: '#000000',
            nodeStrokeColor: '#333333',
            nodeStrokeWidth: 1.5,
            nodeWidth: 100,
            nodeHeight: 40,
            
            // Edge appearance
            edgeColor: '#333333',
            edgeTextColor: '#000000',
            edgeWidth: 1.5
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
                    
                    // Node appearance
                    nodeColorInput.value = state.settings.nodeColor;
                    nodeTextColorInput.value = state.settings.nodeTextColor || '#000000';
                    nodeStrokeColorInput.value = state.settings.nodeStrokeColor || '#333333';
                    nodeStrokeWidthInput.value = state.settings.nodeStrokeWidth || 1.5;
                    nodeWidthInput.value = state.settings.nodeWidth || 100;
                    nodeHeightInput.value = state.settings.nodeHeight || 40;
                    
                    // Edge appearance
                    edgeColorInput.value = state.settings.edgeColor;
                    edgeTextColorInput.value = state.settings.edgeTextColor || '#000000';
                    edgeWidthInput.value = state.settings.edgeWidth || 1.5;
                    
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
    const nodeTextColorInput = document.getElementById('node-text-color');
    const nodeStrokeColorInput = document.getElementById('node-stroke-color');
    const nodeStrokeWidthInput = document.getElementById('node-stroke-width');
    const edgeTextColorInput = document.getElementById('edge-text-color');
    const edgeWidthInput = document.getElementById('edge-width');
    const nodeWidthInput = document.getElementById('node-width');
    const nodeHeightInput = document.getElementById('node-height');

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
                <td><input type="text" class="node-id table-input" value="${node.id}" data-index="${index}" title="${node.id}"></td>
                <td><input type="text" class="node-label table-input" value="${node.label}" data-index="${index}" title="${node.label}"></td>
                <td>
                    <select class="node-shape table-input" data-index="${index}" title="${shapeOptions.find(opt => opt.value === node.shape)?.label || 'Rectangle'}">
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
                const newId = this.value.trim();
                
                // Check if ID is unique
                if (state.nodes.some((node, i) => i !== index && node.id === newId)) {
                    alert('Node ID must be unique!');
                    this.value = oldId;
                    return;
                }
                
                // Update node ID
                state.nodes[index].id = newId;
                
                // Update edges that reference this node
                state.edges.forEach(edge => {
                    if (edge.source === oldId) {
                        edge.source = newId;
                    }
                    if (edge.target === oldId) {
                        edge.target = newId;
                    }
                });
                
                // Update title attribute for tooltip
                this.title = newId;
                
                renderEdgeTable(); // Update edge dropdowns
                generateGraph(); // Regenerate graph when node ID changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.node-label').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].label = this.value;
                
                // Update title attribute for tooltip
                this.title = this.value;
                
                generateGraph(); // Regenerate graph when node label changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        // Add event listener for shape dropdown
        document.querySelectorAll('.node-shape').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.nodes[index].shape = this.value;
                
                // Update title attribute for tooltip
                const selectedOption = select.options[select.selectedIndex];
                this.title = selectedOption.textContent;
                
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

        // Add mouseover event listeners for tooltips
        document.querySelectorAll('.node-id').forEach(input => {
            input.addEventListener('mouseover', function() {
                createTooltip(this, this.value, 'ID');
            });
        });

        document.querySelectorAll('.node-label').forEach(input => {
            input.addEventListener('mouseover', function() {
                createTooltip(this, this.value, 'Label');
            });
        });

        document.querySelectorAll('.node-shape').forEach(select => {
            select.addEventListener('mouseover', function() {
                const shapeText = this.options[this.selectedIndex].text;
                createTooltip(this, shapeText, 'Shape');
            });
        });
    }

    function renderEdgeTable() {
        edgeTbody.innerHTML = '';
        state.edges.forEach((edge, index) => {
            const row = document.createElement('tr');
            
            // Create source node dropdown options
            let sourceOptionsHTML = '';
            state.nodes.forEach(node => {
                const selected = edge.source === node.id ? 'selected' : '';
                sourceOptionsHTML += `<option value="${node.id}" ${selected}>${node.id}</option>`;
            });
            
            // Create target node dropdown options
            let targetOptionsHTML = '';
            state.nodes.forEach(node => {
                const selected = edge.target === node.id ? 'selected' : '';
                targetOptionsHTML += `<option value="${node.id}" ${selected}>${node.id}</option>`;
            });
            
            // Find source and target node objects for tooltips
            const sourceNode = state.nodes.find(node => node.id === edge.source);
            const targetNode = state.nodes.find(node => node.id === edge.target);
            
            row.innerHTML = `
                <td>
                    <select class="edge-source table-input" data-index="${index}" title="Source: ${sourceNode ? sourceNode.label : edge.source}">
                        ${sourceOptionsHTML}
                    </select>
                </td>
                <td>
                    <select class="edge-target table-input" data-index="${index}" title="Target: ${targetNode ? targetNode.label : edge.target}">
                        ${targetOptionsHTML}
                    </select>
                </td>
                <td><input type="text" class="edge-label table-input" value="${edge.label}" data-index="${index}" title="${edge.label}"></td>
                <td><button class="delete-btn delete-edge" data-index="${index}">Delete</button></td>
            `;
            edgeTbody.appendChild(row);
        });

        // Add event listeners to edge inputs
        document.querySelectorAll('.edge-source').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].source = this.value;
                
                // Update title attribute for tooltip
                const sourceNode = state.nodes.find(node => node.id === this.value);
                this.title = `Source: ${sourceNode ? sourceNode.label : this.value}`;
                
                generateGraph(); // Regenerate graph when edge source changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.edge-target').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].target = this.value;
                
                // Update title attribute for tooltip
                const targetNode = state.nodes.find(node => node.id === this.value);
                this.title = `Target: ${targetNode ? targetNode.label : this.value}`;
                
                generateGraph(); // Regenerate graph when edge target changes
                saveToLocalStorage(); // Save changes to local storage
            });
        });

        document.querySelectorAll('.edge-label').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                state.edges[index].label = this.value;
                
                // Update title attribute for tooltip
                this.title = this.value;
                
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

        // Add mouseover event listeners for tooltips
        document.querySelectorAll('.edge-source').forEach(select => {
            select.addEventListener('mouseover', function() {
                const sourceId = this.value;
                const sourceNode = state.nodes.find(node => node.id === sourceId);
                const tooltipText = `Source: ${sourceNode ? sourceNode.label : sourceId}`;
                createTooltip(this, tooltipText);
            });
        });

        document.querySelectorAll('.edge-target').forEach(select => {
            select.addEventListener('mouseover', function() {
                const targetId = this.value;
                const targetNode = state.nodes.find(node => node.id === targetId);
                const tooltipText = `Target: ${targetNode ? targetNode.label : targetId}`;
                createTooltip(this, tooltipText);
            });
        });

        document.querySelectorAll('.edge-label').forEach(input => {
            input.addEventListener('mouseover', function() {
                createTooltip(this, this.value, 'Label');
            });
        });
    }

    // Add new node with automatic edge creation
    addNodeBtn.addEventListener('click', function() {
        // Generate a unique ID
        let newId = 'Node' + (state.nodes.length + 1);
        while (state.nodes.some(node => node.id === newId)) {
            newId = 'Node' + (parseInt(newId.replace('Node', '')) + 1);
        }
        
        // Create the new node (without width and height)
        state.nodes.push({
            id: newId,
            label: newId,
            shape: 'rect' // Default shape is rectangle
        });
        
        // If there are other nodes, automatically create an edge
        if (state.nodes.length > 1) {
            // Find a suitable source node (most recent node with connections)
            let sourceNode = null;
            
            // First, try to find the most recent node that has connections
            for (let i = state.nodes.length - 2; i >= 0; i--) {
                const nodeId = state.nodes[i].id;
                const hasConnections = state.edges.some(edge => 
                    edge.source === nodeId || edge.target === nodeId
                );
                if (hasConnections) {
                    sourceNode = nodeId;
                    break;
                }
            }
            
            // If no connected node found, use the most recent existing node
            if (!sourceNode) {
                sourceNode = state.nodes[state.nodes.length - 2].id;
            }
            
            // Create an edge from the source node to the new node
            state.edges.push({
                source: sourceNode,
                target: newId,
                label: ''
            });
        }
        
        renderNodeTable();
        renderEdgeTable();
        generateGraph();
        saveToLocalStorage();
    });

    // Add new edge
    addEdgeBtn.addEventListener('click', function() {
        if (state.nodes.length < 2) {
            alert('You need at least 2 nodes to create an edge.');
            return;
        }
        
        // Find the most recent node that has connections (either incoming or outgoing)
        let sourceNode = null;
        for (let i = state.nodes.length - 1; i >= 0; i--) {
            const nodeId = state.nodes[i].id;
            const hasConnections = state.edges.some(edge => 
                edge.source === nodeId || edge.target === nodeId
            );
            if (hasConnections) {
                sourceNode = nodeId;
                break;
            }
        }
        
        // If no connected node found, use the second-to-last node
        if (!sourceNode && state.nodes.length > 1) {
            sourceNode = state.nodes[state.nodes.length - 2].id;
        } else if (!sourceNode) {
            // Fallback to first node if needed
            sourceNode = state.nodes[0].id;
        }
        
        // Find the most recent orphan node (no incoming edges)
        let targetNode = null;
        for (let i = state.nodes.length - 1; i >= 0; i--) {
            const nodeId = state.nodes[i].id;
            const hasIncomingEdges = state.edges.some(edge => edge.target === nodeId);
            if (!hasIncomingEdges && nodeId !== sourceNode) {
                targetNode = nodeId;
                break;
            }
        }
        
        // If no orphan found or it's the same as source, use the most recent node
        // that's not the source
        if (!targetNode || targetNode === sourceNode) {
            for (let i = state.nodes.length - 1; i >= 0; i--) {
                if (state.nodes[i].id !== sourceNode) {
                    targetNode = state.nodes[i].id;
                    break;
                }
            }
        }
        
        state.edges.push({
            source: sourceNode,
            target: targetNode,
            label: ''
        });
        
        renderEdgeTable();
        generateGraph();
        saveToLocalStorage();
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

    nodeTextColorInput.addEventListener('change', function() {
        state.settings.nodeTextColor = this.value;
        generateGraph();
        saveToLocalStorage();
    });

    nodeStrokeColorInput.addEventListener('change', function() {
        state.settings.nodeStrokeColor = this.value;
        generateGraph();
        saveToLocalStorage();
    });

    nodeStrokeWidthInput.addEventListener('change', function() {
        state.settings.nodeStrokeWidth = parseFloat(this.value);
        generateGraph();
        saveToLocalStorage();
    });

    edgeTextColorInput.addEventListener('change', function() {
        state.settings.edgeTextColor = this.value;
        generateGraph();
        saveToLocalStorage();
    });

    edgeWidthInput.addEventListener('change', function() {
        state.settings.edgeWidth = parseFloat(this.value);
        generateGraph();
        saveToLocalStorage();
    });

    // Add event listeners for node size settings
    nodeWidthInput.addEventListener('change', function() {
        state.settings.nodeWidth = parseInt(this.value);
        generateGraph();
        saveToLocalStorage();
    });

    nodeHeightInput.addEventListener('change', function() {
        state.settings.nodeHeight = parseInt(this.value);
        generateGraph();
        saveToLocalStorage();
    });

    // Generate graph
    function generateGraph() {
        try {
            // Create a new directed graph
            const g = new dagre.graphlib.Graph().setGraph({
                rankdir: state.settings.rankdir,
                nodesep: state.settings.nodesep,
                ranksep: state.settings.ranksep,
                marginx: 20,
                marginy: 20
            }).setDefaultEdgeLabel(function() { return {}; });
            
            // Ensure node dimensions are valid (minimum values)
            const nodeWidth = Math.max(30, state.settings.nodeWidth || 100);
            const nodeHeight = Math.max(20, state.settings.nodeHeight || 40);
            
            // Add nodes to the graph with validated dimensions
            state.nodes.forEach(node => {
                g.setNode(node.id, {
                    label: node.label,
                    width: nodeWidth,
                    height: nodeHeight,
                    shape: node.shape
                });
            });

// Add edges to the graph
            state.edges.forEach(edge => {
                g.setEdge(edge.source, edge.target, {
                    label: edge.label
                });
            });
            
            // Run the layout algorithm with error handling
            try {
                dagre.layout(g);
                // Render the graph
                renderSvgGraph(g);
            } catch (layoutError) {
                console.error("Layout error:", layoutError);
                // Try with simpler settings if layout fails
                g.setGraph({
                    rankdir: 'TB',
                    nodesep: 50,
                    ranksep: 50,
                    marginx: 20,
                    marginy: 20
                });
                
                // Try layout again with simpler settings
                try {
dagre.layout(g);
                    renderSvgGraph(g);
                } catch (fallbackError) {
                    console.error("Fallback layout also failed:", fallbackError);
                    // Show error message to user
                    alert("Unable to generate graph layout. Please check your graph structure.");
                }
            }
        } catch (error) {
            console.error("Graph generation error:", error);
            alert("Error generating graph: " + error.message);
        }
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
        
        // Add the appropriate shape based on node.shape with updated styling
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
                        .attr('stroke', state.settings.nodeStrokeColor)
                        .attr('stroke-width', state.settings.nodeStrokeWidth);
                    break;
                
                case 'diamond':
                    node.append('path')
                        .attr('d', diamondPath(d.width, d.height))
                        .attr('fill', state.settings.nodeColor)
                        .attr('stroke', state.settings.nodeStrokeColor)
                        .attr('stroke-width', state.settings.nodeStrokeWidth);
                    break;
                
                case 'rect':
                default:
                    node.append('rect')
                        .attr('width', d.width)
                        .attr('height', d.height)
                        .attr('rx', 5)
                        .attr('ry', 5)
                        .attr('fill', state.settings.nodeColor)
                        .attr('stroke', state.settings.nodeStrokeColor)
                        .attr('stroke-width', state.settings.nodeStrokeWidth);
                    break;
            }
        });
        
        // Add text labels to nodes with node text color
nodes.append('text')
            .attr('x', d => d.width / 2)
            .attr('y', d => d.height / 2)
    .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', state.settings.nodeTextColor)
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
            .attr('stroke-width', state.settings.edgeWidth)
            .attr('marker-end', 'url(#arrowhead)')
            .attr('fill', 'none');
        
        // Add edge labels with edge text color
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
            .attr('dy', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', state.settings.edgeTextColor)
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
            .node rect, .node ellipse, .node path {
                stroke: ${state.settings.nodeStrokeColor};
                stroke-width: ${state.settings.nodeStrokeWidth}px;
            }
            .node text {
                font-size: 14px;
                fill: ${state.settings.nodeTextColor};
            }
            .edge path {
                stroke-width: ${state.settings.edgeWidth}px;
                fill: none;
            }
            .edge-label {
                font-size: 12px;
                text-anchor: middle;
                fill: ${state.settings.edgeTextColor};
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
                nodeTextColorInput.value = state.settings.nodeTextColor || '#000000';
                nodeStrokeColorInput.value = state.settings.nodeStrokeColor || '#333333';
                nodeStrokeWidthInput.value = state.settings.nodeStrokeWidth || 1.5;
                edgeTextColorInput.value = state.settings.edgeTextColor || '#000000';
                edgeWidthInput.value = state.settings.edgeWidth || 1.5;
                
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

// Add a function to create and show tooltips
function createTooltip(element, text, header = null) {
    // Don't show tooltip for empty values
    if (!text || text.trim() === '') {
        text = '(empty)';
    }
    
    // Add header if provided
    if (header) {
        text = `${header}: ${text}`;
    }
    
    // Remove any existing tooltip
    const existingTooltip = document.querySelector('.custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    // Position the tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';
    
    // Add event listener to remove tooltip
    element.addEventListener('mouseleave', function() {
        tooltip.remove();
    });
}