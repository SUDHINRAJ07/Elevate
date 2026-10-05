import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/admin_common/Sidebar.jsx';
import { Navbar } from '../components/admin_common/Navbar.jsx';
import { apiRequest } from '../api/client.js';
import { notificationService } from '../services/notificationService.js';

// Admin Sub-Views
import { AdminDashboard } from './admin/AdminDashboard.jsx';
import { AdminCalendar } from './admin/AdminCalendar.jsx';
import { AdminSchedules } from './admin/AdminSchedules.jsx';
import { AdminBookings } from './admin/AdminBookings.jsx';
import { AdminHistory } from './admin/AdminHistory.jsx';
import { AdminSalesMeetings } from './admin/AdminSalesMeetings.jsx';
import { AdminUsers } from './admin/AdminUsers.jsx';
import { AdminClients } from './admin/AdminClients.jsx';
import { AdminNotifications } from './admin/AdminNotifications.jsx';
import { AdminSettings } from './admin/AdminSettings.jsx';
import { AdminLogin } from './admin/AdminLogin.jsx';

export default function AdminPage({ onSwitchPortal, onOpenClient }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return !!localStorage.getItem('gentize_admin_auth');
    } catch {
      return false;
    }
  });

  const [tab, setTab] = useState('dashboard');
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [bookingsFilter, setBookingsFilter] = useState('ALL');
  const [targetBookingId, setTargetBookingId] = useState(null);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const notifiedIdsRef = useRef(new Set());

  const handleLoginSuccess = (adminData) => {
    try {
      localStorage.setItem('gentize_admin_auth', JSON.stringify(adminData));
      localStorage.setItem('gentize_user', JSON.stringify(adminData));
    } catch (_) {}
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem('gentize_admin_auth');
    } catch (_) {}
    setIsAdminAuthenticated(false);
  };

  const checkAdminNotifications = async () => {
    try {
      const res = await apiRequest('/notifications?target=MD');
      const notifs = Array.isArray(res) ? res : (res?.notifications || []);
      const unread = notifs.filter(n => !n.isRead && !n.is_read);
      setAdminUnreadCount(unread.length);

      // Trigger native notification for new incoming alerts
      unread.forEach(n => {
        if (!notifiedIdsRef.current.has(n.id)) {
          notifiedIdsRef.current.add(n.id);
          notificationService.scheduleLocalDeviceNotification({
            id: n.id,
            title: n.title || 'New Booking Alert 🔔',
            body: n.message || n.body || 'You have received a new booking update.',
          });
        }
      });
    } catch (_) {}
  };

  useEffect(() => {
    checkAdminNotifications();
    const interval = setInterval(checkAdminNotifications, 4000);
    const handleRead = () => {
      setAdminUnreadCount(0);
      try { localStorage.setItem('gentize_admin_notif_last_read', new Date().toISOString()); } catch (_) {}
    };
    window.addEventListener('gentize_notifications_read', handleRead);
    window.addEventListener('gentize_notifications_updated', checkAdminNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('gentize_notifications_read', handleRead);
      window.removeEventListener('gentize_notifications_updated', checkAdminNotifications);
    };
  }, []);

  useEffect(() => {
    if (tab === 'notifications') {
      apiRequest('/notifications/read-all', { method: 'POST' }).catch(() => {});
      try { localStorage.setItem('gentize_admin_notif_last_read', new Date().toISOString()); } catch (_) {}
      setAdminUnreadCount(0);
    }
  }, [tab]);

  const handleNavigateToBooking = (bookingId, initialFilter = 'PENDING') => {
    setBookingsFilter(initialFilter);
    setTargetBookingId(bookingId);
    setTab('bookings');
  };

  if (!isAdminAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onSwitchPortal={onSwitchPortal}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900">
      {/* Full-Height Left Sidebar */}
      <Sidebar
        currentTab={tab}
        setTab={setTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenClientBooking={onOpenClient || (() => onSwitchPortal && onSwitchPortal('client'))}
        unreadCount={adminUnreadCount}
        onSwitchPortal={onSwitchPortal}
        onLogout={handleAdminLogout}
      />

      {/* Main Content Area with Top Navbar */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          activeTab={tab}
          setActiveTab={setTab}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          unreadCount={adminUnreadCount}
          setUnreadCount={setAdminUnreadCount}
          onSwitchPortal={onSwitchPortal}
          onLogout={handleAdminLogout}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {tab === 'dashboard' && (
            <AdminDashboard
              target="MD"
              setTab={setTab}
              onOpenCreateSchedule={() => {
                setTab('schedules');
                setIsCreateScheduleOpen(true);
              }}
            />
          )}
          {tab === 'calendar' && (
            <AdminCalendar
              setTab={setTab}
              onOpenCreateSchedule={() => {
                setTab('schedules');
                setIsCreateScheduleOpen(true);
              }}
            />
          )}
          {tab === 'schedules' && (
            <AdminSchedules
              isCreateOpen={isCreateScheduleOpen}
              setIsCreateOpen={setIsCreateScheduleOpen}
            />
          )}
          {tab === 'bookings' && (
            <AdminBookings
              initialFilter={bookingsFilter}
              targetBookingId={targetBookingId}
            />
          )}
          {tab === 'history' && <AdminHistory />}
          {tab === 'sales-meetings' && <AdminSalesMeetings />}
          {tab === 'users' && <AdminUsers />}
          {tab === 'clients' && <AdminClients />}
          {tab === 'notifications' && (
            <AdminNotifications
              setTab={setTab}
              onNavigateToBooking={handleNavigateToBooking}
            />
          )}
          {tab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}
