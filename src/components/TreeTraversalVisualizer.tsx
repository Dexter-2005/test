import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Play, RotateCcw, SkipForward, Pause } from 'lucide-react';

interface TreeNode {
    id: number;
    value: number;
    left?: TreeNode;
    right?: TreeNode;
    x: number;
    y: number;
}

const TreeTraversalVisualizer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark'; // Assumes ThemeContext has a simple 'theme' string

    const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
    const [visitedNodes, setVisitedNodes] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [message, setMessage] = useState('Select a traversal to start.');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const stepsRef = useRef<{ nodeId: number | null, msg: string, visited?: number }[]>([]);
    const timerRef = useRef<number | null>(null);

    // Predefined Tree Structure
    const treeData: TreeNode = {
        id: 1, value: 10, x: 50, y: 10,
        left: {
            id: 2, value: 5, x: 25, y: 30,
            left: { id: 3, value: 3, x: 12.5, y: 50 },
            right: { id: 4, value: 7, x: 37.5, y: 50 }
        },
        right: {
            id: 5, value: 15, x: 75, y: 30,
            right: { id: 6, value: 18, x: 87.5, y: 50 }
        }
    };

    const generateSteps = (type: 'inorder' | 'preorder' | 'postorder') => {
        const steps: { nodeId: number | null, msg: string, visited?: number }[] = [];

        const traverse = (node: TreeNode | undefined) => {
            if (!node) return;

            if (type === 'preorder') {
                steps.push({ nodeId: node.id, msg: `Visit Node ${node.value}`, visited: node.value });
                traverse(node.left);
                traverse(node.right);
            } else if (type === 'inorder') {
                if (node.left) {
                    steps.push({ nodeId: node.id, msg: `Go Left from ${node.value}` });
                    traverse(node.left);
                }
                steps.push({ nodeId: node.id, msg: `Visit Node ${node.value}`, visited: node.value });
                if (node.right) {
                    steps.push({ nodeId: node.id, msg: `Go Right from ${node.value}` });
                    traverse(node.right);
                }
            } else if (type === 'postorder') {
                if (node.left) {
                    steps.push({ nodeId: node.id, msg: `Go Left from ${node.value}` });
                    traverse(node.left);
                }
                if (node.right) {
                    steps.push({ nodeId: node.id, msg: `Go Right from ${node.value}` });
                    traverse(node.right);
                }
                steps.push({ nodeId: node.id, msg: `Visit Node ${node.value}`, visited: node.value });
            }
        };

        traverse(treeData);
        steps.push({ nodeId: null, msg: 'Traversal Complete!' });
        return steps;
    };

    const startTraversal = (type: 'inorder' | 'preorder' | 'postorder') => {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);

        setVisitedNodes([]);
        setActiveNodeId(null);
        setCurrentStepIndex(0);

        stepsRef.current = generateSteps(type);
        setMessage(`Starting ${type} traversal...`);
        setIsPlaying(true);
    };

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = window.setInterval(() => {
                setCurrentStepIndex(prev => {
                    if (prev >= stepsRef.current.length - 1) {
                        setIsPlaying(false);
                        if (timerRef.current) clearInterval(timerRef.current);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying]);

    useEffect(() => {
        if (stepsRef.current.length > 0 && currentStepIndex < stepsRef.current.length) {
            const step = stepsRef.current[currentStepIndex];
            setActiveNodeId(step.nodeId);
            setMessage(step.msg);
            if (step.visited !== undefined) {
                setVisitedNodes(prev => {
                    if (!prev.includes(step.visited!)) return [...prev, step.visited!];
                    return prev;
                });
            }
        }
    }, [currentStepIndex]);

    const handleReset = () => {
        setIsPlaying(false);
        setActiveNodeId(null);
        setVisitedNodes([]);
        setMessage('Reset complete.');
        setCurrentStepIndex(0);
        stepsRef.current = [];
    };

    const handleStepForward = () => {
        if (currentStepIndex < stepsRef.current.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    // Render Helper
    const renderNode = (node: TreeNode | undefined) => {
        if (!node) return null;
        const isActive = node.id === activeNodeId;
        const isVisited = visitedNodes.includes(node.value);

        return (
            <g key={node.id}>
                {node.left && (
                    <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${node.left.x}%`} y2={`${node.left.y}%`} stroke={isDark ? 'white' : 'black'} strokeOpacity={0.2} strokeWidth="2" />
                )}
                {node.right && (
                    <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${node.right.x}%`} y2={`${node.right.y}%`} stroke={isDark ? 'white' : 'black'} strokeOpacity={0.2} strokeWidth="2" />
                )}

                {renderNode(node.left)}
                {renderNode(node.right)}

                <foreignObject x={`${node.x - 4}%`} y={`${node.y - 4}%`} width="8%" height="8%">
                    <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-500
                        ${isActive
                            ? 'bg-yellow-400 border-yellow-600 text-black scale-125 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                            : isVisited
                                ? 'bg-emerald-500 border-emerald-600 text-white'
                                : isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                        }
                    `}>
                        {node.value}
                    </div>
                </foreignObject>
            </g>
        );
    };

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            <div className="flex items-center gap-4 mb-8">
                <Link to="/tree" className={`hover:text-sky-400 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    Tree Algorithms
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Area */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} lg:col-span-1`}>
                    <h2 className="text-2xl font-bold mb-6">Controls</h2>

                    <div className="space-y-4">
                        <button onClick={() => startTraversal('inorder')} className="w-full btn-secondary py-3 rounded-xl bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-all font-semibold">
                            Inorder (Left, Root, Right)
                        </button>
                        <button onClick={() => startTraversal('preorder')} className="w-full btn-secondary py-3 rounded-xl bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all font-semibold">
                            Preorder (Root, Left, Right)
                        </button>
                        <button onClick={() => startTraversal('postorder')} className="w-full btn-secondary py-3 rounded-xl bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 transition-all font-semibold">
                            Postorder (Left, Right, Root)
                        </button>

                        <div className="flex gap-2 pt-4">
                            <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${isPlaying ? 'bg-yellow-500/20 text-yellow-500' : 'bg-sky-500 text-white hover:bg-sky-600'}`}>
                                {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Auto Play</>}
                            </button>
                            <button onClick={handleStepForward} className="p-3 rounded-xl bg-gray-500/20 hover:bg-gray-500/30 transition-all">
                                <SkipForward size={20} />
                            </button>
                            <button onClick={handleReset} className="p-3 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all">
                                <RotateCcw size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-2">Traversal Output:</h3>
                        <div className={`p-4 rounded-xl min-h-[60px] flex flex-wrap gap-2 ${isDark ? 'bg-black/30' : 'bg-gray-100'}`}>
                            {visitedNodes.map((val, idx) => (
                                <span key={idx} className="animate-fade-in text-lg font-mono font-bold text-emerald-500">
                                    {val}{idx < visitedNodes.length - 1 ? ' →' : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Visualization Area */}
                <div className={`lg:col-span-2 h-[600px] rounded-2xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="absolute top-4 left-4 right-4 text-center z-10">
                        <span className={`inline-block px-4 py-2 rounded-full text-lg font-medium shadow-lg animate-pulse ${isDark ? 'bg-slate-800 text-sky-300' : 'bg-white text-sky-600'}`}>
                            {message}
                        </span>
                    </div>

                    <svg width="100%" height="100%">
                        {renderNode(treeData)}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default TreeTraversalVisualizer;
