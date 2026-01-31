import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface StackElement {
    id: number;
    value: number;
    isAnimating?: boolean;
}

const StackVisualizer = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [inputValue, setInputValue] = useState('');
    const [sourceArray, setSourceArray] = useState<StackElement[]>([]);
    const [stack, setStack] = useState<StackElement[]>([]);
    const [poppedElements, setPoppedElements] = useState<StackElement[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [animatingElement, setAnimatingElement] = useState<StackElement | null>(null);
    const idCounter = useRef(0);

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 2000);
    };

    const handleLoadElements = () => {
        const values = inputValue
            .split(/[\s,]+/)
            .map((v) => v.trim())
            .filter((v) => v !== '')
            .map((v) => parseFloat(v))
            .filter((v) => !isNaN(v));

        if (values.length === 0) {
            showMessage('Please enter valid numbers separated by spaces or commas.');
            return;
        }

        const newElements: StackElement[] = values.map((value) => ({
            id: idCounter.current++,
            value,
        }));

        setSourceArray(newElements);
        setInputValue('');
        showMessage(`Loaded ${values.length} element(s) into the array.`);
    };

    const handlePush = (element: StackElement) => {
        // Create a clean copy of the element
        const cleanElement = { id: element.id, value: element.value };

        // Remove from source array immediately
        setSourceArray((prev) => prev.filter((el) => el.id !== element.id));

        // Animate element
        setAnimatingElement({ ...cleanElement, isAnimating: true });

        // After animation, add to stack
        setTimeout(() => {
            setStack((prev) => [...prev, cleanElement]);
            setAnimatingElement(null);
        }, 400);
    };

    const handlePop = () => {
        if (stack.length === 0) {
            showMessage('Stack Underflow! The stack is empty.');
            return;
        }

        // Get a clean copy of the top element
        const topElement = { ...stack[stack.length - 1] };
        delete topElement.isAnimating;

        // Mark element as animating
        setStack((prev) => {
            const newStack = [...prev];
            newStack[newStack.length - 1] = { ...newStack[newStack.length - 1], isAnimating: true };
            return newStack;
        });

        setTimeout(() => {
            // Use functional updates to avoid closure issues
            setStack((prev) => prev.slice(0, -1));
            setPoppedElements((prev) => [...prev, { id: topElement.id, value: topElement.value }]);
        }, 400);
    };

    const handleClear = () => {
        setSourceArray([]);
        setStack([]);
        setPoppedElements([]);
        setInputValue('');
        setMessage(null);
    };

    const handleClearSourceArray = () => {
        setSourceArray([]);
    };

    const handleClearSingleSource = (id: number) => {
        setSourceArray((prev) => prev.filter((el) => el.id !== id));
    };

    const handleClearPoppedElements = () => {
        setPoppedElements([]);
    };

    const handleClearSinglePopped = (id: number) => {
        setPoppedElements((prev) => prev.filter((el) => el.id !== id));
    };

    return (
        <div className={`min-h-screen p-8 text-base transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className={`hover:text-sky-400 transition-colors text-lg font-medium ${isDark ? 'text-white' : 'text-black'
                            }`}
                    >
                        ← Back to Home
                    </Link>
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-slate-400">
                        Stack Visualizer
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg transition-all hover:scale-105 ${isDark
                            ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
                    <button
                        onClick={handleClear}
                        className={`px-4 py-2 rounded-lg transition-all text-base font-semibold ${isDark
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                            }`}
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl text-center animate-pulse ${isDark
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-400'
                    : 'bg-sky-100 border border-sky-300 text-sky-600'
                    }`}>
                    {message}
                </div>
            )}

            {/* Input Section */}
            <div className={`mb-8 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'
                    }`}>
                    1. Load Elements
                </h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter numbers: e.g., 10 20 30 40"
                        className={`flex-1 px-4 py-3 rounded-xl text-lg focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${isDark
                            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                            : 'bg-gray-50 border border-gray-300 text-black placeholder:text-black/50'
                            }`}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadElements()}
                    />
                    <button
                        onClick={handleLoadElements}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-slate-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-sky-500/30 transition-all"
                    >
                        Load Elements
                    </button>
                </div>
            </div>

            {/* Main Visualization Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Array Container */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'
                            }`}>
                            2. Source Array{' '}
                            <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'
                                }`}>
                                (Click to Push)
                            </span>
                        </h2>
                        {sourceArray.length > 0 && (
                            <button
                                onClick={handleClearSourceArray}
                                className="px-3 py-1 rounded-lg bg-red-500/20 text-red-500 text-lg font-semibold hover:bg-red-500/30 transition-all"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3 min-h-[80px] items-start">
                        {sourceArray.length === 0 ? (
                            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-black'
                                }`}>
                                No elements loaded. Add some above!
                            </p>
                        ) : (
                            sourceArray.map((el) => (
                                <div key={el.id} className="relative group">
                                    <button
                                        onClick={() => handlePush(el)}
                                        className="w-18 h-18 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 hover:shadow-blue-500/50 transition-all cursor-pointer"
                                    >
                                        {el.value}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearSingleSource(el.id);
                                        }}
                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Remove element"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Stack Container */}
                <div className={`p-6 rounded-2xl border relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'
                            }`}>
                            3. Stack{' '}
                            <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'
                                }`}>(LIFO)</span>
                        </h2>
                        <button
                            onClick={handlePop}
                            disabled={stack.length === 0}
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold text-lg hover:scale-105 hover:shadow-lg hover:shadow-slate-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            Pop Top
                        </button>
                    </div>

                    {/* Stack Visualization */}
                    <div className={`flex flex-col-reverse items-center gap-2 min-h-[300px] justify-end p-4 rounded-xl border border-dashed relative ${isDark ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-300'
                        }`}>
                        {/* Bottom indicator */}
                        <div className="w-full h-2 bg-gradient-to-r from-sky-500/50 to-slate-500/50 rounded-full" />
                        <span className={`text-base font-semibold absolute bottom-1 ${isDark ? 'text-white' : 'text-black'
                            }`}>
                            BOTTOM
                        </span>

                        {stack.length === 0 && !animatingElement && (
                            <p className={`text-xl font-medium absolute top-1/2 -translate-y-1/2 ${isDark ? 'text-white' : 'text-black'
                                }`}>
                                Stack is empty
                            </p>
                        )}

                        {stack.map((el, index) => (
                            <div
                                key={el.id}
                                className={`w-28 h-18 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg transition-all duration-300 ${index === stack.length - 1
                                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sky-500/40 ring-2 ring-sky-400/50'
                                    : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                                    } ${el.isAnimating ? 'opacity-0 translate-y-4' : ''}`}
                            >
                                {el.value}
                                {index === stack.length - 1 && (
                                    <span className="absolute -right-14 text-base text-sky-500 font-normal">
                                        ← TOP
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Animating element when pushing */}
                        {animatingElement && (
                            <div className="w-28 h-18 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-sky-500/40 animate-bounce">
                                {animatingElement.value}
                            </div>
                        )}
                    </div>

                    {/* Stack Size Indicator */}
                    <div className={`mt-4 text-center text-xl font-semibold ${isDark ? 'text-white' : 'text-black'
                        }`}>
                        Stack Size: <span className="text-sky-500 font-bold">{stack.length}</span>
                    </div>
                </div>

                {/* Popped Elements Area */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'
                            }`}>
                            4. Popped Elements{' '}
                            <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'
                                }`}>
                                (Pop Sequence)
                            </span>
                        </h2>
                        {poppedElements.length > 0 && (
                            <button
                                onClick={handleClearPoppedElements}
                                className="px-3 py-1 rounded-lg bg-red-500/20 text-red-500 text-lg font-semibold hover:bg-red-500/30 transition-all"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 min-h-[80px]">
                        {poppedElements.length === 0 ? (
                            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-black'
                                }`}>No elements popped yet.</p>
                        ) : (
                            poppedElements.map((el, index) => (
                                <div
                                    key={el.id}
                                    className={`flex items-center justify-between p-3 rounded-xl border group ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-base font-semibold w-8 ${isDark ? 'text-white' : 'text-black'
                                            }`}>
                                            #{index + 1}
                                        </span>
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 text-white font-bold text-lg flex items-center justify-center">
                                            {el.value}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleClearSinglePopped(el.id)}
                                        className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/40"
                                        title="Remove element"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Legend/Info */}
            <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'
                    }`}>
                    How to Use:
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'
                    }`}>
                    <li>
                        <span className="text-sky-500 font-bold">1.</span> Enter numbers in the input
                        field (separated by spaces or commas) and click "Load Elements".
                    </li>
                    <li>
                        <span className="text-sky-500 font-bold">2.</span> Click on any element in the
                        Source Array to <strong className="text-green-500">push</strong> it onto
                        the stack.
                    </li>
                    <li>
                        <span className="text-sky-500 font-bold">3.</span> Click "Pop Top" to{' '}
                        <strong className="text-slate-500">pop</strong> the top element from the
                        stack.
                    </li>
                    <li>
                        <span className="text-sky-500 font-bold">4.</span> The{' '}
                        <strong className="text-sky-500">highlighted</strong> element is always
                        the top of the stack (LIFO).
                    </li>
                </ul>
            </div>

            {/* Visualize Using Problems Section */}
            <div className={`mt-6 p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border-sky-500/30' : 'bg-gradient-to-r from-sky-50 to-emerald-50 border-sky-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    🧩 Visualize Using Problems
                </h3>
                <p className={`text-lg mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Learn how stacks are used to solve real problems with interactive visualizations!
                </p>
                <Link
                    to="/stack/problems"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-sky-500/30 transition-all"
                >
                    Parenthesis Matching Algorithm →
                </Link>
            </div>
        </div>
    );
};

export default StackVisualizer;
