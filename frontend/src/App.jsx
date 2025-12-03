import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./layouts/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Search from "./pages/Search.jsx";
import News from "./pages/News.jsx";
import HistoricScores from "./pages/dashboard/HistoricScores.jsx";
import HistoricScoreDetail from "./pages/dashboard/HistoricScoreDetail.jsx";
import TrendsPage from "./pages/dashboard/TrendsPage.jsx";
import ManagePrograms from "./pages/admin/ManagePrograms.jsx";

import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Overview from "./pages/dashboard/Overview.jsx";
import Trends from "./pages/dashboard/ScoreDistribution.jsx";
import NotificationsCenter from "./pages/dashboard/NotificationsCenter.jsx";
import Profile from "./pages/dashboard/Profile.jsx";
import AccountSecurity from "./pages/dashboard/AccountSecurity.jsx";
import Documents from "./pages/dashboard/Documents.jsx";
import Wishes from "./pages/dashboard/Wishes.jsx";
import Predictions from "./pages/dashboard/Predictions.jsx";
import SearchQuick from "./pages/dashboard/SearchQuick.jsx";
import Payments from "./pages/dashboard/Payments.jsx";
import Appointments from "./pages/dashboard/Appointments.jsx";
import Certificates from "./pages/dashboard/Certificates.jsx";
import AdmissionInfo from "./pages/dashboard/AdmissionInfo.jsx";
import AdmissionProjects from "./pages/dashboard/AdmissionProjects.jsx";
import RewardPoints from "./pages/dashboard/RewardPoints.jsx";
import CareerTest from "./pages/dashboard/CareerTest.jsx";
import DGNLPractice from "./pages/dashboard/DGNLPractice.jsx";
import DGNLExamDetail from "./pages/dashboard/DGNLExamDetail.jsx";
import AdvisingFAQ from "./pages/dashboard/AdvisingFAQ.jsx";
import CalculateTranscriptScore from "./pages/dashboard/CalculateTranscriptScore.jsx";
import CalculateGraduationScore from "./pages/dashboard/CalculateGraduationScore.jsx";

import ConsultantLayout from "./layouts/ConsultantLayout.jsx";
import ConsultantSchedule from "./pages/consultant/Schedule.jsx";
import ConsultantMeetings from "./pages/consultant/Meetings.jsx";
import ConsultantNotes from "./pages/consultant/Notes.jsx";
import ConsultantCandidates from "./pages/consultant/Candidates.jsx";

import StaffLayout from "./layouts/StaffLayout.jsx";
import StaffAssign from "./pages/staff/Assign.jsx";
import StaffNotifications from "./pages/staff/Notifications.jsx";
import StaffExperts from "./pages/staff/Consultants.jsx";
import StaffScheduleChanges from "./pages/staff/ScheduleChangeRequests.jsx";
import StaffConsultationSchedules from "./pages/staff/ConsultationSchedules.jsx";
import StaffStatistics from "./pages/staff/Statistics.jsx";
import NewsApproval from "./pages/staff/NewsApproval.jsx";
import StaffReviews from "./pages/staff/Reviews.jsx";

import ManagerLayout from "./layouts/ManagerLayout.jsx";
import ManagerOverview from "./pages/manager/Overview.jsx";
import ManagerUsers from "./pages/manager/Users.jsx";
import ManagerLogs from "./pages/manager/Logs.jsx";
import ManagerSettings from "./pages/manager/Settings.jsx";
import ManagerReports from "./pages/manager/Reports.jsx";
import ManagerStudents from "./pages/manager/Students.jsx";
import ManagerStaff from "./pages/manager/Staff.jsx";
import ManagerNewsApproval from "./pages/manager/NewsApproval.jsx";
import ConsultantCalendar from "./pages/manager/ConsultantCalendar.jsx";

import AnalystLayout from "./layouts/AnalystLayout.jsx";
import DataManagement from "./pages/analyst/DataManagement.jsx";
import Posts from "./pages/analyst/Post.jsx";
import UniversityManagement from "./pages/analyst/UniversityManagement.jsx";
import MajorManagement from "./pages/analyst/MajorManagement.jsx";
import AdmissionMajorManagement from "./pages/analyst/AdmissionMajorManagement.jsx";
import AdmissionMethodManagement from "./pages/analyst/AdmissionMethodManagement.jsx";
import AdmissionProjectManagement from "./pages/analyst/AdmissionProjectManagement.jsx";
import AdmissionProjectMethods from "./pages/analyst/AdmissionProjectMethods.jsx";
import AdmissionMethodDetail from "./pages/analyst/AdmissionMethodDetail.jsx";
import Analysis from "./pages/analyst/Analysis.jsx";
import DGNLAnalysis from "./pages/analyst/DGNLAnalysis.jsx";
import DGNLExamManagement from "./pages/analyst/DGNLExamManagement.jsx";
import DGNLExamDetailAdmin from "./pages/analyst/DGNLExamDetail.jsx";

