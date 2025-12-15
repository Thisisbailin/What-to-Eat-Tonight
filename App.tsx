import React, { useState, useEffect } from 'react';
import { AppState, AppView, UserProfile, DayLog } from './types';
import { Login } from './views/Login';
import { Onboarding } from './views/Onboarding';
import { Dashboard } from './views/Dashboard';

// Helper to get today's date YYYY-MM-DD
const getToday = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    // Load from local storage if available
    const saved = localStorage.getItem('appState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure date is updated
      return { ...parsed, currentDate: getToday() };
    }
    return {
      view: AppView.LOGIN,
      user: null,
      logs: {},
      currentDate: getToday()
    };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('appState', JSON.stringify(appState));
  }, [appState]);

  const updateLog = (date: string, log: DayLog) => {
    setAppState(prev => ({
      ...prev,
      logs: { ...prev.logs, [date]: log }
    }));
  };

  const updateUser = (user: UserProfile) => {
    setAppState(prev => ({
        ...prev,
        user
    }));
  }

  const handleLoginSuccess = () => {
    // Check if user has profile, if not go to onboarding
    if (appState.user) {
      setAppState(prev => ({ ...prev, view: AppView.DASHBOARD }));
    } else {
      setAppState(prev => ({ ...prev, view: AppView.ONBOARDING_PHASE_1 }));
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setAppState(prev => ({
      ...prev,
      user: profile,
      view: AppView.DASHBOARD
    }));
  };

  const setView = (view: AppView) => {
    setAppState(prev => ({ ...prev, view }));
  };

  return (
    <>
      {appState.view === AppView.LOGIN && (
        <Login onLogin={handleLoginSuccess} />
      )}
      
      {(appState.view === AppView.ONBOARDING_PHASE_1 || appState.view === AppView.ONBOARDING_PHASE_2) && (
        <Onboarding 
          currentPhase={appState.view}
          setView={setView}
          onComplete={handleOnboardingComplete} 
        />
      )}

      {appState.view === AppView.DASHBOARD && (
        <Dashboard 
          state={appState} 
          updateLog={updateLog} 
          updateUser={updateUser}
        />
      )}
    </>
  );
};

export default App;