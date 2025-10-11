import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Search from "./pages/Search.jsx";
import ManagePrograms from "./pages/admin/ManagePrograms.jsx";

import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Overview from "./pages/dashboard/Overview.jsx";
import Trends from "./pages/dashboard/Trends.jsx";
import ApplicationForm from "./pages/dashboard/ApplicationForm.jsx";
import Notifications from "./pages/dashboard/Notifications.jsx";
import SearchQuick from "./pages/dashboard/SearchQuick.jsx";
import Payments from "./pages/dashboard/Payments.jsx";
import Appointments from "./pages/dashboard/Appointments.jsx";
import Certificates from "./pages/dashboard/Certificates.jsx";

import ConsultantLayout from "./layouts/ConsultantLayout.jsx";
import ConsultantOverview from "./pages/consultant/Overview.jsx";
import ConsultantSchedule from "./pages/consultant/Schedule.jsx";
import ConsultantMeetings from "./pages/consultant/Meetings.jsx";
import ConsultantNotes from "./pages/consultant/Notes.jsx";
import ConsultantCandidates from "./pages/consultant/Candidates.jsx";

import StaffLayout from "./layouts/StaffLayout.jsx";
import StaffRequests from "./pages/staff/Requests.jsx";
import StaffAssign from "./pages/staff/Assign.jsx";
import StaffCalendar from "./pages/staff/Calendar.jsx";
import StaffNotifications from "./pages/staff/Notifications.jsx";
import StaffExperts from "./pages/staff/Consultants.jsx";

import ManagerLayout from "./layouts/ManagerLayout.jsx";
import ManagerOverview from "./pages/manager/Overview.jsx";
import ManagerUsers from "./pages/manager/Users.jsx";
import ManagerLogs from "./pages/manager/Logs.jsx";
import ManagerSettings from "./pages/manager/Settings.jsx";
import ManagerReports from "./pages/manager/Reports.jsx";

export default function App() {
  const location = useLocation();
  const hideGlobalNav = ["/dashboard", "/consultant", "/staff", "/manager"].some(p =>
    location.pathname.startsWith(p)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {!hideGlobalNav && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/admin/programs" element={<ManagePrograms />} />

          {/* User Dashboard - Chỉ dành cho Thành viên */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Thành viên']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="trends" element={<Trends />} />
            <Route path="application" element={<ApplicationForm />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="search" element={<SearchQuick />} />
            <Route path="payments" element={<Payments />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="certificates" element={<Certificates />} />
          </Route>

          {/* Consultant - Chỉ dành cho Tư vấn viên */}
          <Route path="/consultant" element={
            <ProtectedRoute allowedRoles={['Tư vấn viên']}>
              <ConsultantLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ConsultantOverview />} />
            <Route path="schedule" element={<ConsultantSchedule />} />
            <Route path="meetings" element={<ConsultantMeetings />} />
            <Route path="notes" element={<ConsultantNotes />} />
            <Route path="candidates" element={<ConsultantCandidates />} />
          </Route>

          {/* Staff - Chỉ dành cho Người phụ trách */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['Người phụ trách']}>
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StaffRequests />} />
            <Route path="assign" element={<StaffAssign />} />
            <Route path="calendar" element={<StaffCalendar />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route path="consultants" element={<StaffExperts />} />
          </Route>

          {/* Manager - Chỉ dành cho Admin */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManagerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ManagerOverview />} />
            <Route path="users" element={<ManagerUsers />} />
            <Route path="logs" element={<ManagerLogs />} />
            <Route path="settings" element={<ManagerSettings />} />
            <Route path="reports" element={<ManagerReports />} />
          </Route>
        </Routes>
      </main>
      {!hideGlobalNav && <Footer />}
    </div>
  );
}
