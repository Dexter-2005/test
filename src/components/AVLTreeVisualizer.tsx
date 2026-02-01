import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, RefreshCw, Plus, Trash2 } from 'lucide-react';

interface AVLNode {
    id: number;
    value: number;
    height: number;
    left: AVLNode | null;
    right: AVLNode | null;
    x?: number;
    y?: number;
}

const AVLTreeVisualizer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [root, setRoot] = useState<AVLNode | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [message, setMessage] = useState('Enter a number to insert into the AVL Tree.');
    const idCounter = useRef(0);

    // --- AVL Logic ---
    const getHeight = (n: AVLNode | null): number => n ? n.height : 0;
    const getBalance = (n: AVLNode | null): number => n ? getHeight(n.left) - getHeight(n.right) : 0;

    const createNode = (value: number): AVLNode => ({
        id: idCounter.current++,
        value,
        height: 1,
        left: null,
        right: null
    });

    const rotateRight = (y: AVLNode): AVLNode => {
        const x = y.left!;
        const T2 = x.right;

        // Perform rotation
        x.right = y;
        y.left = T2;

        // Update heights
        y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
        x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;

        return x; // New root
    };

    const rotateLeft = (x: AVLNode): AVLNode => {
        const y = x.right!;
        const T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        // Update heights
        x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
        y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;

        return y; // New root
    };

    const insertNode = (node: AVLNode | null, value: number): AVLNode => {
        // 1. Standard BST Insert
        if (!node) return createNode(value);

        if (value < node.value) {
            node.left = insertNode(node.left, value);
        } else if (value > node.value) {
            node.right = insertNode(node.right, value);
        } else {
            setMessage(`Value ${value} already exists!`);
            return node;
        }

        // 2. Update Height
        node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));

        // 3. Get Balance Factor
        const balance = getBalance(node);

        // 4. Check for imbalance
        // Left Left Case
        if (balance > 1 && value < node.left!.value) {
            setMessage('Left-Left Case detected → Performing Right Rotation');
            return rotateRight(node);
        }
        // Right Right Case
        if (balance < -1 && value > node.right!.value) {
            setMessage('Right-Right Case detected → Performing Left Rotation');
            return rotateLeft(node);
        }
        // Left Right Case
        if (balance > 1 && value > node.left!.value) {
            setMessage('Left-Right Case detected → Performing Left-Right Rotation');
            node.left = rotateLeft(node.left!);
            return rotateRight(node);
        }
        // Right Left Case
        if (balance < -1 && value < node.right!.value) {
            setMessage('Right-Left Case detected → Performing Right-Left Rotation');
            node.right = rotateRight(node.right!);
            return rotateLeft(node);
        }

        return node;
    };

    const getMinValueNode = (node: AVLNode): AVLNode => {
        let current = node;
        while (current.left) current = current.left;
        return current;
    };

    const handleInsert = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) {
            setMessage('Please enter a valid number.');
            return;
        }
        setMessage(`Inserting ${val}...`);
        const newRoot = insertNode(root ? { ...root } : null, val); // Simple spread for shallow copy (note: for full immutability need deep copy or Immer, but for this simple app re-referencing nodes logic inside insertNode usually returns new structure top-down)
        // Note: The above insertNode mutates the object structure in place for simplicity in this demo logic. 
        // In a strictly immutable React app, we'd clone path nodes. 
        // Logic above returns new root if rotation happens, but modifies children.
        // For visualization triggering re-render, we need to ensure state updates.
        // Since we are replacing 'root', React will see a change if the root reference changes or if we force update. 
        // However, 'insertNode' as written mutates. To fix:
        // We will just do `setRoot({ ...newRoot })` to force a new object reference for the root at least.
        setRoot(newRoot);
        setInputValue('');
        if (message.startsWith('Insert')) setMessage(`Inserted ${val}. Tree Balanced.`);
    };

    const handleDelete = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) {
            setMessage('Please enter a valid number.');
            return;
        }

        let isDeleted = false;

        const deleteNodeRecursive = (root: AVLNode | null, value: number): AVLNode | null => {
            if (!root) {
                return null;
            }

            if (value < root.value) {
                root.left = deleteNodeRecursive(root.left, value);
            } else if (value > root.value) {
                root.right = deleteNodeRecursive(root.right, value);
            } else {
                // Found node to delete
                isDeleted = true;

                // Node with only one child or no child
                if ((!root.left) || (!root.right)) {
                    const temp = root.left ? root.left : root.right;
                    if (!temp) {
                        return null;
                    } else {
                        return temp;
                    }
                } else {
                    // Node with two children
                    const temp = getMinValueNode(root.right);
                    root.value = temp.value;
                    root.right = deleteNodeRecursive(root.right, temp.value);
                    // IMPORTANT: When deleting the successor, we assume it succeeds. 
                    // However, we already set isDeleted = true for the original node.
                    // We don't need to track the recursive call's deletion status as it's just a structural fix.
                }
            }

            if (!root) return null;

            root.height = 1 + Math.max(getHeight(root.left), getHeight(root.right));
            const balance = getBalance(root);

            // Using the same balancing logic as before
            if (balance > 1 && getBalance(root.left) >= 0)
                return rotateRight(root);

            if (balance > 1 && getBalance(root.left) < 0) {
                root.left = rotateLeft(root.left!);
                return rotateRight(root);
            }

            if (balance < -1 && getBalance(root.right) <= 0)
                return rotateLeft(root);

            if (balance < -1 && getBalance(root.right) > 0) {
                root.right = rotateRight(root.right!);
                return rotateLeft(root);
            }

            return root;
        };

        const newRoot = deleteNodeRecursive(root, val);

        if (isDeleted) {
            setRoot(newRoot ? { ...newRoot } : null);
            setInputValue('');
            setMessage(`Deleted ${val}. Tree Balanced.`);
        } else {
            setMessage(`Value ${val} not found.`);
        }
    };

    const handleReset = () => {
        setRoot(null);
        setInputValue('');
        setMessage('Tree reset.');
        idCounter.current = 0;
    };

    // --- Visualization ---
    const renderTree = (node: AVLNode | null, x: number, y: number, level: number, parentX?: number, parentY?: number) => {
        if (!node) return null;

        const xOffset = 100 / Math.pow(2, level + 2);

        return (
            <g key={node.id}>
                {parentX !== undefined && typeof parentY === 'number' && (
                    <line
                        x1={`${parentX}%`}
                        y1={`${parentY}%`}
                        x2={`${x}%`}
                        y2={`${y}%`}
                        stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                        strokeWidth="2"
                    />
                )}

                {renderTree(node.left, x - xOffset, y + 15, level + 1, x, y)}
                {renderTree(node.right, x + xOffset, y + 15, level + 1, x, y)}

                <foreignObject x={`${x - 8}%`} y={`${y - 8}%`} width="16%" height="16%">
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        {/* Node Circle */}
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold border-2 shadow-lg transition-all
                            ${isDark ? 'bg-indigo-900 border-indigo-500 text-white' : 'bg-white border-indigo-500 text-indigo-900'}
                        `}>
                            {node.value}
                        </div>

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
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        AVL Tree Visualizer
                    </h1>
                </div>
                <Link to="/avl/problems" className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 font-semibold transition-all">
                    Learn Rotations →
                </Link>
            </div>

            <div className={`mb-6 p-6 rounded-2xl border flex flex-wrap gap-4 items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter Value"
                    className={`w-32 px-4 py-2 rounded-xl outline-none border focus:border-indigo-500 ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                />
                <button onClick={handleInsert} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all font-semibold">
                    <Plus size={18} /> Insert
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all font-semibold">
                    <Trash2 size={18} /> Delete
                </button>
                <button onClick={handleReset} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-all font-semibold">
                    <RefreshCw size={18} /> Reset
                </button>
                <button
                    onClick={() => {
                        handleReset();
                        const values = [30, 20, 40, 10, 25, 35, 50];
                        const shuffled = values.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 5);
                        let newRoot: AVLNode | null = null;
                        shuffled.forEach(val => {
                            newRoot = insertNode(newRoot, val);
                        });
                        setRoot(newRoot);
                        setMessage(`Random AVL tree created with ${shuffled.length} nodes.`);
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 transition-all font-semibold"
                >
                    Random Tree
                </button>
            </div>

            <div className={`mb-6 text-center text-lg font-medium min-h-[1.5em] ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {message}
            </div>

            <div className={`h-[600px] w-full rounded-2xl border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <svg width="100%" height="100%">
                    {renderTree(root, 50, 10, 0)}
                </svg>
                {!root && (
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isDark ? 'text-white/20' : 'text-black/20'}`}>
                        <div className="text-center">
                            <p className="text-2xl font-bold">Empty Tree</p>
                            <p>Insert a number to see it balance automatically.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AVLTreeVisualizer;
