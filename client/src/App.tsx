import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

import { MeetingsPage } from './pages/MeetingsPage';
import { NewMeetingPage } from './pages/NewMeetingPage';
import { MeetingDetailPage } from './pages/MeetingDetailPage';
import { SettingsPage } from './pages/SettingsPage';

import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="keytake-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/meetings" element={<MeetingsPage />} />
                <Route path="/meetings/new" element={<NewMeetingPage />} />
                <Route path="/meetings/:id" element={<MeetingDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
