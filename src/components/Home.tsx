import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Navbar from './Navbar';
import { LayoutGrid, ListOrdered, Layers, GitCommitHorizontal, ArrowRight } from 'lucide-react';

const Home = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const ALGORITHMS = [
        {
            name: 'Array',
            description: 'Visualize Array operations and Two Sum problem.',
            path: '/array',
            color: 'from-sky-500 to-cyan-400',
            icon: LayoutGrid
        },
        {
            name: 'Queue',
            description: 'Visualize Queue operations and Binary Numbers generation.',
            path: '/queue',
            color: 'from-blue-500 to-indigo-400',
            icon: ListOrdered
        },
        {
            name: 'Stack',
            description: 'Learn Stack operations and Parentheses Matching.',
            path: '/stack',
            color: 'from-slate-500 to-slate-600',
            icon: Layers
        },
        {
            name: 'Linked List',
            description: 'Visualize insertions, deletions, and Cycle Detection.',
            path: '/linked-list',
            color: 'from-teal-500 to-emerald-400',
            icon: GitCommitHorizontal
        },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
            ? 'bg-deep-black text-platinum'
            : 'bg-gray-50 text-gray-900'
            }`}>
            {/* Navigation */}
            <Navbar />

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
                <div className="text-center space-y-8 mb-24">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium animate-pulse ${isDark
                        ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                        : 'border-sky-500/50 bg-sky-50 text-sky-600'
                        }`}>
                        New: Cycle Detection Visualizer
                    </div>
                    <h1 className={`text-6xl md:text-8xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        Visualize <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-500 to-teal-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">Algorithms</span> <br />
                        in Real-Time.
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-platinum/60' : 'text-gray-600'
                        }`}>
                        Beautifully crafted visualizations for complex data structures and algorithms.
                        Designed for students, teachers, and developers.
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                        <Link to="/algorithms" className={`px-8 py-4 rounded-xl border font-bold transition-colors ${isDark
                            ? 'border-white/20 text-platinum hover:bg-white/5 hover:border-sky-500/50'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-sky-500/50'
                            }`}>
                            View Algorithms
                        </Link>
                    </div>
                </div>

                {/* Algorithm Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ALGORITHMS.map((algo) => {
                        const Icon = algo.icon;
                        return (
                            <Link key={algo.name} to={algo.path} className={`group relative p-8 rounded-3xl border transition-all cursor-pointer overflow-hidden backdrop-blur-md ${isDark
                                ? 'border-white/10 bg-white/5 hover:bg-white/10'
                                : 'border-white/40 bg-white/60 hover:bg-white/80 shadow-lg hover:shadow-xl'
                                }`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${algo.color} opacity-10 group-hover:opacity-20 blur-3xl transition-opacity`} />
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${algo.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={28} className="text-white" strokeWidth={2.5} />
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{algo.name}</h3>
                                <p className={`text-sm mb-6 ${isDark ? 'text-platinum/60' : 'text-gray-600'}`}>{algo.description}</p>
                                <div className="mt-auto flex items-center text-sm font-semibold text-sky-500">
                                    Visualize <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>

            {/* Footer */}
            <footer className={`border-t px-8 py-12 text-center text-sm ${isDark ? 'border-white/10 text-platinum/40' : 'border-gray-200 text-gray-500'
                }`}>
                <p>&copy; 2026 AlgoCanvas. Built for the future of DSA learning.</p>
            </footer>
        </div>
    );
};

export default Home;
