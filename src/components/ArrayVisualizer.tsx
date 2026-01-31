import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface ArrayElement {
    id: number;
    value: number;
    isHighlighted: boolean;
    isAnimating: boolean;
    animationType?: 'insert' | 'delete' | 'update' | 'search' | 'shift';
}

const ArrayVisualizer = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [array, setArray] = useState<ArrayElement[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [indexInput, setIndexInput] = useState('');
    const [valueInput, setValueInput] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [message, setMessage] = useState('Enter numbers separated by spaces and click "Create Array"');
    const [isAnimating, setIsAnimating] = useState(false);
    const [foundIndex, setFoundIndex] = useState<number | null>(null);

    const idCounter = useRef(0);
    const timeoutRef = useRef<number | null>(null);

    const ANIMATION_DELAY = 500;

    const showMessage = useCallback((msg: string) => {
        setMessage(msg);
    }, []);

    // Create array from input
    const handleCreateArray = useCallback(() => {
        if (!inputValue.trim()) {
            showMessage('⚠️ Please enter numbers separated by spaces.');
            return;
        }

        const numbers = inputValue.trim().split(/\s+/).map(Number);

        if (numbers.some(isNaN)) {
            showMessage('⚠️ Invalid input. Please enter valid numbers.');
            return;
        }

        const newArray: ArrayElement[] = numbers.map((value) => ({
            id: idCounter.current++,
            value,
            isHighlighted: false,
            isAnimating: false
        }));

        setArray(newArray);
        setFoundIndex(null);
        showMessage(`✅ Array created with ${numbers.length} elements.`);
    }, [inputValue, showMessage]);

    // Insert at index
    const handleInsert = useCallback(() => {
        const index = parseInt(indexInput);
        const value = parseInt(valueInput);

        if (isNaN(index) || isNaN(value)) {
            showMessage('⚠️ Please enter valid index and value.');
            return;
        }

        if (index < 0 || index > array.length) {
            showMessage(`⚠️ Index out of bounds. Valid range: 0 to ${array.length}`);
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        // Highlight elements that will shift
        setArray(prev => prev.map((el, i) => ({
            ...el,
            isHighlighted: i >= index,
            animationType: i >= index ? 'shift' : undefined
        })));

        showMessage(`Inserting ${value} at index ${index}. Shifting elements...`);

        timeoutRef.current = setTimeout(() => {
            const newElement: ArrayElement = {
                id: idCounter.current++,
                value,
                isHighlighted: true,
                isAnimating: true,
                animationType: 'insert'
            };

            setArray(prev => {
                const newArray = [...prev];
                newArray.splice(index, 0, newElement);
                return newArray.map((el, i) => ({
                    ...el,
                    isHighlighted: i === index,
                    isAnimating: i === index,
                    animationType: i === index ? 'insert' : undefined
                }));
            });

            showMessage(`✅ Inserted ${value} at index ${index}.`);

            timeoutRef.current = setTimeout(() => {
                setArray(prev => prev.map(el => ({
                    ...el,
                    isHighlighted: false,
                    isAnimating: false,
                    animationType: undefined
                })));
                setIsAnimating(false);
            }, ANIMATION_DELAY);
        }, ANIMATION_DELAY);

        setIndexInput('');
        setValueInput('');
    }, [array.length, indexInput, valueInput, showMessage]);

    // Delete at index
    const handleDelete = useCallback(() => {
        const index = parseInt(indexInput);

        if (isNaN(index)) {
            showMessage('⚠️ Please enter a valid index.');
            return;
        }

        if (index < 0 || index >= array.length) {
            showMessage(`⚠️ Index out of bounds. Valid range: 0 to ${array.length - 1}`);
            return;
        }

        if (array.length === 0) {
            showMessage('⚠️ Array is empty!');
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        // Highlight element to be deleted
        setArray(prev => prev.map((el, i) => ({
            ...el,
            isHighlighted: i === index,
            animationType: i === index ? 'delete' : undefined
        })));

        const deletedValue = array[index].value;
        showMessage(`Deleting element ${deletedValue} at index ${index}...`);

        timeoutRef.current = setTimeout(() => {
            setArray(prev => {
                const newArray = prev.filter((_, i) => i !== index);
                return newArray.map((el, i) => ({
                    ...el,
                    isHighlighted: i >= index,
                    animationType: i >= index ? 'shift' : undefined
                }));
            });

            showMessage(`✅ Deleted ${deletedValue} from index ${index}. Elements shifted.`);

            timeoutRef.current = setTimeout(() => {
                setArray(prev => prev.map(el => ({
                    ...el,
                    isHighlighted: false,
                    isAnimating: false,
                    animationType: undefined
                })));
                setIsAnimating(false);
            }, ANIMATION_DELAY);
        }, ANIMATION_DELAY);

        setIndexInput('');
    }, [array, indexInput, showMessage]);

    // Update at index
    const handleUpdate = useCallback(() => {
        const index = parseInt(indexInput);
        const value = parseInt(valueInput);

        if (isNaN(index) || isNaN(value)) {
            showMessage('⚠️ Please enter valid index and value.');
            return;
        }

        if (index < 0 || index >= array.length) {
            showMessage(`⚠️ Index out of bounds. Valid range: 0 to ${array.length - 1}`);
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        const oldValue = array[index].value;

        // Highlight element being updated
        setArray(prev => prev.map((el, i) => ({
            ...el,
            isHighlighted: i === index,
            animationType: i === index ? 'update' : undefined
        })));

        showMessage(`Updating index ${index}: ${oldValue} → ${value}...`);

        timeoutRef.current = setTimeout(() => {
            setArray(prev => prev.map((el, i) => ({
                ...el,
                value: i === index ? value : el.value,
                isHighlighted: i === index,
                isAnimating: i === index,
                animationType: i === index ? 'update' : undefined
            })));

            showMessage(`✅ Updated index ${index}: ${oldValue} → ${value}`);

            timeoutRef.current = setTimeout(() => {
                setArray(prev => prev.map(el => ({
                    ...el,
                    isHighlighted: false,
                    isAnimating: false,
                    animationType: undefined
                })));
                setIsAnimating(false);
            }, ANIMATION_DELAY);
        }, ANIMATION_DELAY);

        setIndexInput('');
        setValueInput('');
    }, [array, indexInput, valueInput, showMessage]);

    // Search element
    const handleSearch = useCallback(() => {
        const value = parseInt(searchInput);

        if (isNaN(value)) {
            showMessage('⚠️ Please enter a valid number to search.');
            return;
        }

        if (array.length === 0) {
            showMessage('⚠️ Array is empty!');
            return;
        }

        setIsAnimating(true);
        setFoundIndex(null);

        let currentIndex = 0;

        const searchStep = () => {
            if (currentIndex >= array.length) {
                setArray(prev => prev.map(el => ({
                    ...el,
                    isHighlighted: false,
                    animationType: undefined
                })));
                showMessage(`❌ Element ${value} not found in the array.`);
                setIsAnimating(false);
                return;
            }

            // Highlight current element being checked
            setArray(prev => prev.map((el, i) => ({
                ...el,
                isHighlighted: i === currentIndex,
                animationType: i === currentIndex ? 'search' : undefined
            })));

            showMessage(`Searching... Checking index ${currentIndex}: ${array[currentIndex].value}`);

            timeoutRef.current = setTimeout(() => {
                if (array[currentIndex].value === value) {
                    setArray(prev => prev.map((el, i) => ({
                        ...el,
                        isHighlighted: i === currentIndex,
                        animationType: i === currentIndex ? 'search' : undefined
                    })));
                    setFoundIndex(currentIndex);
                    showMessage(`✅ Found ${value} at index ${currentIndex}!`);
                    setIsAnimating(false);
                    return;
                }

                currentIndex++;
                searchStep();
            }, ANIMATION_DELAY);
        };

        searchStep();
        setSearchInput('');
    }, [array, searchInput, showMessage]);

    // Reset
    const handleReset = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setArray([]);
        setInputValue('');
        setIndexInput('');
        setValueInput('');
        setSearchInput('');
        setFoundIndex(null);
        setIsAnimating(false);
        showMessage('Enter numbers separated by spaces and click "Create Array"');
    }, [showMessage]);

    // Get element style based on state
    const getElementStyle = (element: ArrayElement, index: number) => {
        if (foundIndex === index) {
            return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-4 ring-emerald-400/50 scale-110';
        }
        if (element.animationType === 'delete') {
            return 'bg-red-500 text-white ring-4 ring-red-400/50 scale-90 opacity-50';
        }
        if (element.animationType === 'insert') {
            return 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white ring-4 ring-sky-400/50 scale-110';
        }
        if (element.animationType === 'update') {
            return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-4 ring-purple-400/50 scale-105';
        }
        if (element.animationType === 'search') {
            return 'bg-yellow-500 text-black ring-4 ring-yellow-400/50';
        }
        if (element.animationType === 'shift') {
            return isDark
                ? 'bg-orange-500/30 text-orange-400 ring-2 ring-orange-400/50'
                : 'bg-orange-100 text-orange-700 ring-2 ring-orange-300';
        }
        if (element.isHighlighted) {
            return 'bg-sky-500 text-white ring-2 ring-sky-400/50';
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
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400">
                        📊 Array Visualizer
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

            {/* Create Array Section */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Create Array
                </h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter numbers (e.g., 10 20 30 40 50)"
                        disabled={isAnimating}
                        className={`flex-1 px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all ${isDark
                            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                            : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                            } disabled:opacity-50`}
                        onKeyDown={(e) => e.key === 'Enter' && !isAnimating && handleCreateArray()}
                    />
                    <button
                        onClick={handleCreateArray}
                        disabled={isAnimating}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Array
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
                    {/* Insert/Update Inputs */}
                    <div className="flex flex-col gap-2">
                        <input
                            type="number"
                            value={indexInput}
                            onChange={(e) => setIndexInput(e.target.value)}
                            placeholder="Index"
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                        <input
                            type="number"
                            value={valueInput}
                            onChange={(e) => setValueInput(e.target.value)}
                            placeholder="Value"
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                    </div>

                    {/* Insert/Delete/Update Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleInsert}
                            disabled={isAnimating || array.length === 0 && !valueInput}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Insert at Index
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isAnimating || array.length === 0}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Delete at Index
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleUpdate}
                            disabled={isAnimating || array.length === 0}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Update at Index
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-2">
                        <input
                            type="number"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search value"
                            disabled={isAnimating}
                            className={`px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark
                                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50'
                                : 'bg-gray-50 border border-gray-300 text-black placeholder:text-gray-400'
                                } disabled:opacity-50`}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isAnimating || array.length === 0}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all hover:scale-105 ${isDark
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Search Element
                        </button>
                    </div>
                </div>
            </div>

            {/* Array Display */}
            <div className={`mb-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    Array Visualization
                </h2>
                <div className="flex flex-wrap gap-4 min-h-[120px] items-center justify-center">
                    {array.length === 0 ? (
                        <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                            Array is empty. Create an array to visualize.
                        </p>
                    ) : (
                        array.map((element, index) => (
                            <div key={element.id} className="flex flex-col items-center gap-2">
                                <div
                                    className={`w-16 h-16 rounded-xl flex items-center justify-center font-mono font-bold text-xl transition-all duration-300 ${getElementStyle(element, index)}`}
                                >
                                    {element.value}
                                </div>
                                <span className={`text-sm font-semibold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                                    [{index}]
                                </span>
                            </div>
                        ))
                    )}
                </div>
                {array.length > 0 && (
                    <div className={`mt-4 text-center text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        Array Length: <span className="text-sky-500">{array.length}</span>
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
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    🧩 Visualize Using Problems
                </h2>
                <Link
                    to="/array/problems"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                    Two Sum Problem →
                </Link>
            </div>

            {/* Legend */}
            <div className={`mt-6 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                    How It Works:
                </h3>
                <ul className={`text-lg font-medium space-y-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <li><span className="text-sky-500 font-bold">1.</span> Enter numbers separated by spaces and click "Create Array"</li>
                    <li><span className="text-sky-500 font-bold">2.</span> Use operations to <span className="text-emerald-500">Insert</span>, <span className="text-red-500">Delete</span>, <span className="text-purple-500">Update</span>, or <span className="text-yellow-500">Search</span></li>
                    <li><span className="text-sky-500 font-bold">3.</span> Watch elements animate and shift to understand array behavior</li>
                    <li><span className="text-sky-500 font-bold">4.</span> Indexes are shown below each element for reference</li>
                </ul>
            </div>
        </div>
    );
};

export default ArrayVisualizer;
