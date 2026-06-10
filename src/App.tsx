/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAnalystModal from './components/AIAnalystModal';

// Subpages
import Home from './pages/Home';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Fixtures from './pages/Fixtures';
import Compare from './pages/Compare';
import Standings from './pages/Standings';
import Analytics from './pages/Analytics';
import Search from './pages/Search';

import { FlagStyleProvider } from './context/FlagStyleContext';

function AppContent() {
  const location = useLocation();
  const [isAnalystOpen, setIsAnalystOpen] = useState(false);
  const [analystInitialPrompt, setAnalystInitialPrompt] = useState<string | undefined>(undefined);

  const handleOpenAnalystWithPrompt = (prompt?: string) => {
    setAnalystInitialPrompt(prompt);
    setIsAnalystOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07101E] text-[#E8EDF5] font-sans antialiased overflow-x-hidden selection:bg-accent selection:text-primary">
      
      {/* Navigation Bar */}
      <Navbar onOpenAnalyst={() => handleOpenAnalystWithPrompt()} />

      {/* Content Viewport */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupLetter" element={<GroupDetail />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/teams/:countrySlug" element={<TeamDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating AI Analyst Side Panel Drawer */}
      <AIAnalystModal
        isOpen={isAnalystOpen}
        onClose={() => {
          setIsAnalystOpen(false);
          setAnalystInitialPrompt(undefined);
        }}
        initialPrompt={analystInitialPrompt}
      />

    </div>
  );
}

export default function App() {
  return (
    <Router>
      <FlagStyleProvider>
        <AppContent />
      </FlagStyleProvider>
    </Router>
  );
}
