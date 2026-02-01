import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, ChevronRight, RotateCw, CheckCircle } from 'lucide-react';

interface RotationNode {
    id: number;
    val: number;
    x: number;
    y: number;
    bf: number;
    highlight?: boolean;
    error?: boolean;
    new?: boolean;
}

const AVLRotationVisualizer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [step, setStep] = useState(0);

    const steps: {
        title: string;
        description: string;
        nodes: RotationNode[];
        edges: { from: { x: number; y: number }; to: { x: number; y: number } }[]
    }[] = [
            {
                title: 'Initial State',
                description: 'We have a balanced tree with nodes 10 and 20.',
                nodes: [
                    { id: 1, val: 10, x: 50, y: 10, bf: -1 },
                    { id: 2, val: 20, x: 75, y: 30, bf: 0 }
                ],
                edges: [
                    { from: { x: 50, y: 10 }, to: { x: 75, y: 30 } }
                ]
            },
            {
                title: 'Insert 30',
                description: 'We insert 30. Standard BST insertion goes to the right of 20.',
                nodes: [
                    { id: 1, val: 10, x: 50, y: 10, bf: -2, highlight: true }, // BF becomes -2
                    { id: 2, val: 20, x: 75, y: 30, bf: -1 },
                    { id: 3, val: 30, x: 87.5, y: 50, bf: 0, new: true }
                ],
                edges: [
                    { from: { x: 50, y: 10 }, to: { x: 75, y: 30 } },
                    { from: { x: 75, y: 30 }, to: { x: 87.5, y: 50 } }
                ]
            },
            {
                title: 'Detect Imbalance',
                description: 'Node 10 has a Balance Factor of -2 (Right Heavy). Its right child (20) has BF -1. This is a Right-Right (RR) Case.',
                nodes: [
                    { id: 1, val: 10, x: 50, y: 10, bf: -2, error: true },
                    { id: 2, val: 20, x: 75, y: 30, bf: -1 },
                    { id: 3, val: 30, x: 87.5, y: 50, bf: 0 }
                ],
                edges: [
                    { from: { x: 50, y: 10 }, to: { x: 75, y: 30 } },
                    { from: { x: 75, y: 30 }, to: { x: 87.5, y: 50 } }
                ]
            },
            {
                title: 'Perform Left Rotation',
                description: 'We rotate LEFT around Node 10. Node 20 becomes the new root. Node 10 becomes the left child of 20.',
                nodes: [
                    { id: 2, val: 20, x: 50, y: 10, bf: 0, highlight: true },
                    { id: 1, val: 10, x: 25, y: 30, bf: 0 },
                    { id: 3, val: 30, x: 75, y: 30, bf: 0 }
                ],
                edges: [
                    { from: { x: 50, y: 10 }, to: { x: 25, y: 30 } },
                    { from: { x: 50, y: 10 }, to: { x: 75, y: 30 } }
                ]
            },
            {
                title: 'Balanced',
                description: 'The tree is now balanced. All nodes have Balance Factor 0.',
                nodes: [
                    { id: 2, val: 20, x: 50, y: 10, bf: 0 },
                    { id: 1, val: 10, x: 25, y: 30, bf: 0 },
                    { id: 3, val: 30, x: 75, y: 30, bf: 0 }
                ],
                edges: [
                    { from: { x: 50, y: 10 }, to: { x: 25, y: 30 } },
                    { from: { x: 50, y: 10 }, to: { x: 75, y: 30 } }
                ]
            }
        ];

    const currentStep = steps[step];

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            <div className="flex items-center gap-4 mb-8">
                <Link to="/avl" className={`hover:text-indigo-400 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    AVL Rotations: RR Case
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Explanation Panel */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-mono text-indigo-500 font-bold">STEP {step + 1} / {steps.length}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep(Math.max(0, step - 1))}
                                disabled={step === 0}
                                className="p-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 disabled:opacity-50"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <button
                                onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                                disabled={step === steps.length - 1}
                                className="p-2 rounded-lg bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30 disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-4">{currentStep.title}</h2>
                    <p className={`text-lg leading-relaxed mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {currentStep.description}
                    </p>

                    <div className={`p-4 rounded-xl border-l-4 border-indigo-500 ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <RotateCw size={18} /> Logic:
                        </h3>
                        <p className="text-sm opacity-80">
                            When Balance Factor &lt; -1, and Child's Balance Factor &le; 0:
                            <br />
                            <strong className="block mt-2">Perform Left Rotate(Node)</strong>
                        </p>
                    </div>

                    {step === steps.length - 1 && (
                        <div className="mt-8 text-center p-4 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold flex items-center justify-center gap-2 animate-bounce">
                            <CheckCircle /> Rotation Complete!
                        </div>
                    )}
                </div>

                {/* Visualization Area */}
                <div className={`lg:col-span-2 h-[500px] rounded-2xl border relative transition-all duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <svg width="100%" height="100%" className="transition-all duration-500">
                        {/* Edges */}
                        {currentStep.edges.map((edge, i) => (
                            <line
                                key={i}
                                x1={`${edge.from.x}%`} y1={`${edge.from.y}%`}
                                x2={`${edge.to.x}%`} y2={`${edge.to.y}%`}
                                stroke={isDark ? 'white' : 'black'}
                                strokeOpacity={0.2}
                                strokeWidth="2"
                                className="transition-all duration-500"
                            />
                        ))}

                        {/* Nodes */}
                        {currentStep.nodes.map((node) => (
                            <g key={node.id} className="transition-all duration-500" style={{ transformOrigin: 'center' }}>
                                <foreignObject x={`${node.x - 5}%`} y={`${node.y - 5}%`} width="10%" height="10%">
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 shadow-xl transition-all duration-500
                                             ${node.error
                                                ? 'bg-red-500 border-red-300 text-white animate-pulse'
                                                : node.highlight
                                                    ? 'bg-indigo-500 border-indigo-300 text-white scale-110'
                                                    : node.new
                                                        ? 'bg-emerald-500 border-emerald-300 text-white'
                                                        : isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'
                                            }
                                         `}>
                                            {node.val}
                                        </div>
                                        <div className={`absolute -top-2 -right-2 text-xs font-mono font-bold px-1.5 rounded bg-orange-500 text-white transition-opacity duration-300 ${step === 0 ? 'opacity-0' : 'opacity-100'}`}>
                                            {node.bf}
                                        </div>
                                    </div>
                                </foreignObject>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default AVLRotationVisualizer;
