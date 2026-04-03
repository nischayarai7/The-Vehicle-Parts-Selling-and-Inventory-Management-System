import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '../services/api';

function HomePage() {
  const navigate = useNavigate();
  const user = api.getUser();

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Vehicle Parts Inventory</h1>
        <div className="header-right">
          <span className="user-greeting">Hello, {user.fullName}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="home-main">
        <div className="welcome-card">
          <h2>Welcome to the Dashboard</h2>
          <p>You are logged in as <strong>{user.email}</strong></p>
          <p className="muted">Vehicle parts management features coming soon.</p>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
