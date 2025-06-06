import React from 'react';
import PropTypes from 'prop-types';
import { FaHome, FaChartBar, FaBell, FaCog } from 'react-icons/fa';
import NotificationCounter from '../common/NotificationCounter';
import '../styles/Sidebar.css';

function Sidebar({ activeTab, onTabChange, user, unreadCount }) {
    const menuItems = [
        { id: 'dashboard', icon: FaHome, label: 'Tableau de bord' },
        { id: 'statistics', icon: FaChartBar, label: 'Statistiques' },
        { id: 'notifications', icon: FaBell, label: 'Notifications' },
        { id: 'settings', icon: FaCog, label: 'Paramètres' }
    ];

    return (
        <aside className="sidebar">
            {user && user.commissariat && (
                <div className="commissariat-info">
                    <h3>{
                        typeof user.commissariat === 'object' && user.commissariat !== null
                            ? user.commissariat.name
                            : 'Votre Commissariat'
                    }</h3>
                    <p>{
                        typeof user.commissariat === 'object' && user.commissariat !== null
                            ? user.commissariat.city
                            : ''
                    }</p>
                </div>
            )}
            <nav>
                <ul className="sidebar-menu">
                    {menuItems.map(({ id, icon: Icon, label }) => (
                        <li key={id}>
                            <button 
                                className={`sidebar-link ${activeTab === id ? 'active' : ''}`}
                                onClick={() => onTabChange(id)}
                                title={label}
                            >
                                <Icon />
                                <span>{label}</span>
                                {id === 'notifications' && unreadCount > 0 && (
                                    <NotificationCounter count={unreadCount} />
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}

Sidebar.propTypes = {
    activeTab: PropTypes.string.isRequired,
    onTabChange: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    unreadCount: PropTypes.number
};

export default Sidebar; 