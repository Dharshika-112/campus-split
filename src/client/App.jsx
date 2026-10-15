import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { TripList } from './pages/TripList.jsx';
import { CreateTrip } from './pages/CreateTrip.jsx';
import { TripDetails } from './pages/TripDetails.jsx';
import './styles/globals.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/trips"     element={<TripList />} />
            <Route path="/trips/new" element={<CreateTrip />} />
            <Route path="/trips/:tripId" element={<TripDetails />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
