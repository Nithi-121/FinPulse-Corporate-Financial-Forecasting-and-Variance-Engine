import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import { Layout } from './components/Layout';
import { Overview }        from './pages/Overview';
import { Forecasts }       from './pages/Forecasts';
import { Anomalies }       from './pages/Anomalies';
import { ModelComparison } from './pages/ModelComparison';
import { DataQuality }     from './pages/DataQuality';
import { About }           from './pages/About';

const ease: Easing = 'easeOut';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease }}
      >
        <Routes location={location}>
          <Route path="/"          element={<Overview />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/models"    element={<ModelComparison />} />
          <Route path="/quality"   element={<DataQuality />} />
          <Route path="/about"     element={<About />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <p className="text-5xl font-bold text-white mb-3">404</p>
              <p className="text-gray-400">This page doesn't exist in the FinPulse platform.</p>
            </div>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}

export default App;
