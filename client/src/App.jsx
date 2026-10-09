import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Nutrition from './pages/Nutrition';
import BMI from './pages/BMI';
import Progress from './pages/Progress';
import Equipment from './pages/Equipment';
import Trainer from './pages/Trainer';
import Membership from './pages/Membership';
import Supplements from './pages/Supplements';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import GymAttendance from './pages/GymAttendance';
import GymCheckInPage from './pages/GymCheckInPage';

function MainRouter() {
  const { user, loading } = useAuth();
  
  // Detect if opened from a QR code scan (e.g., /gym/check-in?gym=FITCOMMIT-GYM-001)
  const getInitialPage = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path.includes('/gym/check-in') || search.includes('gym=')) {
        return 'gym-check-in';
      }
    }
    return 'landing';
  };

  const [activePage, setActivePage] = useState(getInitialPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user logs in, preserve pending QR checkin or redirect to dashboard
  useEffect(() => {
    if (user) {
      const pending = sessionStorage.getItem('pending_gym_checkin');
      if (pending) {
        setActivePage('gym-check-in');
        return;
      }
      if (activePage === 'landing' || activePage === 'login' || activePage === 'register') {
        setActivePage('dashboard');
      }
    }
  }, [user]);

  // Scroll to top on page switch
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F2F0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            marginBottom: '16px'
          }}>FC</div>
          <div className="label-micro" style={{ letterSpacing: '0.15em' }}>Loading FitCommit...</div>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'landing':
        return <Landing setActivePage={setActivePage} />;
      case 'login':
        return <Login setActivePage={setActivePage} />;
      case 'register':
        return <Register setActivePage={setActivePage} />;
      case 'dashboard':
        return user ? <Dashboard setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'workout':
        return user ? <Workout setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'nutrition':
        return user ? <Nutrition setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'bmi':
        return user ? <BMI setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'progress':
        return user ? <Progress setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'attendance':
      case 'gym':
      case 'availability':
        return user ? <GymAttendance setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'equipment':
        return user ? <Equipment setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'trainer':
        return user ? <Trainer setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'membership':
        return <Membership setActivePage={setActivePage} />;
      case 'supplements':
        return user ? <Supplements setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'notifications':
        return user ? <Notifications setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'profile':
        return user ? <Profile setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'admin':
        return user ? <Admin setActivePage={setActivePage} /> : <Login setActivePage={setActivePage} />;
      case 'gym-check-in':
        return <GymCheckInPage setActivePage={setActivePage} />;
      default:
        return <Landing setActivePage={setActivePage} />;
    }
  };

  const isAuthDashboard = user && !['landing', 'login', 'register', 'gym-check-in'].includes(activePage);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      {isAuthDashboard ? (
        <div className="app-shell">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
          <main className="app-main-content" style={{ flex: 1, minWidth: 0, paddingBottom: '76px' }}>
            {renderCurrentPage()}
          </main>
        </div>
      ) : (
        <main style={{ flex: 1 }}>
          {renderCurrentPage()}
        </main>
      )}

      {isAuthDashboard && (
        <BottomNav 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onOpenMenu={() => setMobileMenuOpen(prev => !prev)} 
        />
      )}

      <Footer setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainRouter />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
