import React, { useState, useEffect } from 'react';
import NewsPage from './pages/NewsPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { PublicBookingPage } from './pages/client/PublicBookingPage.jsx';
import SalesPortal from './pages/sales/SalesPortal.jsx';
import { notificationService } from './services/notificationService.js';
import OfflineBanner from './components/common/OfflineBanner.jsx';
import { autoDiscoverServer } from './services/discoveryService.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

export default function App() {
  // Support URL query ?portal=sales, ?portal=admin, or ?mode=book for direct deep linking
  const [currentPortal, setCurrentPortal] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'sales') return 'sales';
    if (params.get('portal') === 'news') return 'news';
    if (params.get('portal') === 'admin' || window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    if (params.get('mode') === 'book' || window.location.pathname.startsWith('/book')) {
      return 'client';
    }
    return 'user';
  });

  useEffect(() => {
    const syncPortal = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentPortal(
        params.get('portal') === 'sales'
          ? 'sales'
          : params.get('portal') === 'news'
          ? 'news'
          : params.get('portal') === 'admin' || window.location.pathname.startsWith('/admin')
          ? 'admin'
          : params.get('mode') === 'book' || window.location.pathname.startsWith('/book')
          ? 'client'
          : 'user'
      );
    };
    window.addEventListener('popstate', syncPortal);

    // Initialize native notification channel & permission prompt on app startup
    notificationService.ensureNotificationChannel().catch(() => {});
    notificationService.requestDevicePermission().catch(() => {});

    // Automatically locate and connect to laptop backend on any Wi-Fi
    autoDiscoverServer().catch(() => {});

    return () => window.removeEventListener('popstate', syncPortal);
  }, []);

  // Sync state with URL without full page reload
  const handleSwitchPortal = (portal) => {
    setCurrentPortal(portal);
    const url = new URL(window.location.href);
    if (portal === 'sales') {
      url.searchParams.set('portal', 'sales');
      url.searchParams.delete('mode');
    } else if (portal === 'news') {
      url.searchParams.set('portal', 'news');
      url.searchParams.delete('mode');
    } else if (portal === 'admin') {
      url.searchParams.set('portal', 'admin');
      url.searchParams.delete('mode');
    } else if (portal === 'client') {
      url.searchParams.set('mode', 'book');
      url.searchParams.delete('portal');
    } else {
      url.searchParams.delete('portal');
      url.searchParams.delete('mode');
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-[#F8FAFC]">
        <OfflineBanner />
        {currentPortal === 'sales' && (
          <SalesPortal
            onSwitchPortal={handleSwitchPortal}
          />
        )}
        {currentPortal === 'news' && (
          <NewsPage
            onSwitchPortal={handleSwitchPortal}
          />
        )}
        {/* Render Active Portal View */}
        {currentPortal === 'user' && (
          <CalendarPage
            onSwitchPortal={handleSwitchPortal}
          />
        )}

        {currentPortal === 'admin' && (
          <AdminPage
            onSwitchPortal={handleSwitchPortal}
            onOpenClient={() => handleSwitchPortal('client')}
          />
        )}

        {currentPortal === 'client' && (
          <PublicBookingPage
            onBackToPortal={() => handleSwitchPortal('user')}
            onSwitchPortal={handleSwitchPortal}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}



