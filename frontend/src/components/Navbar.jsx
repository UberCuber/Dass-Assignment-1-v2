import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiCalendar, FiUsers, FiUser, FiLogOut, FiPlus, FiSettings, FiKey, FiGrid } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    const getNavLinks = () => {
        switch (user.role) {
            case 'participant':
                return (
                    <>
                        <Link to="/dashboard" className={isActive('/dashboard')}>
                            <FiHome /> <span>Dashboard</span>
                        </Link>
                        <Link to="/events" className={isActive('/events')}>
                            <FiCalendar /> <span>Browse Events</span>
                        </Link>
                        <Link to="/clubs" className={isActive('/clubs')}>
                            <FiUsers /> <span>Clubs</span>
                        </Link>
                        <Link to="/profile" className={isActive('/profile')}>
                            <FiUser /> <span>Profile</span>
                        </Link>
                    </>
                );
            case 'organizer':
                return (
                    <>
                        <Link to="/organizer/dashboard" className={isActive('/organizer/dashboard')}>
                            <FiHome /> <span>Dashboard</span>
                        </Link>
                        <Link to="/organizer/create-event" className={isActive('/organizer/create-event')}>
                            <FiPlus /> <span>Create Event</span>
                        </Link>
                        <Link to="/organizer/profile" className={isActive('/organizer/profile')}>
                            <FiUser /> <span>Profile</span>
                        </Link>
                    </>
                );
            case 'admin':
                return (
                    <>
                        <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>
                            <FiHome /> <span>Dashboard</span>
                        </Link>
                        <Link to="/admin/organizers" className={isActive('/admin/organizers')}>
                            <FiSettings /> <span>Manage Clubs</span>
                        </Link>
                        <Link to="/admin/password-resets" className={isActive('/admin/password-resets')}>
                            <FiKey /> <span>Reset Requests</span>
                        </Link>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand">
                <FiGrid />
                <span>Felicity</span>
            </Link>
            <div className="nav-links">
                {getNavLinks()}
            </div>
            <div className="nav-right">
                <span className="nav-user">
                    {user.firstName || user.organizerName || 'Admin'}
                </span>
                <button onClick={handleLogout} className="nav-logout">
                    <FiLogOut /> <span>Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
