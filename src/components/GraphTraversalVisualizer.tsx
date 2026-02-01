import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';

interface PredefinedNode {
    id: number;
    label: string;
    x: number;
    y: number;
}

interface PredefinedEdge {
    from: number;
    to: number;
}

const GraphTraversalVisualizer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Graph Data (A simple interesting graph)
    const nodes: PredefinedNode[] = [
        { id: 0, label: 'A', x: 50, y: 10 },
        { id: 1, label: 'B', x: 20, y: 30 },
        { id: 2, label: 'C', x: 80, y: 30 },
        { id: 3, label: 'D', x: 20, y: 60 },
        { id: 4, label: 'E', x: 50, y: 50 },
        { id: 5, label: 'F', x: 80, y: 60 },
        { id: 6, label: 'G', x: 50, y: 80 },
    ];

    const edges: PredefinedEdge[] = [
        { from: 0, to: 1 }, { from: 0, to: 2 }, // A->B, A->C
        { from: 1, to: 3 }, { from: 1, to: 4 }, // B->D, B->E
        { from: 2, to: 5 }, // C->F
        { from: 4, to: 5 }, { from: 4, to: 6 }, // E->F, E->G
        { from: 3, to: 6 }, // D->G
    ];

    // Adjacency List for Algorithms (Undirected for this demo usually simpler, or directed)
    // Let's assume Undirected for broader traversal fun
    const getAdjList = () => {
        const adj: Record<number, number[]> = {};
        nodes.forEach(n => adj[n.id] = []);
        edges.forEach(e => {
            adj[e.from].push(e.to);
            adj[e.to].push(e.from);
        });
        // Sort for deterministic order (e.g. alphabetical)
        Object.keys(adj).forEach(k => {
            adj[parseInt(k)].sort();
        });
        return adj;
    };

    const [activeNode, setActiveNode] = useState<number | null>(null);
    const [visited, setVisited] = useState<number[]>([]);
    const [queueStack, setQueueStack] = useState<number[]>([]); // Acts as Queue or Stack
    const [algorithm, setAlgorithm] = useState<'BFS' | 'DFS' | null>(null);
    const [message, setMessage] = useState('Select BFS or DFS to start.');
    const [isPlaying, setIsPlaying] = useState(false);

    // Animation State
    const stepsRef = useRef<{ active: number | null, visited: number[], struct: number[], msg: string }[]>([]);
    const stepIndexRef = useRef(0);
    const timerRef = useRef<number | null>(null);

    const generateStepsBFS = (startId: number) => {
        const steps: { active: number | null, visited: number[], struct: number[], msg: string }[] = [];
        const adj = getAdjList();

        const q = [startId];
        const visitedSet = new Set([startId]);
        const visitedList = [startId];

        steps.push({ active: null, visited: [...visitedList], struct: [...q], msg: `Start BFS from Node ${nodes[startId].label}` });

        while (q.length > 0) {
            // Peek for visualization? No, standard is Dequeue
            const curr = q.shift()!;

            steps.push({ active: curr, visited: [...visitedList], struct: [...q], msg: `Dequeued ${nodes[curr].label}. Processing neighbors...` });

            const neighbors = adj[curr] || [];
            for (const neighbor of neighbors) {
                if (!visitedSet.has(neighbor)) {
                    visitedSet.add(neighbor);
                    visitedList.push(neighbor);
                    q.push(neighbor);
                    steps.push({ active: curr, visited: [...visitedList], struct: [...q], msg: `Visited neighbor ${nodes[neighbor].label}, Enqueued.` });
                }
            }
        }
        steps.push({ active: null, visited: [...visitedList], struct: [], msg: 'Traversal Complete!' });
        return steps;
    };

    const generateStepsDFS = (startId: number) => {
        const steps: { active: number | null, visited: number[], struct: number[], msg: string }[] = [];
        const adj = getAdjList();

        const stack = [startId];
        const visitedSet = new Set<number>();
        const visitedList: number[] = [];

        steps.push({ active: null, visited: [], struct: [...stack], msg: `Start DFS. Push Start Node ${nodes[startId].label} to Stack.` });

        while (stack.length > 0) {
            const curr = stack.pop()!;

            if (!visitedSet.has(curr)) {
                visitedSet.add(curr);
                visitedList.push(curr);
                steps.push({ active: curr, visited: [...visitedList], struct: [...stack], msg: `Popped ${nodes[curr].label}. Mark as visited.` });

                // Add neighbors to stack (reverse order to visit in natural order if pushed)
                const neighbors = adj[curr] || [];
                // Reverse iterate to push to stack
                for (let i = neighbors.length - 1; i >= 0; i--) {
                    const neighbor = neighbors[i];
                    if (!visitedSet.has(neighbor)) {
                        stack.push(neighbor);
                        steps.push({ active: curr, visited: [...visitedList], struct: [...stack], msg: `Push neighbor ${nodes[neighbor].label} to stack.` });
                    }
                }
            } else {
                steps.push({ active: curr, visited: [...visitedList], struct: [...stack], msg: `${nodes[curr].label} already visited. Skip.` });
            }
        }
        steps.push({ active: null, visited: [...visitedList], struct: [], msg: 'Traversal Complete!' });
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
                <Link to="/graph" className={`hover:text-orange-400 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                    Graph Traversals
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h2 className="text-2xl font-bold mb-6">Controls</h2>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => startAlgo('BFS')} disabled={isPlaying} className="btn-secondary py-3 rounded-xl bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-all font-semibold disabled:opacity-50">
                            Start BFS (Queue)
                        </button>
                        <button onClick={() => startAlgo('DFS')} disabled={isPlaying} className="btn-secondary py-3 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all font-semibold disabled:opacity-50">
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
                                    {nodes[id].label}
                                </div>
                            ))}
                            {queueStack.length === 0 && <span className="opacity-50 text-sm">Empty</span>}
                        </div>
                    </div>
                </div>

                {/* Visualization */}
                <div className={`lg:col-span-2 h-[600px] rounded-2xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="absolute top-4 left-0 right-0 text-center z-10">
                        <span className={`inline-block px-4 py-2 rounded-full font-medium shadow-lg animate-fade-in ${isDark ? 'bg-slate-800 text-orange-300' : 'bg-white text-orange-600'}`}>
                            {message}
                        </span>
                    </div>

                    <svg width="100%" height="100%">
                        {edges.map((e, i) => {
                            const start = nodes[e.from];
                            const end = nodes[e.to];
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
                                            isVisited ? 'fill-orange-500 stroke-orange-300' :
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

export default GraphTraversalVisualizer;