export default function App() {
  const location = useLocation();
  const hideGlobalNav = ["/dashboard", "/consultant", "/staff", "/manager", "/analyst"].some(p =>
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
                <Route path="/news" element={<News />} />
                <Route path="/admin/programs" element={<ManagePrograms />} />

          {/* User Dashboard - Chỉ dành cho Thành viên */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Thành viên']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard/news" replace />} />
            <Route path="score-distribution" element={<Trends />} />
            <Route path="search-trends" element={<TrendsPage />} />
            <Route path="historic-scores" element={<HistoricScores />} />
            <Route path="historic-scores/:id" element={<HistoricScoreDetail />} />
            <Route path="notifications-center" element={<NotificationsCenter />} />
            <Route path="profile" element={<Profile />} />
            <Route path="account-security" element={<AccountSecurity />} />
            <Route path="documents" element={<Documents />} />
            <Route path="wishes" element={<Wishes />} />
            <Route path="search" element={<SearchQuick />} />
            <Route path="payment-history" element={<Payments />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="admission-info" element={<AdmissionInfo />} />
            <Route path="admission-projects" element={<AdmissionProjects />} />
            <Route path="reward-points" element={<RewardPoints />} />
            <Route path="career-test" element={<CareerTest />} />
            <Route path="dgnl-practice" element={<DGNLPractice />} />
            <Route path="dgnl-practice/:id" element={<DGNLExamDetail />} />
            <Route path="advising-chatbot" element={<AdvisingFAQ />} />
            <Route path="calculate-transcript-score" element={<CalculateTranscriptScore />} />
            <Route path="calculate-graduation-score" element={<CalculateGraduationScore />} />
            <Route path="news" element={<News />} />
          </Route>

          {/* Consultant - Chỉ dành cho Tư vấn viên */}
          <Route path="/consultant" element={
            <ProtectedRoute allowedRoles={['Tư vấn viên']}>
              <ConsultantLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ConsultantMeetings />} />
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
            <Route index element={<Navigate to="/staff/assign" replace />} />
            <Route path="assign" element={<StaffAssign />} />
            <Route path="schedule-changes" element={<StaffScheduleChanges />} />
            <Route path="consultation-schedules" element={<StaffConsultationSchedules />} />
            <Route path="reviews" element={<StaffReviews />} />
            <Route path="statistics" element={<StaffStatistics />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route path="consultants" element={<StaffExperts />} />
            <Route path="experts" element={<StaffExperts />} />
          </Route>

          {/* Manager - Chỉ dành cho Admin */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManagerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ManagerOverview />} />
            <Route path="users" element={<ManagerUsers />} />
            <Route path="students" element={<ManagerStudents />} />
            <Route path="staff" element={<ManagerStaff />} />
            <Route path="consultant-calendar" element={<ConsultantCalendar />} />
            <Route path="news-approval" element={<ManagerNewsApproval />} />
            <Route path="logs" element={<ManagerLogs />} />
            <Route path="settings" element={<ManagerSettings />} />
            <Route path="reports" element={<ManagerReports />} />
          </Route>

          {/* Analyst - Chỉ dành cho Nhân viên phân tích (role id = 6) */}
        <Route path="/analyst" element={
            <ProtectedRoute allowedRoleIds={[6]}>
              <AnalystLayout />
            </ProtectedRoute>
          }>
          <Route index element={<DataManagement />} />
          <Route path="data" element={<DataManagement />} />
          <Route path="posts" element={<Posts />} />
          <Route path="university" element={<UniversityManagement />} />
          <Route path="majors" element={<MajorManagement />} />
          <Route path="admission-majors" element={<AdmissionMajorManagement />} />
          <Route path="admission-projects" element={<AdmissionProjectManagement />} />
          <Route path="admission-methods" element={<AdmissionMethodManagement />} />
          <Route path="admission-projects/:id/methods" element={<AdmissionProjectMethods />} />
          <Route path="admission-projects/:id/methods/:methodId" element={<AdmissionMethodDetail />} />
          <Route path="dgnl-exams" element={<DGNLExamManagement />} />
          <Route path="dgnl-exams/:id" element={<DGNLExamDetailAdmin />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="analysis-dgnl" element={<DGNLAnalysis />} />
        </Route>
        </Routes>
      </main>
      {!hideGlobalNav && <Footer />}
    </div>
  );
}
