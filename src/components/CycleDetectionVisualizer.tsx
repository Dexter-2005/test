import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface ListNode {
    id: number;
    value: number;
    slowPointer: boolean;
    fastPointer: boolean;
    isCycleNode: boolean;
    isMeetingPoint: boolean;
}

const CycleDetectionVisualizer = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [list, setList] = useState<ListNode[]>([]);
    const [cycleIndex, setCycleIndex] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState('1 2 3 4 5 6');
    const [cycleInput, setCycleInput] = useState('');
    const [message, setMessage] = useState('Create a list and optionally set a cycle point, then start detection.');
    const [currentStep, setCurrentStep] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<'cycle' | 'no-cycle' | null>(null);

    const idCounter = useRef(0);
    const timeoutRef = useRef<number | null>(null);
    const isStoppedRef = useRef(false);

    const ANIMATION_DELAY = 800;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isStoppedRef.current = true;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleReset = useCallback(() => {
        isStoppedRef.current = true;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setList([]);
        setCycleIndex(null);
        setCurrentStep('');
        setIsRunning(false);
        setResult(null);

        setMessage('Create a list and optionally set a cycle point, then start detection.');
    }, []);

    // Create list
    const handleCreateList = useCallback(() => {
        if (!inputValue.trim()) {
            setMessage('⚠️ Please enter numbers separated by spaces.');
            return;
        }

        const numbers = inputValue.trim().split(/\s+/).map(Number);

        if (numbers.some(isNaN)) {
            setMessage('⚠️ Invalid input. Please enter valid numbers.');
            return;
        }

        const newList: ListNode[] = numbers.map((value) => ({
            id: idCounter.current++,
            value,
            slowPointer: false,
            fastPointer: false,
            isCycleNode: false,
            isMeetingPoint: false
        }));

        setList(newList);
        setCycleIndex(null);
        setResult(null);

        setMessage(`✅ List created with ${numbers.length} nodes. Set a cycle point or start detection.`);
    }, [inputValue]);

    // Set cycle
    const handleSetCycle = useCallback(() => {
        const index = parseInt(cycleInput);

        if (isNaN(index)) {
            setMessage('⚠️ Please enter a valid index for the cycle point.');
            return;
        }

        if (list.length === 0) {
            setMessage('⚠️ Create a list first.');
            return;
        }

        if (index < 0 || index >= list.length) {
            setMessage(`⚠️ Index out of bounds. Valid range: 0 to ${list.length - 1}`);
            return;
        }

        setCycleIndex(index);
        setList(prev => prev.map((node, i) => ({
            ...node,
            isCycleNode: i === index
        })));
        setMessage(`✅ Cycle set! Tail node now points back to index ${index} (value: ${list[index].value})`);
        setCycleInput('');
    }, [cycleInput, list]);

    // Remove cycle
    const handleRemoveCycle = useCallback(() => {
        setCycleIndex(null);
        setList(prev => prev.map(node => ({
            ...node,
            isCycleNode: false
        })));
        setMessage('Cycle removed. List is now linear.');
    }, []);

    // Start detection
    const handleStartDetection = useCallback(() => {
        if (list.length < 2) {
            setMessage('⚠️ Need at least 2 nodes to detect cycle.');
            return;
        }

        isStoppedRef.current = false;
        setIsRunning(true);
        setResult(null);

        // Reset pointers
        setList(prev => prev.map(node => ({
            ...node,
            slowPointer: false,
            fastPointer: false,
            isMeetingPoint: false
        })));

        let slow = 0;
        let fast = 0;
        let iterations = 0;
        const maxIterations = list.length * 3; // Safety limit

        setCurrentStep("Initialize: slow = 0, fast = 0");
        setMessage("Starting Floyd's Cycle Detection. Slow moves 1 step, Fast moves 2 steps.");

        const detectStep = () => {
            if (isStoppedRef.current) return;

            iterations++;

            if (iterations > maxIterations) {
                // Safety check - shouldn't happen with proper cycle detection
                setResult('no-cycle');
                setIsRunning(false);
                setCurrentStep('Detection complete');
                setMessage('Detection complete (iteration limit reached).');
                return;
            }

            // Move slow by 1
            const nextSlow = cycleIndex !== null && slow === list.length - 1 ? cycleIndex : slow + 1;

            // Move fast by 2
            let nextFast = fast;
            for (let i = 0; i < 2; i++) {
                if (cycleIndex !== null && nextFast === list.length - 1) {
                    nextFast = cycleIndex;
                } else {
                    nextFast = nextFast + 1;
                }

                // Check if fast goes out of bounds (no cycle)
                if (cycleIndex === null && nextFast >= list.length) {

                    setList(prev => prev.map((node, i) => ({
                        ...node,
                        slowPointer: i === slow,
                        fastPointer: false
                    })));
                    setResult('no-cycle');
                    setIsRunning(false);
                    setCurrentStep('Fast reached NULL');
                    setMessage('✅ No cycle detected! Fast pointer reached the end (NULL).');
                    return;
                }
            }

            slow = nextSlow;
            fast = nextFast >= list.length ? nextFast % list.length : nextFast;

            // Update visualization

            setList(prev => prev.map((node, i) => ({
                ...node,
                slowPointer: i === slow,
                fastPointer: i === fast
            })));

            setCurrentStep(`Move: slow → ${slow}, fast → ${fast}`);
            setMessage(`Slow at index ${slow}, Fast at index ${fast}`);

            // Check if they meet
            if (slow === fast && iterations > 0) {
                setList(prev => prev.map((node, i) => ({
                    ...node,
                    slowPointer: i === slow,
                    fastPointer: i === fast,
                    isMeetingPoint: i === slow
                })));
                setResult('cycle');
                setIsRunning(false);
                setCurrentStep(`Pointers meet at index ${slow}!`);
                setMessage(`🔄 Cycle detected! Slow and Fast pointers meet at index ${slow}.`);
                return;
            }

            // Check if fast will go out of bounds on next iteration (no cycle)
            if (cycleIndex === null) {
                const wouldBeNext1 = fast + 1;
                const wouldBeNext2 = fast + 2;
                if (wouldBeNext1 >= list.length || wouldBeNext2 >= list.length) {
                    timeoutRef.current = setTimeout(() => {
                        setResult('no-cycle');
                        setIsRunning(false);
                        setCurrentStep('Fast will reach NULL');
                        setMessage('✅ No cycle detected! Fast pointer will reach the end.');
                    }, ANIMATION_DELAY);
                    return;
                }
            }

            timeoutRef.current = setTimeout(detectStep, ANIMATION_DELAY);
        };

        // Initial position

        setList(prev => prev.map((node, i) => ({
            ...node,
            slowPointer: i === 0,
            fastPointer: i === 0
        })));

        timeoutRef.current = setTimeout(detectStep, ANIMATION_DELAY);
    }, [list, cycleIndex]);

    // Get node style
    const getNodeStyle = (node: ListNode) => {
        if (node.isMeetingPoint) {
            return 'bg-gradient-to-r from-red-500 to-pink-500 text-white ring-4 ring-red-400/50';
        }
        if (node.slowPointer && node.fastPointer) {
            return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-4 ring-purple-400/50';
        }
        if (node.slowPointer) {
            return 'bg-emerald-500 text-white ring-4 ring-emerald-400/50';
        }
        if (node.fastPointer) {
            return 'bg-sky-500 text-white ring-4 ring-sky-400/50';
        }
        if (node.isCycleNode) {
            return 'bg-gradient-to-r from-orange-500 to-red-500 text-white ring-2 ring-orange-400';
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
                        to="/linked-list"
                        className={`hover:text-orange-400 transition-colors text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}
                    >
                        ← Back to Linked List
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                        🔄 Cycle Detection
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

            {/* Problem Description */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    Floyd's Cycle Detection (Tortoise and Hare)
                </h2>
                <p className={`text-lg ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Detect if a linked list contains a cycle using two pointers moving at different speeds.
                    <span className="text-emerald-500 font-semibold"> Slow (🐢)</span> moves 1 step,
                    <span className="text-sky-500 font-semibold"> Fast (🐇)</span> moves 2 steps.
                    If they meet, there's a cycle!
                </p>
            </div>

            {/* Input Section */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Setup
                </h2>
                <div className="space-y-4">
                    {/* Create List */}
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter numbers (e.g., 1 2 3 4 5 6)"
                            disabled={isRunning}
                            className={`flex-1 px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                        <button
                            onClick={handleCreateList}
                            disabled={isRunning}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            Create List
                        </button>
                    </div>

                    {/* Set Cycle */}
                    <div className="flex gap-4 items-center">
                        <input
                            type="number"
                            value={cycleInput}
                            onChange={(e) => setCycleInput(e.target.value)}
                            placeholder="Cycle to index"
                            disabled={isRunning || list.length === 0}
                            className={`w-40 px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                        <button
                            onClick={handleSetCycle}
                            disabled={isRunning || list.length === 0}
                            className={`px-4 py-3 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                } disabled:opacity-50`}
                        >
                            Set Cycle Point
                        </button>
                        {cycleIndex !== null && (
                            <button
                                onClick={handleRemoveCycle}
                                disabled={isRunning}
                                className={`px-4 py-3 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                    } disabled:opacity-50`}
                            >
                                Remove Cycle
                            </button>
                        )}
                        <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                            (Optional: Make tail point back to create a cycle)
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleStartDetection}
                            disabled={isRunning || list.length < 2}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            Start Detection
                        </button>
                        <button
                            onClick={handleReset}
                            className={`px-6 py-3 rounded-xl font-bold text-lg transition-all hover:scale-105 ${isDark
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : 'bg-gray-200 text-black hover:bg-gray-300'
                                }`}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Pointer Legend */}
            <div className={`mb-6 p-4 rounded-2xl border flex flex-wrap gap-6 justify-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">🐢</div>
                    <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Slow Pointer (1 step)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold">🐇</div>
                    <span className={`font-semibold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Fast Pointer (2 steps)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Both Pointers</span>
                </div>
                {cycleIndex !== null && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500"></div>
                        <span className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Cycle Point (index {cycleIndex})</span>
                    </div>
                )}
            </div>

            {/* Linked List Display */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Linked List Visualization
                </h2>
                <div className="flex flex-wrap items-center gap-2 min-h-[120px] p-4">
                    {list.length === 0 ? (
                        <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                            Create a linked list to visualize cycle detection.
                        </p>
                    ) : (
                        <>
                            <span className={`font-bold text-lg mr-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>HEAD →</span>
                            {list.map((node, index) => (
                                <div key={node.id} className="flex flex-col items-center">
                                    <div className="flex items-center">
                                        {/* Node */}
                                        <div className={`relative flex items-center rounded-xl overflow-hidden transition-all duration-300 ${getNodeStyle(node)}`}>
                                            {/* Pointer indicators above */}
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-1">
                                                {node.slowPointer && <span className="text-lg">🐢</span>}
                                                {node.fastPointer && <span className="text-lg">🐇</span>}
                                            </div>
                                            {/* Data section */}
                                            <div className="px-4 py-3 font-mono font-bold text-xl border-r border-white/20">
                                                {node.value}
                                            </div>
                                            {/* Next pointer section */}
                                            <div className={`px-3 py-3 text-sm font-semibold ${isDark ? 'bg-white/10' : 'bg-gray-200/50'}`}>
                                                {index < list.length - 1 || cycleIndex !== null ? '→' : 'NULL'}
                                            </div>
                                        </div>
                                        {/* Arrow to next node */}
                                        {index < list.length - 1 && (
                                            <span className={`text-2xl mx-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>→</span>
                                        )}
                                    </div>
                                    {/* Index label */}
                                    <span className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>[{index}]</span>
                                </div>
                            ))}
                            {cycleIndex !== null ? (
                                <span className={`font-bold text-lg ml-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                    ↩ back to [{cycleIndex}]
                                </span>
                            ) : (
                                <span className={`font-bold text-lg ml-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>→ NULL</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Current Step */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    📝 Current Step
                </h3>
                <div className={`p-4 rounded-xl text-lg font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'}`}>
                    {currentStep || 'Waiting to start detection...'}
                </div>
            </div>

            {/* Message */}
            <div className={`mb-6 p-6 rounded-2xl border ${result === 'cycle'
                ? 'bg-red-500/20 border-red-500'
                : result === 'no-cycle'
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                <h3 className={`text-xl font-bold mb-3 ${result === 'cycle'
                    ? 'text-red-400'
                    : result === 'no-cycle'
                        ? 'text-emerald-400'
                        : isDark ? 'text-white' : 'text-black'
                    }`}>
                    💡 Status
                </h3>
                <div className={`text-lg font-medium ${result === 'cycle'
                    ? 'text-red-300'
                    : result === 'no-cycle'
                        ? 'text-emerald-300'
                        : isDark ? 'text-white' : 'text-black'
                    }`}>
                    {message}
                </div>
            </div>

            {/* Result Banner */}
            {result && (
                <div className={`mb-6 p-6 rounded-2xl text-center text-2xl font-bold ${result === 'cycle'
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                    : 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                    }`}>
                    {result === 'cycle' ? '🔄 Cycle Detected!' : '✅ No Cycle Found'}
                </div>
            )}

            {/* Algorithm Explanation */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    Floyd's Algorithm:
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <li><span className="text-orange-500 font-bold">1.</span> Initialize two pointers at HEAD: <span className="text-emerald-500">slow</span> and <span className="text-sky-500">fast</span></li>
                    <li><span className="text-orange-500 font-bold">2.</span> Move <span className="text-emerald-500">slow</span> by 1 step, <span className="text-sky-500">fast</span> by 2 steps</li>
                    <li><span className="text-orange-500 font-bold">3.</span> If <span className="text-sky-500">fast</span> reaches NULL → <span className="text-emerald-500">No Cycle</span></li>
                    <li><span className="text-orange-500 font-bold">4.</span> If pointers meet → <span className="text-red-500">Cycle Detected!</span></li>
                    <li><span className="text-orange-500 font-bold">5.</span> Time: <code className="text-sky-500">O(n)</code>, Space: <code className="text-sky-500">O(1)</code></li>
                </ul>
            </div>
        </div>
    );
};

export default CycleDetectionVisualizer;
