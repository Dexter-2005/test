import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface QueueItem {
    id: number;
    value: string;
    isAnimating: boolean;
    isDequeuing: boolean;
}

const BinaryNumbersVisualizer = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [nValue, setNValue] = useState('5');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [output, setOutput] = useState<string[]>([]);
    const [message, setMessage] = useState('Enter N and click "Start Visualization" to generate binary numbers.');
    const [currentStep, setCurrentStep] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const idCounter = useRef(0);
    const timeoutRef = useRef<number | null>(null);
    const isStoppedRef = useRef(false);

    const ANIMATION_DELAY = 1000;

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
        setQueue([]);
        setOutput([]);
        setCurrentStep('');
        setIsRunning(false);
        setIsComplete(false);
        setMessage('Enter N and click "Start Visualization" to generate binary numbers.');
    }, []);

    const handleVisualize = useCallback(() => {
        const n = parseInt(nValue);

        if (isNaN(n) || n < 1 || n > 20) {
            setMessage('⚠️ Please enter a valid number between 1 and 20.');
            return;
        }

        // Initialize
        isStoppedRef.current = false;
        setIsRunning(true);
        setIsComplete(false);
        setOutput([]);

        // Start with "1" in the queue
        const initialItem: QueueItem = {
            id: idCounter.current++,
            value: '1',
            isAnimating: true,
            isDequeuing: false
        };

        setQueue([initialItem]);
        setMessage(`Starting to generate binary numbers from 1 to ${n}`);
        setCurrentStep('Initialize queue with "1"');

        let count = 0;
        const resultQueue: QueueItem[] = [initialItem];

        const processStep = () => {
            if (isStoppedRef.current) return;

            if (count >= n) {
                setIsComplete(true);
                setIsRunning(false);
                setCurrentStep('Complete!');
                setMessage(`✅ Generated all binary numbers from 1 to ${n}!`);
                return;
            }

            // Get front of queue
            const front = resultQueue[0];

            // Highlight dequeuing
            setQueue([...resultQueue.map((item, i) => ({
                ...item,
                isDequeuing: i === 0,
                isAnimating: false
            }))]);

            setCurrentStep(`Dequeue "${front.value}" from front`);
            setMessage(`Dequeuing "${front.value}" and adding to output...`);

            timeoutRef.current = setTimeout(() => {
                if (isStoppedRef.current) return;

                // Add to output
                setOutput(prev => [...prev, front.value]);
                count++;

                // Remove from queue
                resultQueue.shift();

                if (count >= n) {
                    setQueue([...resultQueue]);
                    setIsComplete(true);
                    setIsRunning(false);
                    setCurrentStep('Complete!');
                    setMessage(`✅ Generated all binary numbers from 1 to ${n}!`);
                    return;
                }

                // Generate next two binary numbers
                const next0: QueueItem = {
                    id: idCounter.current++,
                    value: front.value + '0',
                    isAnimating: true,
                    isDequeuing: false
                };

                const next1: QueueItem = {
                    id: idCounter.current++,
                    value: front.value + '1',
                    isAnimating: true,
                    isDequeuing: false
                };

                resultQueue.push(next0, next1);

                setQueue([...resultQueue]);
                setCurrentStep(`Enqueue "${next0.value}" and "${next1.value}"`);
                setMessage(`Enqueuing "${front.value}0" and "${front.value}1" to queue rear`);

                timeoutRef.current = setTimeout(() => {
                    if (isStoppedRef.current) return;

                    // Remove animation highlight
                    setQueue(prev => prev.map(item => ({
                        ...item,
                        isAnimating: false
                    })));

                    timeoutRef.current = setTimeout(() => {
                        processStep();
                    }, ANIMATION_DELAY / 2);
                }, ANIMATION_DELAY / 2);
            }, ANIMATION_DELAY);
        };

        timeoutRef.current = setTimeout(() => {
            setQueue(prev => prev.map(item => ({ ...item, isAnimating: false })));
            processStep();
        }, ANIMATION_DELAY);
    }, [nValue]);

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        to="/queue"
                        className={`hover:text-cyan-400 transition-colors text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}
                    >
                        ← Back to Queue
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                        🔢 Binary Numbers Generator
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
                    Problem Statement
                </h2>
                <p className={`text-lg ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Generate binary numbers from <code className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-500">1</code> to <code className="px-2 py-1 rounded bg-purple-500/20 text-purple-500">N</code> using a Queue.
                    This problem beautifully demonstrates how queue mechanics can solve sequence generation problems.
                </p>
            </div>

            {/* Input Section */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Input
                </h2>
                <div className="flex gap-4 items-center">
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            N (1-20)
                        </label>
                        <input
                            type="number"
                            value={nValue}
                            onChange={(e) => setNValue(e.target.value)}
                            min="1"
                            max="20"
                            disabled={isRunning}
                            className={`w-24 px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                    </div>
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleVisualize}
                            disabled={isRunning}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Visualization
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

            {/* Visualization Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Queue Display */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                        📮 Queue
                    </h3>
                    {queue.length > 0 && (
                        <div className="flex justify-between mb-2 px-4">
                            <span className="text-sky-500 font-bold text-sm">← FRONT</span>
                            <span className="text-purple-500 font-bold text-sm">REAR →</span>
                        </div>
                    )}
                    <div className={`flex flex-wrap gap-3 min-h-[100px] items-center justify-center p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'}`}>
                        {queue.length === 0 ? (
                            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                Queue will appear here...
                            </p>
                        ) : (
                            queue.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`px-4 py-2 rounded-xl font-mono font-bold text-lg transition-all duration-300 ${item.isDequeuing
                                        ? 'bg-red-500 text-white ring-4 ring-red-400/50 scale-90 opacity-70'
                                        : item.isAnimating
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-4 ring-emerald-400/50 scale-110'
                                            : index === 0
                                                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white'
                                                : isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-black'
                                        }`}
                                >
                                    {item.value}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Output Display */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                        📤 Output (Binary Numbers)
                    </h3>
                    <div className={`flex flex-wrap gap-3 min-h-[100px] items-center justify-center p-4 rounded-xl border-2 ${isComplete ? 'border-emerald-500 bg-emerald-500/10' : isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'}`}>
                        {output.length === 0 ? (
                            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                Output will appear here...
                            </p>
                        ) : (
                            output.map((num, index) => (
                                <div
                                    key={index}
                                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl font-mono font-bold text-lg ${index === output.length - 1 && isRunning
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-4 ring-emerald-400/50 scale-110'
                                        : isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                >
                                    <span>{num}</span>
                                    <span className="text-xs opacity-70">({index + 1})</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Current Step */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    📝 Current Step
                </h3>
                <div className={`p-4 rounded-xl text-lg font-medium ${isComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'
                    }`}>
                    {currentStep || 'Waiting to start...'}
                </div>
            </div>

            {/* Message */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    💡 Explanation
                </h3>
                <div className={`text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                    {message}
                </div>
            </div>

            {/* Algorithm Explanation */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    Algorithm:
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <li><span className="text-cyan-500 font-bold">1.</span> Start with <code className="text-purple-500">"1"</code> in the queue</li>
                    <li><span className="text-cyan-500 font-bold">2.</span> Loop N times:</li>
                    <li className="ml-6">• <span className="text-sky-500">Dequeue</span> front element → Add to output</li>
                    <li className="ml-6">• <span className="text-emerald-500">Enqueue</span> (front + "0") and (front + "1")</li>
                    <li><span className="text-cyan-500 font-bold">3.</span> This generates: 1, 10, 11, 100, 101, 110, 111...</li>
                    <li><span className="text-cyan-500 font-bold">4.</span> Time Complexity: <code className="text-sky-500">O(n)</code></li>
                </ul>
            </div>
        </div>
    );
};

export default BinaryNumbersVisualizer;
