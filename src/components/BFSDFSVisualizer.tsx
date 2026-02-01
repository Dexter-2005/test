import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Play, Pause, RotateCcw, Shuffle } from 'lucide-react';

interface GraphNode {
    id: number;
    label: string;
    x: number;
    y: number;
}

interface GraphEdge {
    from: number;
    to: number;
}

const BFSDFSVisualizer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Default graph data
    const defaultNodes: GraphNode[] = [
        { id: 0, label: 'A', x: 50, y: 10 },
        { id: 1, label: 'B', x: 20, y: 30 },
        { id: 2, label: 'C', x: 80, y: 30 },
        { id: 3, label: 'D', x: 20, y: 60 },
        { id: 4, label: 'E', x: 50, y: 50 },
        { id: 5, label: 'F', x: 80, y: 60 },
        { id: 6, label: 'G', x: 50, y: 80 },
    ];

    const defaultEdges: GraphEdge[] = [
        { from: 0, to: 1 }, { from: 0, to: 2 },
        { from: 1, to: 3 }, { from: 1, to: 4 },
        { from: 2, to: 5 },
        { from: 4, to: 5 }, { from: 4, to: 6 },
        { from: 3, to: 6 },
    ];

    const [nodes, setNodes] = useState<GraphNode[]>(defaultNodes);
    const [edges, setEdges] = useState<GraphEdge[]>(defaultEdges);
    const [activeNode, setActiveNode] = useState<number | null>(null);
    const [visited, setVisited] = useState<number[]>([]);
    const [queueStack, setQueueStack] = useState<number[]>([]);
    const [algorithm, setAlgorithm] = useState<'BFS' | 'DFS' | null>(null);
    const [message, setMessage] = useState('Select BFS or DFS to start.');
    const [isPlaying, setIsPlaying] = useState(false);

    const stepsRef = useRef<{ active: number | null, visited: number[], struct: number[], msg: string }[]>([]);
    const stepIndexRef = useRef(0);
    const timerRef = useRef<number | null>(null);

    const getAdjList = () => {
        const adj: Record<number, number[]> = {};
        nodes.forEach(n => adj[n.id] = []);
        edges.forEach(e => {
            adj[e.from].push(e.to);
            adj[e.to].push(e.from);
        });
        Object.keys(adj).forEach(k => {
            adj[parseInt(k)].sort();
        });
        return adj;
    };

    const generateStepsBFS = (startId: number) => {
        const steps: { active: number | null, visited: number[], struct: number[], msg: string }[] = [];
        const adj = getAdjList();

        const q = [startId];
        const visitedSet = new Set([startId]);
        const visitedList = [startId];

        const getLabel = (id: number) => nodes.find(n => n.id === id)?.label || id.toString();

        steps.push({ active: null, visited: [...visitedList], struct: [...q], msg: `Start BFS from Node ${getLabel(startId)}` });

        while (q.length > 0) {
            const curr = q.shift()!;
            steps.push({ active: curr, visited: [...visitedList], struct: [...q], msg: `Dequeued ${getLabel(curr)}. Processing neighbors...` });

            const neighbors = adj[curr] || [];
            for (const neighbor of neighbors) {
                if (!visitedSet.has(neighbor)) {
                    visitedSet.add(neighbor);
                    visitedList.push(neighbor);
                    q.push(neighbor);
                    steps.push({ active: curr, visited: [...visitedList], struct: [...q], msg: `Visited neighbor ${getLabel(neighbor)}, Enqueued.` });
                }
            }
        }
        steps.push({ active: null, visited: [...visitedList], struct: [], msg: 'BFS Traversal Complete!' });
        return steps;
    };

    const generateStepsDFS = (startId: number) => {
        const steps: { active: number | null, visited: number[], struct: number[], msg: string }[] = [];
        const adj = getAdjList();

        const stack = [startId];
        const visitedSet = new Set<number>();
        const visitedList: number[] = [];

        const getLabel = (id: number) => nodes.find(n => n.id === id)?.label || id.toString();

        steps.push({ active: null, visited: [], struct: [...stack], msg: `Start DFS. Push ${getLabel(startId)} to Stack.` });

        while (stack.length > 0) {
            const curr = stack.pop()!;

            if (!visitedSet.has(curr)) {
                visitedSet.add(curr);
                visitedList.push(curr);
                steps.push({ active: curr, visited: [...visitedList], struct: [...stack], msg: `Popped ${getLabel(curr)}. Mark as visited.` });

                const neighbors = adj[curr] || [];
                for (let i = neighbors.length - 1; i >= 0; i--) {
                    const neighbor = neighbors[i];
                    if (!visitedSet.has(neighbor)) {
                        stack.push(neighbor);
                        steps.push({ active: curr, visited: [...visitedList], struct: [...stack], msg: `Push neighbor ${getLabel(neighbor)} to stack.` });
                    }
                }
            } else {
                steps.push({ active: curr, visited: [...visitedList], struct: [...stack], msg: `${getLabel(curr)} already visited. Skip.` });
            }
        }
        steps.push({ active: null, visited: [...visitedList], struct: [], msg: 'DFS Traversal Complete!' });
        return steps;
    };

    const startAlgo = (type: 'BFS' | 'DFS') => {
        reset();
        setAlgorithm(type);
        stepsRef.current = type === 'BFS' ? generateStepsBFS(0) : generateStepsDFS(0);
        stepIndexRef.current = 0;
        setIsPlaying(true);
    };

    const reset = () => {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setActiveNode(null);
        setVisited([]);
        setQueueStack([]);
        setAlgorithm(null);
        setMessage('Select BFS or DFS to start.');
    };

    const handleRandomGraph = () => {
        reset();
        const nodeCount = Math.floor(Math.random() * 4) + 5; // 5-8 nodes
        const labels = 'ABCDEFGHIJKLMNOP'.split('');

        const newNodes: GraphNode[] = [];
        for (let i = 0; i < nodeCount; i++) {
            newNodes.push({
                id: i,
                label: labels[i],
                x: 15 + Math.random() * 70,
                y: 15 + Math.random() * 70,
            });
        }

        // Create a connected graph (spanning tree + random edges)
        const newEdges: GraphEdge[] = [];

        // First, create a spanning tree to ensure connectivity
        for (let i = 1; i < nodeCount; i++) {
            const parent = Math.floor(Math.random() * i);
            newEdges.push({ from: parent, to: i });
        }

        // Add some random extra edges
        const extraEdges = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < extraEdges; i++) {
            const from = Math.floor(Math.random() * nodeCount);
            const to = Math.floor(Math.random() * nodeCount);
            if (from !== to && !newEdges.some(e =>
                (e.from === from && e.to === to) || (e.from === to && e.to === from)
            )) {
                newEdges.push({ from, to });
            }
        }

        setNodes(newNodes);
        setEdges(newEdges);
        setMessage('Random graph generated! Select BFS or DFS to start.');
    };

    const nextStep = () => {
        if (stepIndexRef.current >= stepsRef.current.length) {
            setIsPlaying(false);
            return;
        }
        const step = stepsRef.current[stepIndexRef.current];
        setActiveNode(step.active);
        setVisited(step.visited);
        setQueueStack(step.struct);
        setMessage(step.msg);
        stepIndexRef.current++;
    };

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = window.setInterval(() => {
                nextStep();
            }, 1200);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying]);

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            <div className="flex items-center gap-4 mb-8">
                <Link to="/" className={`hover:text-violet-400 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-400">
                    BFS / DFS Traversals
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h2 className="text-2xl font-bold mb-6">Controls</h2>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleRandomGraph}
                            disabled={isPlaying}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:scale-105 transition-all disabled:opacity-50"
                        >
                            <Shuffle size={18} /> Random Graph
                        </button>
                        <button onClick={() => startAlgo('BFS')} disabled={isPlaying} className="btn-secondary py-3 rounded-xl bg-violet-500/20 text-violet-500 hover:bg-violet-500/30 transition-all font-semibold disabled:opacity-50">
                            Start BFS (Queue)
                        </button>
                        <button onClick={() => startAlgo('DFS')} disabled={isPlaying} className="btn-secondary py-3 rounded-xl bg-fuchsia-500/20 text-fuchsia-500 hover:bg-fuchsia-500/30 transition-all font-semibold disabled:opacity-50">
                            Start DFS (Stack)
                        </button>
                    </div>

                    <div className="flex gap-2 mt-6">
                        <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${isPlaying ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                            {isPlaying ? <Pause /> : <Play />} {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button onClick={reset} className="p-3 rounded-xl bg-gray-500/20 hover:bg-gray-500/30">
                            <RotateCcw />
                        </button>
                    </div>

                    {/* Queue/Stack Vis */}
                    <div className="mt-8">
                        <h3 className="text-xl font-bold mb-2">{algorithm === 'BFS' ? 'Queue (Front → Rear)' : algorithm === 'DFS' ? 'Stack (Top ↓)' : 'Data Structure'}</h3>
                        <div className={`min-h-[60px] p-4 rounded-xl flex items-center gap-2 flex-wrap ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                            {queueStack.map((id, i) => (
                                <div key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${isDark ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-gray-300'}`}>
                                    {nodes.find(n => n.id === id)?.label || id}
                                </div>
                            ))}
                            {queueStack.length === 0 && <span className="opacity-50 text-sm">Empty</span>}
                        </div>
                    </div>
                </div>

                {/* Visualization */}
                <div className={`lg:col-span-2 h-[600px] rounded-2xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="absolute top-4 left-0 right-0 text-center z-10">
                        <span className={`inline-block px-4 py-2 rounded-full font-medium shadow-lg animate-fade-in ${isDark ? 'bg-slate-800 text-violet-300' : 'bg-white text-violet-600'}`}>
                            {message}
                        </span>
                    </div>

                    <svg width="100%" height="100%">
                        {edges.map((e, i) => {
                            const start = nodes.find(n => n.id === e.from);
                            const end = nodes.find(n => n.id === e.to);
                            if (!start || !end) return null;
                            return (
                                <line key={i} x1={`${start.x}%`} y1={`${start.y}%`} x2={`${end.x}%`} y2={`${end.y}%`} stroke={isDark ? 'white' : 'black'} strokeOpacity={0.2} strokeWidth="2" />
                            );
                        })}

                        {nodes.map((n) => {
                            const isActive = activeNode === n.id;
                            const isVisited = visited.includes(n.id);
                            return (
                                <g key={n.id}>
                                    <circle
                                        cx={`${n.x}%`} cy={`${n.y}%`} r="20"
                                        className={`transition-all duration-500 ${isActive ? 'fill-yellow-500 stroke-yellow-300 animate-pulse' :
                                            isVisited ? 'fill-violet-500 stroke-violet-300' :
                                                isDark ? 'fill-slate-800 stroke-slate-500' : 'fill-white stroke-gray-400'
                                            }`}
                                        strokeWidth={isActive ? 4 : 2}
                                    />
                                    <text x={`${n.x}%`} y={`${n.y}%`} dy=".3em" textAnchor="middle" className={`font-bold text-lg pointer-events-none ${isDark || isVisited || isActive ? 'fill-white' : 'fill-black'}`}>
                                        {n.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default BFSDFSVisualizer;
