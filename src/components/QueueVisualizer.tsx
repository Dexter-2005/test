import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface QueueElement {
    id: number;
    value: number;
    isAnimating: boolean;
    animationType?: 'enqueue' | 'dequeue' | 'peek';
}

const QueueVisualizer = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [queue, setQueue] = useState<QueueElement[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [singleInput, setSingleInput] = useState('');
    const [message, setMessage] = useState('Enter numbers to load the queue or use operations below.');
    const [isAnimating, setIsAnimating] = useState(false);
    const [peekValue, setPeekValue] = useState<number | null>(null);

    const idCounter = useRef(0);
    const timeoutRef = useRef<number | null>(null);

    const ANIMATION_DELAY = 500;

    const showMessage = useCallback((msg: string) => {
        setMessage(msg);
    }, []);

    // Load queue from input
    const handleLoadQueue = useCallback(() => {
        if (!inputValue.trim()) {
            showMessage('⚠️ Please enter numbers separated by spaces.');
            return;
        }

        const numbers = inputValue.trim().split(/\s+/).map(Number);

        if (numbers.some(isNaN)) {
            showMessage('⚠️ Invalid input. Please enter valid numbers.');
            return;
        }

        const newQueue: QueueElement[] = numbers.map((value) => ({
            id: idCounter.current++,
            value,
            isAnimating: false
        }));

        setQueue(newQueue);
        setPeekValue(null);
        showMessage(`✅ Queue loaded with ${numbers.length} elements. Front is on the left.`);
    }, [inputValue, showMessage]);

    // Enqueue operation
    const handleEnqueue = useCallback(() => {
        const value = parseInt(singleInput);

        if (isNaN(value)) {
            showMessage('⚠️ Please enter a valid number to enqueue.');
            return;
        }

        setIsAnimating(true);
        setPeekValue(null);

        const newElement: QueueElement = {
            id: idCounter.current++,
            value,
            isAnimating: true,
            animationType: 'enqueue'
        };

        showMessage(`Enqueuing ${value} at the rear...`);

        // Add with animation
        setQueue(prev => [...prev, newElement]);

        timeoutRef.current = setTimeout(() => {
            setQueue(prev => prev.map(el => ({
                ...el,
                isAnimating: false,
                animationType: undefined
            })));
            showMessage(`✅ Enqueued ${value}. It is now at the rear of the queue.`);
            setIsAnimating(false);
        }, ANIMATION_DELAY);

        setSingleInput('');
    }, [singleInput, showMessage]);

    // Dequeue operation
    const handleDequeue = useCallback(() => {
        if (queue.length === 0) {
            showMessage('⚠️ Queue Underflow! Cannot dequeue from empty queue.');
            return;
        }

        setIsAnimating(true);
        setPeekValue(null);

        const frontValue = queue[0].value;

        // Highlight front element
        setQueue(prev => prev.map((el, i) => ({
            ...el,
            isAnimating: i === 0,
            animationType: i === 0 ? 'dequeue' : undefined
        })));

        showMessage(`Dequeuing ${frontValue} from the front...`);

        timeoutRef.current = setTimeout(() => {
            setQueue(prev => prev.slice(1).map(el => ({
                ...el,
                isAnimating: false,
                animationType: undefined
            })));
            showMessage(`✅ Dequeued ${frontValue}. It was at the front of the queue.`);
            setIsAnimating(false);
        }, ANIMATION_DELAY);
    }, [queue, showMessage]);

    // Peek operation
    const handlePeek = useCallback(() => {
        if (queue.length === 0) {
            showMessage('⚠️ Queue is empty! Nothing to peek.');
            return;
        }

        setIsAnimating(true);
        const frontValue = queue[0].value;

        // Highlight front element
        setQueue(prev => prev.map((el, i) => ({
            ...el,
            isAnimating: i === 0,
            animationType: i === 0 ? 'peek' : undefined
        })));

        setPeekValue(frontValue);
        showMessage(`👀 Peek: Front element is ${frontValue}`);

        timeoutRef.current = setTimeout(() => {
            setQueue(prev => prev.map(el => ({
                ...el,
                isAnimating: false,
                animationType: undefined
            })));
            setIsAnimating(false);
        }, ANIMATION_DELAY * 2);
    }, [queue, showMessage]);

    // Reset
    const handleReset = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setQueue([]);
        setInputValue('');
        setSingleInput('');
        setPeekValue(null);
        setIsAnimating(false);
        showMessage('Enter numbers to load the queue or use operations below.');
    }, [showMessage]);

    // Get element style based on state
    const getElementStyle = (element: QueueElement, index: number) => {
        if (element.animationType === 'dequeue') {
            return 'bg-red-500 text-white ring-4 ring-red-400/50 scale-90 opacity-70 -translate-x-4';
        }
        if (element.animationType === 'enqueue') {
            return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-4 ring-emerald-400/50 scale-110';
        }
        if (element.animationType === 'peek') {
            return 'bg-yellow-500 text-black ring-4 ring-yellow-400/50 scale-105';
        }
        if (index === 0) {
            return 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white';
        }
        if (index === queue.length - 1 && queue.length > 1) {
            return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
        }
        return isDark
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-gray-100 text-black hover:bg-gray-200';
    };

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className={`hover:text-sky-400 transition-colors text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}
                    >
                        ← Home
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                        📮 Queue Visualizer
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

            {/* Load Queue Section */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Load Queue
                </h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter numbers (e.g., 10 20 30 40 50)"
                        disabled={isAnimating}
                        className={`flex-1 px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark
                            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                            : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                            } disabled:opacity-50`}
                        onKeyDown={(e) => e.key === 'Enter' && !isAnimating && handleLoadQueue()}
                    />
                    <button
                        onClick={handleLoadQueue}
                        disabled={isAnimating}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Load Queue
                    </button>
                    <button
                        onClick={() => {
                            const count = Math.floor(Math.random() * 4) + 5;
                            const randomNums = Array.from({ length: count }, () => Math.floor(Math.random() * 99) + 1);
                            setInputValue(randomNums.join(' '));
                            const newQueue = randomNums.map((value) => ({
                                id: idCounter.current++,
                                value,
                                isAnimating: false
                            }));
                            setQueue(newQueue);
                            setPeekValue(null);
                            showMessage(`✅ Random queue created with ${count} elements. Front is on the left.`);
                        }}
                        disabled={isAnimating}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-fuchsia-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Random
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
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            value={singleInput}
                            onChange={(e) => setSingleInput(e.target.value)}
                            placeholder="Value"
                            disabled={isAnimating}
                            className={`w-24 px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                        <button
                            onClick={handleEnqueue}
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Enqueue
                        </button>
                    </div>
                    <button
                        onClick={handleDequeue}
                        disabled={isAnimating || queue.length === 0}
                        className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Dequeue
                    </button>
                    <button
                        onClick={handlePeek}
                        disabled={isAnimating || queue.length === 0}
                        className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Peek
                    </button>
                </div>
            </div>

            {/* Queue Display */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Queue Visualization
                </h2>
                <div className="relative">
                    {/* Front/Rear Labels */}
                    {queue.length > 0 && (
                        <div className="flex justify-between mb-2 px-8">
                            <span className="text-sky-500 font-bold text-lg">← FRONT</span>
                            <span className="text-purple-500 font-bold text-lg">REAR →</span>
                        </div>
                    )}

                    {/* Queue Container */}
                    <div className={`flex gap-4 min-h-[120px] items-center justify-center p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'}`}>
                        {queue.length === 0 ? (
                            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                Queue is empty. Load or enqueue elements.
                            </p>
                        ) : (
                            queue.map((element, index) => (
                                <div
                                    key={element.id}
                                    className={`relative w-16 h-16 rounded-xl flex items-center justify-center font-mono font-bold text-xl transition-all duration-300 ${getElementStyle(element, index)}`}
                                >
                                    {element.value}
                                    {index === 0 && queue.length > 1 && (
                                        <span className="absolute -bottom-6 text-xs text-sky-500 font-semibold">Front</span>
                                    )}
                                    {index === queue.length - 1 && queue.length > 1 && (
                                        <span className="absolute -bottom-6 text-xs text-purple-500 font-semibold">Rear</span>
                                    )}
                                    {queue.length === 1 && (
                                        <span className="absolute -bottom-6 text-xs text-cyan-500 font-semibold">Front/Rear</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Queue Size */}
                    {queue.length > 0 && (
                        <div className={`mt-4 text-center text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                            Queue Size: <span className="text-cyan-500">{queue.length}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Peek Result */}
            {peekValue !== null && (
                <div className="mb-6 p-4 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500 text-center">
                    <span className="text-xl font-bold text-yellow-500">
                        👀 Peek Value: {peekValue}
                    </span>
                </div>
            )}

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
                    to="/queue/problems"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                >
                    Generate Binary Numbers (1 to N) →
                </Link>
            </div>

            {/* Legend */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    How Queue Works (FIFO):
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <li><span className="text-cyan-500 font-bold">1.</span> <strong>Enqueue</strong>: Add elements to the <span className="text-purple-500">Rear</span> of the queue</li>
                    <li><span className="text-cyan-500 font-bold">2.</span> <strong>Dequeue</strong>: Remove elements from the <span className="text-sky-500">Front</span> of the queue</li>
                    <li><span className="text-cyan-500 font-bold">3.</span> <strong>Peek</strong>: View the front element without removing it</li>
                    <li><span className="text-cyan-500 font-bold">4.</span> FIFO = <strong>First In, First Out</strong> - Elements leave in the order they arrived</li>
                </ul>
            </div>
        </div>
    );
};

export default QueueVisualizer;
