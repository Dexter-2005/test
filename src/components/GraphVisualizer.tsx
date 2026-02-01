import { useState, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Plus, Trash2, ArrowRight, Move, RefreshCw, Shuffle } from 'lucide-react';

interface GraphNode {
    id: number;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
}

interface GraphEdge {
    from: number;
    to: number;
    id: string;
}

const GraphVisualizer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [isDirected, setIsDirected] = useState(false);
    const [mode, setMode] = useState<'add-node' | 'add-edge' | 'move' | 'delete'>('add-node');
    const [selectedNode, setSelectedNode] = useState<number | null>(null); // For edge creation
    const [draggedNode, setDraggedNode] = useState<number | null>(null);
    const [message, setMessage] = useState('Select a mode to interact with the graph.');

    const containerRef = useRef<HTMLDivElement>(null);
    const idCounter = useRef(0);

    const getRelativeCoords = (e: MouseEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        return { x, y };
    };

    const handleContainerClick = (e: MouseEvent) => {
        if (mode === 'add-node') {
            const { x, y } = getRelativeCoords(e);
            const newNode: GraphNode = {
                id: idCounter.current++,
                x,
                y
            };
            setNodes([...nodes, newNode]);
            setMessage(`Added Node ${newNode.id}`);
        } else if (mode === 'add-edge') {
            // Click on background cancels selection
            setSelectedNode(null);
            setMessage('Selection cleared.');
        }
    };

    const handleNodeClick = (e: MouseEvent, id: number) => {
        e.stopPropagation();

        if (mode === 'delete') {
            setNodes(nodes.filter(n => n.id !== id));
            setEdges(edges.filter(edge => edge.from !== id && edge.to !== id));
            setMessage(`Deleted Node ${id}`);
            return;
        }

        if (mode === 'add-edge') {
            if (selectedNode === null) {
                setSelectedNode(id);
                setMessage(`Selected Node ${id}. Click target node.`);
            } else if (selectedNode === id) {
                setSelectedNode(null); // Deselect
                setMessage('Deselected node.');
            } else {
                // Check if edge exists
                const exists = edges.some(edge =>
                    (edge.from === selectedNode && edge.to === id) ||
                    (!isDirected && edge.from === id && edge.to === selectedNode)
                );

                if (exists) {
                    setMessage('Edge already exists.');
                } else {
                    const newEdge: GraphEdge = {
                        from: selectedNode,
                        to: id,
                        id: `${selectedNode}-${id}`
                    };
                    setEdges([...edges, newEdge]);
                    setMessage(`Added Edge: ${selectedNode} → ${id}`);
                }
                setSelectedNode(null);
            }
        }
    };

    const handleMouseDown = (e: MouseEvent, id: number) => {
        if (mode === 'move') {
            e.stopPropagation();
            setDraggedNode(id);
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (draggedNode !== null && mode === 'move') {
            const { x, y } = getRelativeCoords(e);
            setNodes(prev => prev.map(n =>
                n.id === draggedNode ? { ...n, x, y } : n
            ));
        }
    };

    const handleMouseUp = () => {
        setDraggedNode(null);
    };

    const handleReset = () => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        idCounter.current = 0;
        setMessage('Graph reset.');
    };

    return (
        <div
            className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}
            onMouseUp={handleMouseUp} // Global mouse up for drag end
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/" className={`hover:text-orange-400 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                        Graph Visualizer
                    </h1>
                </div>
                <Link to="/graph/problems" className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-semibold transition-all">
                    Visualize BFS/DFS →
                </Link>
            </div>

            {/* Controls */}
            <div className={`mb-6 p-4 rounded-2xl border flex flex-wrap gap-4 items-center justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setMode('add-node')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold ${mode === 'add-node' ? 'bg-orange-500 text-white' : 'bg-gray-500/10 hover:bg-gray-500/20'}`}
                    >
                        <Plus size={18} /> Add Node
                    </button>
                    <button
                        onClick={() => setMode('add-edge')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold ${mode === 'add-edge' ? 'bg-orange-500 text-white' : 'bg-gray-500/10 hover:bg-gray-500/20'}`}
                    >
                        <ArrowRight size={18} /> Add Edge
                    </button>
                    <button
                        onClick={() => setMode('move')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold ${mode === 'move' ? 'bg-blue-500 text-white' : 'bg-gray-500/10 hover:bg-gray-500/20'}`}
                    >
                        <Move size={18} /> Move
                    </button>
                    <button
                        onClick={() => setMode('delete')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold ${mode === 'delete' ? 'bg-red-500 text-white' : 'bg-gray-500/10 hover:bg-gray-500/20'}`}
                    >
                        <Trash2 size={18} /> Delete
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isDirected}
                            onChange={(e) => setIsDirected(e.target.checked)}
                            className="w-5 h-5 accent-orange-500"
                        />
                        <span className="font-medium">Directed</span>
                    </label>
                    <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 transition-all font-semibold">
                        <RefreshCw size={18} /> Reset
                    </button>
                    <button
                        onClick={() => {
                            handleReset();
                            const nodeCount = Math.floor(Math.random() * 3) + 5;
                            const newNodes: GraphNode[] = [];
                            for (let i = 0; i < nodeCount; i++) {
                                newNodes.push({
                                    id: idCounter.current++,
                                    x: 15 + Math.random() * 70,
                                    y: 15 + Math.random() * 70,
                                });
                            }
                            const newEdges: GraphEdge[] = [];
                            for (let i = 1; i < nodeCount; i++) {
                                const parent = Math.floor(Math.random() * i);
                                newEdges.push({ from: newNodes[parent].id, to: newNodes[i].id, id: `${newNodes[parent].id}-${newNodes[i].id}` });
                            }
                            const extraEdges = Math.floor(Math.random() * 2) + 1;
                            for (let i = 0; i < extraEdges; i++) {
                                const from = Math.floor(Math.random() * nodeCount);
                                const to = Math.floor(Math.random() * nodeCount);
                                if (from !== to && !newEdges.some(e =>
                                    (e.from === newNodes[from].id && e.to === newNodes[to].id) ||
                                    (e.from === newNodes[to].id && e.to === newNodes[from].id)
                                )) {
                                    newEdges.push({ from: newNodes[from].id, to: newNodes[to].id, id: `${newNodes[from].id}-${newNodes[to].id}` });
                                }
                            }
                            setNodes(newNodes);
                            setEdges(newEdges);
                            setMessage(`Random graph generated with ${nodeCount} nodes.`);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 transition-all font-semibold"
                    >
                        <Shuffle size={18} /> Random
                    </button>
                </div>
            </div>

            <div className={`text-center mb-4 min-h-[1.5em] font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {message}
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                onClick={handleContainerClick}
                onMouseMove={handleMouseMove}
                className={`h-[600px] w-full rounded-2xl border relative overflow-hidden cursor-crosshair
                    ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}
                    ${mode === 'move' ? 'cursor-move' : ''}
                `}
            >
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <span className="text-2xl font-bold">Click to add nodes</span>
                    </div>
                )}

                <svg width="100%" height="100%" className="pointer-events-none">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill={isDark ? '#aaa' : '#555'} />
                        </marker>
                    </defs>
                    {edges.map(edge => {
                        const start = nodes.find(n => n.id === edge.from);
                        const end = nodes.find(n => n.id === edge.to);
                        if (!start || !end) return null;
                        return (
                            <line
                                key={edge.id}
                                x1={`${start.x}%`} y1={`${start.y}%`}
                                x2={`${end.x}%`} y2={`${end.y}%`}
                                stroke={isDark ? 'white' : 'black'}
                                strokeOpacity={0.4}
                                strokeWidth="2"
                                markerEnd={isDirected ? 'url(#arrowhead)' : undefined}
                            />
                        );
                    })}
                </svg>

                {nodes.map(node => (
                    <div
                        key={node.id}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        onClick={(e) => handleNodeClick(e, node.id)}
                        className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center font-bold text-lg border-2 shadow-lg transition-colors cursor-pointer select-none
                            ${selectedNode === node.id
                                ? 'bg-orange-500 border-orange-300 text-white scale-110 z-10'
                                : isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-400 text-black'
                            }
                            ${mode === 'delete' ? 'hover:bg-red-500 hover:border-red-500 hover:text-white' : ''}
                        `}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                        {node.id}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GraphVisualizer;
