import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, RefreshCw, Plus, Trash2, Search, ChevronDown, Settings2 } from 'lucide-react';

interface TreeNode {
    id: string;
    value: number;
    left?: TreeNode;
    right?: TreeNode;
    x: number; // For basic layout (optional if we calculate dynamically)
    y: number; // For basic layout
    highlight?: boolean;
}

type ConstructionMode = 'manual' | 'pre-in' | 'post-in';

const TreeVisualizer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [root, setRoot] = useState<TreeNode | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [message, setMessage] = useState('Create a root node to start.');
    const [searchPath, setSearchPath] = useState<string[]>([]); // Array of IDs
    const [mode, setMode] = useState<ConstructionMode>('manual');

    // Inputs for traversal construction
    const [traversalInput1, setTraversalInput1] = useState(''); // Preorder or Postorder
    const [traversalInput2, setTraversalInput2] = useState(''); // Inorder

    // For generating unique IDs
    const idCounter = useRef(0);

    const showMessage = (msg: string) => {
        setMessage(msg);
    };

    // --- Manual Operations ---
    const handleCreateRoot = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) {
            showMessage('Please enter a valid number.');
            return;
        }
        if (root) {
            showMessage('Root already exists. Reset to start over.');
            return;
        }
        const newRoot: TreeNode = {
            id: `node-${idCounter.current++}`,
            value: val,
            x: 50, // Percent
            y: 10,  // Percent
        };
        setRoot(newRoot);
        setInputValue('');
        showMessage('Root created. Select it to add children.');
    };

    const handleInsert = (direction: 'left' | 'right') => {
        if (!selectedNodeId) {
            showMessage('Please select a parent node first.');
            return;
        }
        const val = parseInt(inputValue);
        if (isNaN(val)) {
            showMessage('Please enter a valid number.');
            return;
        }

        const insertNode = (node: TreeNode): TreeNode => {
            if (node.id === selectedNodeId) {
                if (direction === 'left' && node.left) {
                    showMessage('Left child already exists.');
                    return node;
                }
                if (direction === 'right' && node.right) {
                    showMessage('Right child already exists.');
                    return node;
                }
                const newNode: TreeNode = {
                    id: `node-${idCounter.current++}`,
                    value: val,
                    x: 0, // Calculated later
                    y: 0,
                };
                return { ...node, [direction]: newNode };
            }
            return {
                ...node,
                left: node.left ? insertNode(node.left) : undefined,
                right: node.right ? insertNode(node.right) : undefined,
            };
        };

        if (root) {
            setRoot(insertNode(root));
            setInputValue('');
            showMessage(`Added ${val} to the ${direction}.`);
        }
    };

    const handleDelete = () => {
        if (!selectedNodeId) {
            showMessage('Select a node to delete.');
            return;
        }
        if (root && root.id === selectedNodeId) {
            setRoot(null);
            setSelectedNodeId(null);
            showMessage('Root deleted.');
            return;
        }

        const deleteNode = (node: TreeNode): TreeNode | undefined => {
            if (node.left && node.left.id === selectedNodeId) {
                return { ...node, left: undefined };
            }
            if (node.right && node.right.id === selectedNodeId) {
                return { ...node, right: undefined };
            }
            return {
                ...node,
                left: node.left ? deleteNode(node.left) : undefined,
                right: node.right ? deleteNode(node.right) : undefined,
            };
        };

        if (root) {
            setRoot(deleteNode(root) as TreeNode);
            setSelectedNodeId(null);
            showMessage('Node deleted (and its subtree).');
        }
    };

    const handleSearch = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) {
            showMessage('Enter a value to search.');
            return;
        }

        setSearchPath([]);
        let found = false;
        const path: string[] = [];

        const search = (node: TreeNode | undefined) => {
            if (!node) return;
            path.push(node.id);
            if (node.value === val) {
                found = true;
                setSearchPath([...path]);
                showMessage(`Found ${val}!`);
                return;
            }
            search(node.left);
            if (found) return;
            search(node.right);
            if (found) return;
            path.pop(); // Backtrack
        };

        search(root || undefined);
        if (!found) {
            showMessage(`${val} not found.`);
        }
    };

    const handleReset = () => {
        setRoot(null);
        setSelectedNodeId(null);
        setSearchPath([]);
        setMessage('Tree reset.');
        setInputValue('');
        setTraversalInput1('');
        setTraversalInput2('');
        idCounter.current = 0;
    };

    // --- Traversal Construction Logic ---
    const buildFromPreIn = (pre: number[], inOrder: number[]): TreeNode | undefined => {
        if (pre.length === 0 || inOrder.length === 0) return undefined;

        const rootVal = pre[0];
        const rootIndex = inOrder.indexOf(rootVal);

        if (rootIndex === -1) throw new Error("Invalid Traversals: Node not found in Inorder.");

        const node: TreeNode = {
            id: `node-${idCounter.current++}`,
            value: rootVal,
            x: 0, y: 0
        };

        const leftIn = inOrder.slice(0, rootIndex);
        const rightIn = inOrder.slice(rootIndex + 1);

        const leftPre = pre.slice(1, 1 + leftIn.length);
        const rightPre = pre.slice(1 + leftIn.length);

        node.left = buildFromPreIn(leftPre, leftIn);
        node.right = buildFromPreIn(rightPre, rightIn);

        return node;
    };

    const buildFromPostIn = (post: number[], inOrder: number[]): TreeNode | undefined => {
        if (post.length === 0 || inOrder.length === 0) return undefined;

        const rootVal = post[post.length - 1];
        const rootIndex = inOrder.indexOf(rootVal);

        if (rootIndex === -1) throw new Error("Invalid Traversals: Node not found in Inorder.");

        const node: TreeNode = {
            id: `node-${idCounter.current++}`,
            value: rootVal,
            x: 0, y: 0
        };

        const leftIn = inOrder.slice(0, rootIndex);
        const rightIn = inOrder.slice(rootIndex + 1);

        // In Postorder: Left -> Right -> Root. 
        // We know lengths from Inorder.
        const leftPost = post.slice(0, leftIn.length);
        const rightPost = post.slice(leftIn.length, post.length - 1);

        node.left = buildFromPostIn(leftPost, leftIn);
        node.right = buildFromPostIn(rightPost, rightIn);

        return node;
    };

    const handleConstructTree = () => {
        try {
            const arr1 = traversalInput1.split(/[ ,]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            const arr2 = traversalInput2.split(/[ ,]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));

            if (arr1.length === 0 || arr2.length === 0) {
                showMessage("Please enter valid numbers array.");
                return;
            }
            if (arr1.length !== arr2.length) {
                showMessage("Traversal arrays must have the same length.");
                return;
            }
            // Check if both have same elements
            const set1 = new Set(arr1);
            const set2 = new Set(arr2);
            if (arr1.length !== set1.size) {
                showMessage("Error: Duplicate values are not supported for unique construction.");
                return;
            }
            // Sets equality check (basic)
            for (let val of arr1) {
                if (!set2.has(val)) {
                    showMessage(`Error: Value ${val} exists in one array but not the other.`);
                    return;
                }
            }

            idCounter.current = 0;
            let newRoot: TreeNode | undefined;

            if (mode === 'pre-in') {
                newRoot = buildFromPreIn(arr1, arr2);
            } else if (mode === 'post-in') {
                newRoot = buildFromPostIn(arr1, arr2);
            }

            if (newRoot) {
                setRoot(newRoot);
                showMessage("Tree constructed successfully!");
            }
        } catch (error: any) {
            showMessage(error.message || "Error constructing tree. Check inputs.");
        }
    };


    // --- Visualization Logic ---
    const renderTree = (node: TreeNode | undefined, x: number, y: number, level: number, parentX?: number, parentY?: number) => {
        if (!node) return null;

        const xOffset = 100 / Math.pow(2, level + 2); // Dynamic horizontal spacing

        const currentX = parentX === undefined ? 50 : x;
        const currentY = parentY === undefined ? 10 : y;

        const isSelected = node.id === selectedNodeId;
        const isSearched = searchPath.includes(node.id);

        return (
            <g key={node.id}>
                {/* Edge to Parent */}
                {parentX !== undefined && parentY !== undefined && (
                    <line
                        x1={`${parentX}%`}
                        y1={`${parentY}%`}
                        x2={`${currentX}%`}
                        y2={`${currentY}%`}
                        stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                        strokeWidth="2"
                    />
                )}

                {/* Recursive Children */}
                {renderTree(node.left, currentX - xOffset, currentY + 15, level + 1, currentX, currentY)}
                {renderTree(node.right, currentX + xOffset, currentY + 15, level + 1, currentX, currentY)}

                {/* Node */}
                <foreignObject x={`${currentX - 3}%`} y={`${currentY - 3}%`} width="6%" height="6%">
                    <div
                        onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                        className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all cursor-pointer shadow-lg
                            ${isSelected
                                ? 'bg-sky-500 border-sky-300 text-white scale-110'
                                : isSearched
                                    ? 'bg-emerald-500 border-emerald-300 text-white'
                                    : isDark
                                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                        : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        {node.value}
                    </div>
                </foreignObject>
            </g>
        );
    };

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/" className={`hover:text-sky-400 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-sky-400">
                        Tree Visualizer
                    </h1>
                </div>
                <div className="flex gap-4">
                    <Link to="/tree/problems" className="px-4 py-2 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 font-semibold transition-all">
                        Visualize Traversals →
                    </Link>
                </div>
            </div>

            {/* Mode Selection */}
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <Settings2 className={isDark ? 'text-sky-400' : 'text-sky-600'} />
                <span className="font-semibold">Construction Mode:</span>
                <select
                    value={mode}
                    onChange={(e) => {
                        setMode(e.target.value as ConstructionMode);
                        handleReset();
                        setMessage('Mode changed. Tree reset.');
                    }}
                    className={`px-4 py-2 rounded-lg outline-none border cursor-pointer font-medium transition-all
                        ${isDark
                            ? 'bg-black/20 border-white/10 text-white hover:bg-black/30'
                            : 'bg-gray-50 border-gray-300 text-black hover:bg-gray-100'
                        }`}
                >
                    <option value="manual">Manual Construction</option>
                    <option value="pre-in">From Preorder & Inorder</option>
                    <option value="post-in">From Postorder & Inorder</option>
                </select>
            </div>

            {/* Controls */}
            <div className={`mb-6 p-6 rounded-2xl border flex flex-wrap gap-4 items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>

                {mode === 'manual' ? (
                    <>
                        <input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Value"
                            className={`w-24 px-4 py-2 rounded-xl outline-none border focus:border-sky-500 ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                        />
                        <div className="flex gap-2">
                            <button onClick={handleCreateRoot} disabled={!!root} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={16} /> Root
                            </button>
                            <button onClick={() => handleInsert('left')} disabled={!selectedNodeId} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronDown size={16} className="rotate-45" /> Add Left
                            </button>
                            <button onClick={() => handleInsert('right')} disabled={!selectedNodeId} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronDown size={16} className="-rotate-45" /> Add Right
                            </button>
                            <button onClick={handleSearch} disabled={!root} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Search size={16} /> Search
                            </button>
                            <button onClick={handleDelete} disabled={!selectedNodeId} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Trash2 size={16} /> Delete
                            </button>
                            <button
                                onClick={() => {
                                    handleReset();
                                    const values = [50, 25, 75, 12, 37, 62, 87].slice(0, Math.floor(Math.random() * 3) + 5);
                                    const shuffled = values.sort(() => Math.random() - 0.5);

                                    const buildRandomTree = (vals: number[], index: number): TreeNode | undefined => {
                                        if (index >= vals.length) return undefined;
                                        const node: TreeNode = {
                                            id: `node-${idCounter.current++}`,
                                            value: vals[index],
                                            x: 0, y: 0
                                        };
                                        node.left = buildRandomTree(vals, 2 * index + 1);
                                        node.right = buildRandomTree(vals, 2 * index + 2);
                                        return node;
                                    };

                                    const newRoot = buildRandomTree(shuffled, 0);
                                    setRoot(newRoot || null);
                                    showMessage('Random tree created!');
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 transition-all"
                            >
                                Random Tree
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-wrap gap-4 items-end w-full">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-sm font-medium opacity-70">
                                {mode === 'pre-in' ? 'Preorder Traversal' : 'Postorder Traversal'}
                            </label>
                            <input
                                type="text"
                                value={traversalInput1}
                                onChange={(e) => setTraversalInput1(e.target.value)}
                                placeholder="e.g. 1, 2, 4, 5, 3"
                                className={`w-full px-4 py-2 rounded-xl outline-none border focus:border-sky-500 ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                            />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-sm font-medium opacity-70">
                                Inorder Traversal
                            </label>
                            <input
                                type="text"
                                value={traversalInput2}
                                onChange={(e) => setTraversalInput2(e.target.value)}
                                placeholder="e.g. 4, 2, 5, 1, 3"
                                className={`w-full px-4 py-2 rounded-xl outline-none border focus:border-sky-500 ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                            />
                        </div>
                        <button onClick={handleConstructTree} className="h-10 px-6 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-bold transition-all">
                            Construct Tree
                        </button>
                    </div>
                )}

                <button onClick={handleReset} className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    <RefreshCw size={16} /> Reset
                </button>
            </div>

            {/* Message Bar */}
            <div className={`mb-6 text-center text-lg font-medium min-h-[1.5em] ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
                {message}
            </div>

            {/* Visualization Area */}
            <div className={`h-[600px] w-full rounded-2xl border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <svg width="100%" height="100%">
                    {renderTree(root || undefined, 50, 10, 0)}
                </svg>
                {!root && (
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isDark ? 'text-white/20' : 'text-black/20'}`}>
                        <div className="text-center">
                            <p className="text-2xl font-bold">Empty Tree</p>
                            <p className="opacity-70 mt-2">
                                {mode === 'manual'
                                    ? 'Create a root node to begin'
                                    : 'Enter traversals above to generate'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreeVisualizer;
