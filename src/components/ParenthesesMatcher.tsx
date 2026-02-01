import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface StackItem {
    char: string;
    index: number;
}

interface CharInfo {
    char: string;
    index: number;
    type: 'opening' | 'closing' | 'other';
    status: 'pending' | 'processing' | 'processed' | 'error';
}

const OPENING_BRACKETS = ['(', '{', '['];
const CLOSING_BRACKETS = [')', '}', ']'];
const BRACKET_PAIRS: { [key: string]: string } = {
    ')': '(',
    '}': '{',
    ']': '['
};

const ParenthesesMatcher = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [inputValue, setInputValue] = useState('');
    const [characters, setCharacters] = useState<CharInfo[]>([]);
    const [stack, setStack] = useState<StackItem[]>([]);
    const [stepMessage, setStepMessage] = useState('Enter an expression and click "Visualize" to start.');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<'balanced' | 'unbalanced' | null>(null);
    const [animatingPush, setAnimatingPush] = useState<StackItem | null>(null);
    const [animatingPop, setAnimatingPop] = useState<StackItem | null>(null);

    const timeoutRef = useRef<number | null>(null);
    const isStoppedRef = useRef(false);

    const ANIMATION_DELAY = 1000;

    const getBracketType = (char: string): 'opening' | 'closing' | 'other' => {
        if (OPENING_BRACKETS.includes(char)) return 'opening';
        if (CLOSING_BRACKETS.includes(char)) return 'closing';
        return 'other';
    };

    const handleReset = useCallback(() => {
        isStoppedRef.current = true;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setCharacters([]);
        setStack([]);
        setStepMessage('Enter an expression and click "Visualize" to start.');
        setIsRunning(false);
        setResult(null);
        setAnimatingPush(null);
        setAnimatingPop(null);
        setInputValue('');
    }, []);

    const processStep = useCallback(function recursiveStep(
        chars: CharInfo[],
        idx: number,
        currentStack: StackItem[]
    ) {
        if (isStoppedRef.current) return;

        // All characters processed
        if (idx >= chars.length) {
            if (currentStack.length === 0) {
                setResult('balanced');
                setStepMessage('✅ All brackets matched! Expression is BALANCED.');
            } else {
                setResult('unbalanced');
                setStepMessage(`❌ Stack not empty (${currentStack.length} unmatched opening bracket(s)). Expression is UNBALANCED.`);
            }
            setIsRunning(false);
            return;
        }

        const currentChar = chars[idx];

        // Update character status
        setCharacters(prev => prev.map((c, i) => ({
            ...c,
            status: i < idx ? 'processed' : i === idx ? 'processing' : 'pending'
        })));

        if (currentChar.type === 'other') {
            // Skip non-bracket characters
            setStepMessage(`Skipping character '${currentChar.char}' (not a bracket)`);
            timeoutRef.current = setTimeout(() => {
                recursiveStep(chars, idx + 1, currentStack);
            }, ANIMATION_DELAY / 2);
            return;
        }

        if (currentChar.type === 'opening') {
            const newItem: StackItem = { char: currentChar.char, index: idx };
            setStepMessage(`Opening bracket '${currentChar.char}' found → Push to stack`);
            setAnimatingPush(newItem);

            timeoutRef.current = setTimeout(() => {
                if (isStoppedRef.current) return;
                const newStack = [...currentStack, newItem];
                setStack(newStack);
                setAnimatingPush(null);

                timeoutRef.current = setTimeout(() => {
                    recursiveStep(chars, idx + 1, newStack);
                }, ANIMATION_DELAY / 2);
            }, ANIMATION_DELAY / 2);
            return;
        }

        if (currentChar.type === 'closing') {
            const expectedOpening = BRACKET_PAIRS[currentChar.char];

            if (currentStack.length === 0) {
                setStepMessage(`❌ Closing bracket '${currentChar.char}' found but stack is empty! Expression is UNBALANCED.`);
                setCharacters(prev => prev.map((c, i) => ({
                    ...c,
                    status: i === idx ? 'error' : c.status
                })));
                setResult('unbalanced');
                setIsRunning(false);
                return;
            }

            const topItem = currentStack[currentStack.length - 1];

            if (topItem.char === expectedOpening) {
                setStepMessage(`Closing bracket '${currentChar.char}' found → Matches top '${topItem.char}' → Pop from stack`);
                setAnimatingPop(topItem);

                timeoutRef.current = setTimeout(() => {
                    if (isStoppedRef.current) return;
                    const newStack = currentStack.slice(0, -1);
                    setStack(newStack);
                    setAnimatingPop(null);

                    timeoutRef.current = setTimeout(() => {
                        recursiveStep(chars, idx + 1, newStack);
                    }, ANIMATION_DELAY / 2);
                }, ANIMATION_DELAY / 2);
                return;
            } else {
                setStepMessage(`❌ Mismatch! Closing bracket '${currentChar.char}' doesn't match top '${topItem.char}'. Expression is UNBALANCED.`);
                setCharacters(prev => prev.map((c, i) => ({
                    ...c,
                    status: i === idx ? 'error' : c.status
                })));
                setResult('unbalanced');
                setIsRunning(false);
                return;
            }
        }
    }, []);

    const handleVisualize = () => {
        if (!inputValue.trim()) {
            setStepMessage('⚠️ Please enter an expression to visualize.');
            return;
        }

        // Check if there are any brackets
        const hasBrackets = inputValue.split('').some(c =>
            OPENING_BRACKETS.includes(c) || CLOSING_BRACKETS.includes(c)
        );

        if (!hasBrackets) {
            setCharacters(inputValue.split('').map((char, index) => ({
                char,
                index,
                type: 'other',
                status: 'processed'
            })));
            setResult('balanced');
            setStepMessage('✅ No brackets found. Expression is considered BALANCED.');
            return;
        }

        isStoppedRef.current = false;
        const chars: CharInfo[] = inputValue.split('').map((char, index) => ({
            char,
            index,
            type: getBracketType(char),
            status: 'pending' as const
        }));

        setCharacters(chars);
        setStack([]);
        setResult(null);
        setIsRunning(true);
        setStepMessage('Starting visualization...');

        timeoutRef.current = setTimeout(() => {
            processStep(chars, 0, []);
        }, 500);
    };

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-deep-black text-white' : 'bg-gray-100 text-black'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        to="/stack"
                        className={`hover:text-sky-400 transition-colors text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}
                    >
                        ← Back to Stack
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400">
                        🧩 Parenthesis Matching
                    </h1>
                </div>
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
            </div>

            {/* Problem Input Area */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Balanced Parentheses Checker
                </h2>
                <p className={`mb-4 text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                    Supported brackets: <code className="px-2 py-1 rounded bg-sky-500/20 text-sky-500 font-mono">( )</code>{' '}
                    <code className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-500 font-mono">{'{ }'}</code>{' '}
                    <code className="px-2 py-1 rounded bg-purple-500/20 text-purple-500 font-mono">[ ]</code>
                </p>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter expression (e.g. (a+b)*{c-d})"
                        disabled={isRunning}
                        className={`flex-1 px-4 py-3 rounded-xl text-lg focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${isDark
                            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                            : 'bg-gray-50 border border-gray-300 text-black placeholder:text-black/50'
                            } disabled:opacity-50`}
                        onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleVisualize()}
                    />
                    <button
                        onClick={handleVisualize}
                        disabled={isRunning}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        Visualize
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

            {/* Main Visualization Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expression Display & Step Explanation */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Expression Display Area */}
                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                            Expression
                        </h3>
                        <div className="flex flex-wrap gap-2 min-h-[60px] items-center">
                            {characters.length === 0 ? (
                                <p className={`text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                                    Expression will appear here...
                                </p>
                            ) : (
                                characters.map((charInfo, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-xl transition-all duration-300 ${charInfo.status === 'processing'
                                            ? 'bg-sky-500 text-white ring-4 ring-sky-400/50 scale-110'
                                            : charInfo.status === 'error'
                                                ? 'bg-red-500 text-white ring-4 ring-red-400/50'
                                                : charInfo.status === 'processed'
                                                    ? isDark ? 'bg-white/10 text-white/40' : 'bg-gray-200 text-black/40'
                                                    : charInfo.type === 'opening'
                                                        ? 'bg-emerald-500/20 text-emerald-500'
                                                        : charInfo.type === 'closing'
                                                            ? 'bg-purple-500/20 text-purple-500'
                                                            : isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'
                                            }`}
                                    >
                                        {charInfo.char}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Step Explanation Panel */}
                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                            📝 Current Step Explanation
                        </h3>
                        <div className={`p-4 rounded-xl text-lg font-medium min-h-[60px] flex items-center ${result === 'balanced'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : result === 'unbalanced'
                                ? 'bg-red-500/20 text-red-500'
                                : isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'
                            }`}>
                            {stepMessage}
                        </div>
                    </div>

                    {/* Result Banner */}
                    {result && (
                        <div className={`p-6 rounded-2xl text-center text-2xl font-bold animate-pulse ${result === 'balanced'
                            ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500'
                            : 'bg-red-500/20 border-2 border-red-500 text-red-500'
                            }`}>
                            {result === 'balanced' ? '✅ Expression is Balanced' : '❌ Expression is Not Balanced'}
                        </div>
                    )}
                </div>

                {/* Stack Visualization */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                        📚 Stack
                    </h3>
                    <div className={`flex flex-col-reverse items-center gap-2 min-h-[300px] justify-end p-4 rounded-xl border border-dashed relative ${isDark ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-300'}`}>
                        {/* Bottom indicator */}
                        <div className="w-full h-2 bg-gradient-to-r from-sky-500/50 to-emerald-500/50 rounded-full" />
                        <span className={`text-base font-semibold absolute bottom-1 ${isDark ? 'text-white' : 'text-black'}`}>
                            BOTTOM
                        </span>

                        {stack.length === 0 && !animatingPush && (
                            <p className={`text-lg font-medium absolute top-1/2 -translate-y-1/2 ${isDark ? 'text-white' : 'text-black'}`}>
                                Stack is empty
                            </p>
                        )}

                        {stack.map((item, idx) => (
                            <div
                                key={`${item.index}-${item.char}`}
                                className={`w-16 h-16 rounded-xl flex items-center justify-center font-mono font-bold text-2xl shadow-lg transition-all duration-300 ${idx === stack.length - 1
                                    ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white ring-2 ring-sky-400/50'
                                    : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                                    } ${animatingPop && animatingPop.index === item.index ? 'opacity-0 -translate-y-4' : ''}`}
                            >
                                {item.char}
                                {idx === stack.length - 1 && (
                                    <span className="absolute -right-12 text-sm text-sky-500 font-semibold">
                                        ← TOP
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Animating push element */}
                        {animatingPush && (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-mono font-bold text-2xl flex items-center justify-center shadow-lg animate-bounce">
                                {animatingPush.char}
                            </div>
                        )}
                    </div>

                    {/* Stack Size */}
                    <div className={`mt-4 text-center text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        Stack Size: <span className="text-sky-500 font-bold">{stack.length}</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className={`mt-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    How It Works:
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <li><span className="text-sky-500 font-bold">1.</span> Enter an expression containing brackets and click "Visualize"</li>
                    <li><span className="text-sky-500 font-bold">2.</span> Opening brackets <code className="text-emerald-500">(, {'{'}, [</code> are <strong className="text-emerald-500">pushed</strong> onto the stack</li>
                    <li><span className="text-sky-500 font-bold">3.</span> Closing brackets <code className="text-purple-500">), {'}'}, ]</code> must match the top of stack to <strong className="text-purple-500">pop</strong></li>
                    <li><span className="text-sky-500 font-bold">4.</span> If all brackets match and stack is empty → <strong className="text-emerald-500">Balanced!</strong></li>
                </ul>
            </div>
        </div>
    );
};

export default ParenthesesMatcher;
