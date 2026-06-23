import { createBrowserRouter, Outlet } from 'react-router';
import Sidebar from './components/Sidebar';
import CameraPage from './pages/CameraPage';
import AttendancePage from './pages/AttendancePage';
import SyllabusPage from './pages/SyllabusPage';
import ClassroomPage from './pages/ClassroomPage';
import SpeechPage from './pages/SpeechPage';
import TranscriptsPage from './pages/TranscriptsPage';
import SettingsPage from './pages/SettingsPage';
import BehaviorPage from './pages/BehaviorPage';
import AssessmentsPage from './pages/AssessmentsPage';

function Layout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <CameraPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'syllabus', element: <SyllabusPage /> },
      { path: 'classroom', element: <ClassroomPage /> },
      { path: 'behavior', element: <BehaviorPage /> },
      { path: 'assessments', element: <AssessmentsPage /> },
      { path: 'speech', element: <SpeechPage /> },
      { path: 'transcripts', element: <TranscriptsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
