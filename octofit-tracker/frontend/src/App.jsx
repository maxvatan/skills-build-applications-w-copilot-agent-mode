import { Link, NavLink, Route, Routes } from 'react-router-dom';
import logo from './assets/octofitapp-small.png';
import Activities from './components/Activities.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Teams from './components/Teams.jsx';
import Users from './components/Users.jsx';
import Workouts from './components/Workouts.jsx';

const navItems = [
  { to: '/activities', label: 'Activities' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/users', label: 'Users' },
  { to: '/workouts', label: 'Workouts' },
];

function Home() {
  return (
    <div className="text-center py-5">
      <img src={logo} alt="OctoFit Tracker" height="160" className="mb-4" />
      <h1 className="display-5">Welcome to OctoFit Tracker</h1>
      <p className="lead">Log activities, join teams, climb the leaderboard, and find your next workout.</p>
      <div className="d-flex justify-content-center flex-wrap gap-2">
        {navItems.map(({ to, label }) => (
          <Link key={to} to={to} className="btn btn-outline-primary">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="alert alert-warning" role="alert">
      Page not found. <Link to="/">Return home</Link>.
    </div>
  );
}

export default function App() {
  return (
    <>
      <nav className="navbar navbar-expand flex-wrap navbar-dark bg-dark px-3">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src={logo} alt="" />
          OctoFit Tracker
        </Link>
        <ul className="navbar-nav flex-wrap">
          {navItems.map(({ to, label }) => (
            <li key={to} className="nav-item">
              <NavLink className="nav-link" to={to}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/users" element={<Users />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
