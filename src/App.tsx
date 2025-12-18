import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import TournamentListings from './components/TournamentListings';
import TournamentDashboard from './components/TournamentDashboard';
import CreateTournament from './components/CreateTournament';
import ManageTournament from './components/ManageTournament';
import TeamProfilePage from './components/TeamProfilePage';
import TeamsDashboard from './components/TeamsDashboard';
import PlayerProfilePage from './components/PlayerProfilePage';
import PlayerSearch from './components/PlayerSearch';
import AdminDashboard from './components/AdminDashboard';

import PrivacyPolicy from './components/privacy/PrivacyPolicy';
import TermsOfService from './components/privacy/TermsOfService';
import CookiePolicy from './components/privacy/CookiePolicy';
import HelpCenter from './components/privacy/HelpCenter';
import RulesGuidelines from './components/privacy/RulesGuidelines';
import ContactUs from './components/privacy/ContactUs';

import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';

function AppInner() {
  const navigate = useNavigate();

  const handleNavigate = (page: string, data?: unknown) => {
    let path = '/';
    switch (page) {
      case 'home': path = '/'; break;
      case 'tournaments': path = '/tournaments'; break;
      case 'tournament-detail': path = typeof data === 'string' ? `/tournaments/${data}` : '/tournaments'; break;
      case 'create-tournament': path = '/create-tournament'; break;
      case 'manage-tournament': path = typeof data === 'string' ? `/manage-tournament/${data}` : '/'; break;
      case 'teams': path = '/teams'; break;
      case 'team-profile': path = typeof data === 'string' ? `/teams/${data}` : '/teams'; break;
      case 'players':
      case 'player-search': path = '/players'; break;
      case 'player-profile': path = typeof data === 'string' ? `/players/${data}` : '/players'; break;
      case 'admin-dashboard': path = '/admin'; break;
      default: path = '/';
    }

    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function TournamentWrapper() {
    const { id } = useParams();
    if (!id) return <div />;
    return <TournamentDashboard tournamentId={id} onNavigate={handleNavigate} />;
  }

  function ManageTournamentWrapper() {
    const { id } = useParams();
    if (!id) return <div />;
    return <ManageTournament tournamentId={id} onNavigate={handleNavigate} />;
  }

  function TeamWrapper() {
    const { id } = useParams();
    if (!id) return <div />;
    return <TeamProfilePage teamId={id} onNavigate={handleNavigate} />;
  }

  function PlayerWrapper() {
    const { id } = useParams();
    if (!id) return <div />;
    return <PlayerProfilePage userId={id} onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Toaster />
      <Navbar onNavigate={handleNavigate} currentPage={undefined as any} />

      <Routes>
        <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
        <Route path="/tournaments" element={<TournamentListings onNavigate={handleNavigate} />} />
        <Route path="/tournaments/:id" element={<TournamentWrapper />} />
        <Route path="/create-tournament" element={<CreateTournament onNavigate={handleNavigate} />} />
        <Route path="/manage-tournament/:id" element={<ManageTournamentWrapper />} />
        <Route path="/teams" element={<TeamsDashboard onNavigate={handleNavigate} />} />
        <Route path="/teams/:id" element={<TeamWrapper />} />
        <Route path="/players" element={<PlayerSearch onNavigate={handleNavigate} />} />
        <Route path="/players/:id" element={<PlayerWrapper />} />
        <Route path="/admin" element={<AdminDashboard onNavigate={handleNavigate} />} />

        {/* Legal / Support */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/rules" element={<RulesGuidelines />} />
        <Route path="/contact" element={<ContactUs />} />
      </Routes>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
