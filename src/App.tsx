import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import Algorithms from './components/Algorithms';
import ArrayVisualizer from './components/ArrayVisualizer';
import TwoSumVisualizer from './components/TwoSumVisualizer';
import StackVisualizer from './components/StackVisualizer';
import ParenthesesMatcher from './components/ParenthesesMatcher';
import QueueVisualizer from './components/QueueVisualizer';
import BinaryNumbersVisualizer from './components/BinaryNumbersVisualizer';
import LinkedListVisualizer from './components/LinkedListVisualizer';
import CycleDetectionVisualizer from './components/CycleDetectionVisualizer';
import TreeVisualizer from './components/TreeVisualizer';
import TreeTraversalVisualizer from './components/TreeTraversalVisualizer';
import AVLTreeVisualizer from './components/AVLTreeVisualizer';
import AVLRotationVisualizer from './components/AVLRotationVisualizer';
import GraphVisualizer from './components/GraphVisualizer';
import GraphTraversalVisualizer from './components/GraphTraversalVisualizer';
import BFSDFSVisualizer from './components/BFSDFSVisualizer';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/algorithms" element={<Algorithms />} />
            {/* Array Module */}
            <Route path="/array" element={<ArrayVisualizer />} />
            <Route path="/array/problems" element={<TwoSumVisualizer />} />
            {/* Stack Module */}
            <Route path="/stack" element={<StackVisualizer />} />
            <Route path="/stack/problems" element={<ParenthesesMatcher />} />
            {/* Queue Module */}
            <Route path="/queue" element={<QueueVisualizer />} />
            <Route path="/queue/problems" element={<BinaryNumbersVisualizer />} />
            {/* Linked List Module */}
            <Route path="/linked-list" element={<LinkedListVisualizer />} />
            <Route path="/linked-list/problems" element={<CycleDetectionVisualizer />} />
            {/* Tree Module */}
            <Route path="/tree" element={<TreeVisualizer />} />
            <Route path="/tree/problems" element={<TreeTraversalVisualizer />} />
            {/* AVL Module */}
            <Route path="/avl" element={<AVLTreeVisualizer />} />
            <Route path="/avl/problems" element={<AVLRotationVisualizer />} />
            {/* Graph Module */}
            <Route path="/graph" element={<GraphVisualizer />} />
            <Route path="/graph/problems" element={<GraphTraversalVisualizer />} />
            {/* BFS/DFS Traversals Module */}
            <Route path="/traversals" element={<BFSDFSVisualizer />} />
            {/* Auth */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
