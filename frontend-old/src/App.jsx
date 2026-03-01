import { useState } from 'react';
import { StudentProvider } from './context/StudentContext';
import LandingPage   from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import LearnPage     from './pages/LearnPage';
import './index.css';

// Pages
const PAGES = { LANDING: 'landing', DASHBOARD: 'dashboard', LEARN: 'learn' };

export default function App() {
  const [page, setPage] = useState(PAGES.LANDING);

  return (
    <StudentProvider>
      <div id="app-root" aria-label="EduVoice — AI Teacher for Tamil Nadu Students">
        {page === PAGES.LANDING && (
          <LandingPage onDone={() => setPage(PAGES.DASHBOARD)} />
        )}
        {page === PAGES.DASHBOARD && (
          <DashboardPage onStartLesson={() => setPage(PAGES.LEARN)} />
        )}
        {page === PAGES.LEARN && (
          <LearnPage onBack={() => setPage(PAGES.DASHBOARD)} />
        )}
      </div>
    </StudentProvider>
  );
}
