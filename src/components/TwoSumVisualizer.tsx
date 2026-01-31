import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface ArrayElement {
    value: number;
    index: number;
    status: 'pending' | 'current' | 'checking' | 'found' | 'processed';
}

interface HashMapEntry {
    key: number;
    value: number;
    isNew: boolean;
    isMatch: boolean;
}

const TwoSumVisualizer = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [inputValue, setInputValue] = useState('2 7 11 15');
    const [targetValue, setTargetValue] = useState('9');
    const [array, setArray] = useState<ArrayElement[]>([]);
    const [hashMap, setHashMap] = useState<HashMapEntry[]>([]);
    const [message, setMessage] = useState('Enter an array and target, then click "Start Visualization"');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{ indices: [number, number]; values: [number, number] } | null>(null);
    const [currentStep, setCurrentStep] = useState<string>('');

    const timeoutRef = useRef<number | null>(null);
    const isStoppedRef = useRef(false);

    const ANIMATION_DELAY = 1200;

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
        setArray([]);
        setHashMap([]);
        setResult(null);
        setCurrentStep('');
        setIsRunning(false);
        setMessage('Enter an array and target, then click "Start Visualization"');
    }, []);

    const handleVisualize = useCallback(() => {
        if (!inputValue.trim() || !targetValue.trim()) {
            setMessage('⚠️ Please enter both array and target value.');
            return;
        }

        const numbers = inputValue.trim().split(/\s+/).map(Number);
        const target = parseInt(targetValue);

        if (numbers.some(isNaN) || isNaN(target)) {
            setMessage('⚠️ Invalid input. Please enter valid numbers.');
            return;
        }

        // Initialize
        isStoppedRef.current = false;
        setIsRunning(true);
        setResult(null);
        setHashMap([]);

        const initialArray: ArrayElement[] = numbers.map((value, index) => ({
            value,
            index,
            status: 'pending'
        }));

        setArray(initialArray);
        setMessage(`Starting Two Sum visualization. Target = ${target}`);
        setCurrentStep('Initialize HashMap as empty');

        let currentIndex = 0;
        const tempHashMap: HashMapEntry[] = [];

        const processStep = () => {
            if (isStoppedRef.current) return;

            if (currentIndex >= numbers.length) {
                setMessage('❌ No two numbers found that sum to target.');
                setCurrentStep('Searched entire array - no solution found');
                setIsRunning(false);
                return;
            }

            const currentValue = numbers[currentIndex];
            const complement = target - currentValue;

            // Highlight current element
            setArray(prev => prev.map((el, i) => ({
                ...el,
                status: i < currentIndex ? 'processed' : i === currentIndex ? 'current' : 'pending'
            })));

            setCurrentStep(`Checking index ${currentIndex}: value = ${currentValue}`);
            setMessage(`Current element: ${currentValue}. Complement needed: ${target} - ${currentValue} = ${complement}`);

            timeoutRef.current = setTimeout(() => {
                if (isStoppedRef.current) return;

                // Check if complement exists in hashmap
                const foundEntry = tempHashMap.find(entry => entry.key === complement);

                if (foundEntry) {
                    // Found the pair!
                    setArray(prev => prev.map((el, i) => ({
                        ...el,
                        status: i === foundEntry.value || i === currentIndex ? 'found' : 'processed'
                    })));

                    setHashMap(prev => prev.map(entry => ({
                        ...entry,
                        isMatch: entry.key === complement,
                        isNew: false
                    })));

                    setResult({
                        indices: [foundEntry.value, currentIndex],
                        values: [numbers[foundEntry.value], currentValue]
                    });

                    setCurrentStep(`Found! HashMap contains ${complement} at index ${foundEntry.value}`);
                    setMessage(`✅ Found pair: nums[${foundEntry.value}] + nums[${currentIndex}] = ${numbers[foundEntry.value]} + ${currentValue} = ${target}`);
                    setIsRunning(false);
                    return;
                }

                // Not found - add current value to hashmap
                setCurrentStep(`${complement} not in HashMap. Adding ${currentValue} → index ${currentIndex}`);
                setMessage(`Complement ${complement} not found. Store: HashMap[${currentValue}] = ${currentIndex}`);

                const newEntry: HashMapEntry = {
                    key: currentValue,
                    value: currentIndex,
                    isNew: true,
                    isMatch: false
                };

                tempHashMap.push(newEntry);

                setHashMap([...tempHashMap.map(entry => ({
                    ...entry,
                    isNew: entry.key === currentValue
                }))]);

                timeoutRef.current = setTimeout(() => {
                    if (isStoppedRef.current) return;

                    // Remove 'new' highlight
                    setHashMap(prev => prev.map(entry => ({
                        ...entry,
                        isNew: false
                    })));

                    currentIndex++;
                    processStep();
                }, ANIMATION_DELAY);
            }, ANIMATION_DELAY);
        };

        timeoutRef.current = setTimeout(processStep, 500);
    }, [inputValue, targetValue]);

    const getElementStyle = (element: ArrayElement) => {
        switch (element.status) {
            case 'current':
                return 'bg-sky-500 text-white ring-4 ring-sky-400/50 scale-110';
            case 'checking':
                return 'bg-yellow-500 text-black ring-4 ring-yellow-400/50';
            case 'found':
                return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-4 ring-emerald-400/50 scale-110';
            case 'processed':
                return isDark ? 'bg-white/10 text-white/40' : 'bg-gray-200 text-gray-500';
            default:
                return isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black';
        }
    };

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        to="/array"
                        className={`hover:text-sky-400 transition-colors text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}
                    >
                        ← Back to Array
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        🎯 Two Sum Problem
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
                    Given an array of integers <code className="px-2 py-1 rounded bg-sky-500/20 text-sky-500">nums</code> and an integer <code className="px-2 py-1 rounded bg-purple-500/20 text-purple-500">target</code>,
                    return indices of the two numbers such that they add up to target.
                </p>
            </div>

            {/* Input Section */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Input
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            Array (space-separated)
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="e.g., 2 7 11 15"
                            disabled={isRunning}
                            className={`w-full px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            Target
                        </label>
                        <input
                            type="number"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            placeholder="e.g., 9"
                            disabled={isRunning}
                            className={`w-full px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                    </div>
                </div>
                <div className="flex gap-4 mt-4">
                    <button
                        onClick={handleVisualize}
                        disabled={isRunning}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Visualization Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Array Display */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                        📊 Array
                    </h3>
                    <div className="flex flex-wrap gap-4 min-h-[100px] items-center justify-center">
                        {array.length === 0 ? (
                            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                Array will appear here...
                            </p>
                        ) : (
                            array.map((element) => (
                                <div key={element.index} className="flex flex-col items-center gap-2">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-mono font-bold text-xl transition-all duration-300 ${getElementStyle(element)}`}>
                                        {element.value}
                                    </div>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                                        [{element.index}]
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* HashMap Display */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                        🗂️ HashMap
                    </h3>
                    <div className="min-h-[100px]">
                        {hashMap.length === 0 ? (
                            <p className={`text-lg text-center ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                HashMap is empty
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {hashMap.map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${entry.isMatch
                                            ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 ring-2 ring-emerald-400'
                                            : entry.isNew
                                                ? 'bg-sky-500/20 ring-2 ring-sky-400'
                                                : isDark ? 'bg-white/5' : 'bg-gray-100'
                                            }`}
                                    >
                                        <span className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                                            {entry.key}
                                        </span>
                                        <span className={`${isDark ? 'text-white/60' : 'text-gray-500'}`}>→</span>
                                        <span className={`font-mono ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                                            index {entry.value}
                                        </span>
                                        {entry.isMatch && (
                                            <span className="ml-auto text-emerald-500 font-bold">✓ Match!</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Current Step */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    📝 Current Step
                </h3>
                <div className={`p-4 rounded-xl text-lg font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'}`}>
                    {currentStep || 'Waiting to start...'}
                </div>
            </div>

            {/* Message */}
            <div className={`mb-6 p-6 rounded-2xl border ${result
                ? 'bg-emerald-500/20 border-emerald-500'
                : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                <h3 className={`text-xl font-bold mb-3 ${result ? 'text-emerald-500' : isDark ? 'text-white' : 'text-black'}`}>
                    💡 Explanation
                </h3>
                <div className={`text-lg font-medium ${result ? 'text-emerald-400' : isDark ? 'text-white' : 'text-black'}`}>
                    {message}
                </div>
            </div>

            {/* Result Banner */}
            {result && (
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-2 border-emerald-500 text-center">
                    <h3 className="text-2xl font-bold text-emerald-500 mb-2">✅ Solution Found!</h3>
                    <p className="text-xl text-emerald-400">
                        Indices: <span className="font-mono font-bold">[{result.indices[0]}, {result.indices[1]}]</span>
                    </p>
                    <p className="text-lg text-emerald-400/80 mt-1">
                        Values: {result.values[0]} + {result.values[1]} = {result.values[0] + result.values[1]}
                    </p>
                </div>
            )}

            {/* Algorithm Explanation */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    Algorithm:
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <li><span className="text-purple-500 font-bold">1.</span> Create an empty HashMap to store {`{value: index}`}</li>
                    <li><span className="text-purple-500 font-bold">2.</span> For each element, calculate <code className="text-pink-500">complement = target - current</code></li>
                    <li><span className="text-purple-500 font-bold">3.</span> If complement exists in HashMap → <span className="text-emerald-500">Found pair!</span></li>
                    <li><span className="text-purple-500 font-bold">4.</span> Else, store current value and its index in HashMap</li>
                    <li><span className="text-purple-500 font-bold">5.</span> Time Complexity: <code className="text-sky-500">O(n)</code>, Space: <code className="text-sky-500">O(n)</code></li>
                </ul>
            </div>
        </div>
    );
};

export default TwoSumVisualizer;
