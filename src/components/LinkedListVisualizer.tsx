import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface ListNode {
    id: number;
    value: number;
    isHighlighted: boolean;
    isAnimating: boolean;
    animationType?: 'insert' | 'delete' | 'search' | 'traverse';
}

const LinkedListVisualizer = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [list, setList] = useState<ListNode[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [positionInput, setPositionInput] = useState('');
    const [valueInput, setValueInput] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [message, setMessage] = useState('Create a linked list or use operations to build one node by node.');
    const [isAnimating, setIsAnimating] = useState(false);
    const [foundIndex, setFoundIndex] = useState<number | null>(null);

    const idCounter = useRef(0);
    const timeoutRef = useRef<number | null>(null);

    const ANIMATION_DELAY = 500;

    const showMessage = useCallback((msg: string) => {
        setMessage(msg);
    }, []);

    // Create list from input
    const handleCreateList = useCallback(() => {
        if (!inputValue.trim()) {
            showMessage('⚠️ Please enter numbers separated by spaces.');
            return;
        }

        const numbers = inputValue.trim().split(/\s+/).map(Number);

        if (numbers.some(isNaN)) {
            showMessage('⚠️ Invalid input. Please enter valid numbers.');
            return;
        }

        const newList: ListNode[] = numbers.map((value) => ({
            id: idCounter.current++,
            value,
            isHighlighted: false,
            isAnimating: false
        }));

        setList(newList);
        setFoundIndex(null);
        showMessage(`✅ Linked list created with ${numbers.length} nodes.`);
    }, [inputValue, showMessage]);

    // Insert at head
    const handleInsertHead = useCallback(() => {
        const value = parseInt(valueInput);

        if (isNaN(value)) {
            showMessage('⚠️ Please enter a valid value.');
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        const newNode: ListNode = {
            id: idCounter.current++,
            value,
            isHighlighted: true,
            isAnimating: true,
            animationType: 'insert'
        };

        showMessage(`Inserting ${value} at the head...`);
        setList(prev => [newNode, ...prev]);

        timeoutRef.current = setTimeout(() => {
            setList(prev => prev.map(node => ({
                ...node,
                isHighlighted: false,
                isAnimating: false,
                animationType: undefined
            })));
            showMessage(`✅ Inserted ${value} at the head. It is now the first node.`);
            setIsAnimating(false);
        }, ANIMATION_DELAY);

        setValueInput('');
    }, [valueInput, showMessage]);

    // Insert at tail
    const handleInsertTail = useCallback(() => {
        const value = parseInt(valueInput);

        if (isNaN(value)) {
            showMessage('⚠️ Please enter a valid value.');
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        const newNode: ListNode = {
            id: idCounter.current++,
            value,
            isHighlighted: true,
            isAnimating: true,
            animationType: 'insert'
        };

        showMessage(`Inserting ${value} at the tail...`);
        setList(prev => [...prev, newNode]);

        timeoutRef.current = setTimeout(() => {
            setList(prev => prev.map(node => ({
                ...node,
                isHighlighted: false,
                isAnimating: false,
                animationType: undefined
            })));
            showMessage(`✅ Inserted ${value} at the tail. It is now the last node.`);
            setIsAnimating(false);
        }, ANIMATION_DELAY);

        setValueInput('');
    }, [valueInput, showMessage]);

    // Insert at position
    const handleInsertAt = useCallback(() => {
        const position = parseInt(positionInput);
        const value = parseInt(valueInput);

        if (isNaN(position) || isNaN(value)) {
            showMessage('⚠️ Please enter valid position and value.');
            return;
        }

        if (position < 0 || position > list.length) {
            showMessage(`⚠️ Position out of bounds. Valid range: 0 to ${list.length}`);
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        // Traverse animation
        let currentPos = 0;

        const traverseStep = () => {
            if (currentPos < position) {
                setList(prev => prev.map((node, i) => ({
                    ...node,
                    isHighlighted: i === currentPos,
                    animationType: i === currentPos ? 'traverse' : undefined
                })));

                showMessage(`Traversing... at position ${currentPos}`);

                timeoutRef.current = setTimeout(() => {
                    currentPos++;
                    traverseStep();
                }, ANIMATION_DELAY / 2);
            } else {
                // Insert node
                const newNode: ListNode = {
                    id: idCounter.current++,
                    value,
                    isHighlighted: true,
                    isAnimating: true,
                    animationType: 'insert'
                };

                setList(prev => {
                    const newList = [...prev];
                    newList.splice(position, 0, newNode);
                    return newList.map((node, i) => ({
                        ...node,
                        isHighlighted: i === position,
                        isAnimating: i === position,
                        animationType: i === position ? 'insert' : undefined
                    }));
                });

                showMessage(`Inserting ${value} at position ${position}...`);

                timeoutRef.current = setTimeout(() => {
                    setList(prev => prev.map(node => ({
                        ...node,
                        isHighlighted: false,
                        isAnimating: false,
                        animationType: undefined
                    })));
                    showMessage(`✅ Inserted ${value} at position ${position}.`);
                    setIsAnimating(false);
                }, ANIMATION_DELAY);
            }
        };

        traverseStep();
        setPositionInput('');
        setValueInput('');
    }, [list.length, positionInput, valueInput, showMessage]);

    // Delete at position
    const handleDeleteAt = useCallback(() => {
        const position = parseInt(positionInput);

        if (isNaN(position)) {
            showMessage('⚠️ Please enter a valid position.');
            return;
        }

        if (list.length === 0) {
            showMessage('⚠️ List is empty!');
            return;
        }

        if (position < 0 || position >= list.length) {
            showMessage(`⚠️ Position out of bounds. Valid range: 0 to ${list.length - 1}`);
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        const deletedValue = list[position].value;

        // Highlight node to delete
        setList(prev => prev.map((node, i) => ({
            ...node,
            isHighlighted: i === position,
            animationType: i === position ? 'delete' : undefined
        })));

        showMessage(`Deleting node with value ${deletedValue} at position ${position}...`);

        timeoutRef.current = setTimeout(() => {
            setList(prev => prev.filter((_, i) => i !== position).map(node => ({
                ...node,
                isHighlighted: false,
                animationType: undefined
            })));
            showMessage(`✅ Deleted node with value ${deletedValue} from position ${position}.`);
            setIsAnimating(false);
        }, ANIMATION_DELAY);

        setPositionInput('');
    }, [list, positionInput, showMessage]);

    // Search
    const handleSearch = useCallback(() => {
        const value = parseInt(searchInput);

        if (isNaN(value)) {
            showMessage('⚠️ Please enter a valid number to search.');
            return;
        }

        if (list.length === 0) {
            showMessage('⚠️ List is empty!');
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        let currentPos = 0;

        const searchStep = () => {
            if (currentPos >= list.length) {
                setList(prev => prev.map(node => ({
                    ...node,
                    isHighlighted: false,
                    animationType: undefined
                })));
                showMessage(`❌ Value ${value} not found in the list.`);
                setIsAnimating(false);
                return;
            }

            setList(prev => prev.map((node, i) => ({
                ...node,
                isHighlighted: i === currentPos,
                animationType: i === currentPos ? 'search' : undefined
            })));

            showMessage(`Searching... Checking position ${currentPos}: value = ${list[currentPos].value}`);

            timeoutRef.current = setTimeout(() => {
                if (list[currentPos].value === value) {
                    setFoundIndex(currentPos);
                    setList(prev => prev.map((node, i) => ({
                        ...node,
                        isHighlighted: i === currentPos,
                        animationType: i === currentPos ? 'search' : undefined
                    })));
                    showMessage(`✅ Found ${value} at position ${currentPos}!`);
                    setIsAnimating(false);
                    return;
                }

                currentPos++;
                searchStep();
            }, ANIMATION_DELAY);
        };

        searchStep();
        setSearchInput('');
    }, [list, searchInput, showMessage]);

    // Reverse list
    const handleReverse = useCallback(() => {
        if (list.length <= 1) {
            showMessage('⚠️ Need at least 2 nodes to reverse.');
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        showMessage('Reversing the linked list...');

        // Highlight all nodes
        setList(prev => prev.map(node => ({
            ...node,
            isHighlighted: true,
            animationType: 'traverse'
        })));

        timeoutRef.current = setTimeout(() => {
            setList(prev => [...prev].reverse().map(node => ({
                ...node,
                isHighlighted: false,
                animationType: undefined
            })));
            showMessage('✅ Linked list reversed!');
            setIsAnimating(false);
        }, ANIMATION_DELAY * 2);
    }, [list.length, showMessage]);

    // Reset
    const handleReset = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setList([]);
        setInputValue('');
        setPositionInput('');
        setValueInput('');
        setSearchInput('');
        setFoundIndex(null);
        setIsAnimating(false);
        showMessage('Create a linked list or use operations to build one node by node.');
    }, [showMessage]);

    // Get node style
    const getNodeStyle = (node: ListNode, index: number) => {
        if (foundIndex === index) {
            return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-4 ring-emerald-400/50';
        }
        if (node.animationType === 'delete') {
            return 'bg-red-500 text-white ring-4 ring-red-400/50 scale-90 opacity-50';
        }
        if (node.animationType === 'insert') {
            return 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white ring-4 ring-sky-400/50 scale-110';
        }
        if (node.animationType === 'search' || node.animationType === 'traverse') {
            return 'bg-yellow-500 text-black ring-4 ring-yellow-400/50';
        }
        if (node.isHighlighted) {
            return 'bg-sky-500 text-white';
        }
        return isDark
            ? 'bg-white/10 text-white'
            : 'bg-gray-100 text-black';
    };

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className={`hover:text-orange-400 transition-colors text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}
                    >
                        ← Home
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                        🔗 Linked List Visualizer
                    </h1>
                </div>
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-all hover:scale-105 ${isDark
                        ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                >
                    {isDark ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Create List Section */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Create Linked List
                </h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter numbers (e.g., 10 20 30 40 50)"
                        disabled={isAnimating}
                        className={`flex-1 px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isDark
                            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                            : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                            } disabled:opacity-50`}
                        onKeyDown={(e) => e.key === 'Enter' && !isAnimating && handleCreateList()}
                    />
                    <button
                        onClick={handleCreateList}
                        disabled={isAnimating}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create List
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={isAnimating}
                        className={`px-6 py-3 rounded-xl font-bold text-lg transition-all hover:scale-105 ${isDark
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                            } disabled:opacity-50`}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Operations Panel */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Operations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Insert Inputs */}
                    <div className="flex flex-col gap-2">
                        <input
                            type="number"
                            value={valueInput}
                            onChange={(e) => setValueInput(e.target.value)}
                            placeholder="Value"
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                        <input
                            type="number"
                            value={positionInput}
                            onChange={(e) => setPositionInput(e.target.value)}
                            placeholder="Position"
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                    </div>

                    {/* Insert Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleInsertHead}
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Insert at Head
                        </button>
                        <button
                            onClick={handleInsertTail}
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                                : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Insert at Tail
                        </button>
                    </div>

                    {/* Position Operations */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleInsertAt}
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Insert at Position
                        </button>
                        <button
                            onClick={handleDeleteAt}
                            disabled={isAnimating || list.length === 0}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Delete at Position
                        </button>
                    </div>

                    {/* Search & Reverse */}
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search"
                                disabled={isAnimating}
                                className={`flex-1 px-3 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isDark
                                    ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                    : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                    } disabled:opacity-50`}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isAnimating || list.length === 0}
                                className={`px-3 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 ${isDark
                                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    } disabled:opacity-50`}
                            >
                                🔍
                            </button>
                        </div>
                        <button
                            onClick={handleReverse}
                            disabled={isAnimating || list.length <= 1}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Reverse List
                        </button>
                    </div>
                </div>
            </div>

            {/* Linked List Display */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Linked List Visualization
                </h2>
                <div className="flex flex-wrap items-center gap-2 min-h-[120px] p-4">
                    {list.length === 0 ? (
                        <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                            Linked list is empty. Create a list or insert nodes.
                        </p>
                    ) : (
                        <>
                            <span className={`font-bold text-lg mr-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>HEAD →</span>
                            {list.map((node, index) => (
                                <div key={node.id} className="flex items-center">
                                    {/* Node */}
                                    <div className={`flex items-center rounded-xl overflow-hidden transition-all duration-300 ${getNodeStyle(node, index)}`}>
                                        {/* Data section */}
                                        <div className="px-4 py-3 font-mono font-bold text-xl border-r border-white/20">
                                            {node.value}
                                        </div>
                                        {/* Next pointer section */}
                                        <div className={`px-3 py-3 text-sm font-semibold ${isDark ? 'bg-white/10' : 'bg-gray-200/50'}`}>
                                            {index < list.length - 1 ? '→' : 'NULL'}
                                        </div>
                                    </div>
                                    {/* Arrow to next node */}
                                    {index < list.length - 1 && (
                                        <span className={`text-2xl mx-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>→</span>
                                    )}
                                </div>
                            ))}
                            <span className={`font-bold text-lg ml-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>→ NULL</span>
                        </>
                    )}
                </div>
                {list.length > 0 && (
                    <div className={`mt-4 text-center text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        List Length: <span className="text-orange-500">{list.length}</span>
                    </div>
                )}
            </div>

            {/* Step Explanation */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    📝 Step Explanation
                </h2>
                <div className={`p-4 rounded-xl text-lg font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'}`}>
                    {message}
                </div>
            </div>

            {/* Navigate to Problem */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    🧩 Visualize Using Problems
                </h2>
                <Link
                    to="/linked-list/problems"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                >
                    Detect Cycle (Floyd's Algorithm) →
                </Link>
            </div>

            {/* Legend */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    How Linked List Works:
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <li><span className="text-orange-500 font-bold">1.</span> Each node contains <strong>Data</strong> and a <strong>Next Pointer</strong></li>
                    <li><span className="text-orange-500 font-bold">2.</span> <strong>HEAD</strong> points to the first node, last node points to <strong>NULL</strong></li>
                    <li><span className="text-orange-500 font-bold">3.</span> <span className="text-emerald-500">Insert at Head</span>: O(1) - Just update HEAD pointer</li>
                    <li><span className="text-orange-500 font-bold">4.</span> <span className="text-sky-500">Insert at Tail</span>: O(n) - Traverse to end first</li>
                    <li><span className="text-orange-500 font-bold">5.</span> <span className="text-yellow-500">Search</span>: O(n) - Must traverse from HEAD</li>
                </ul>
            </div>
        </div>
    );
};

export default LinkedListVisualizer;
