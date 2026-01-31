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
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
