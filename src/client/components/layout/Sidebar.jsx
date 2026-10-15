import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span>💸</span>
        <span>CampusSplit</span>
      </div>
      <div className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>
        <NavLink to="/trips" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Briefcase size={16} />
          Trips
        </NavLink>
      </div>
    </nav>
  );
}
