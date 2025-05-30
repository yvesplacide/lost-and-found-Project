// frontend/src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import '../styles/AdminDashboard.css';
dayjs.locale('fr');

function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [commissariats, setCommissariats] = useState([]);
    const [agents, setAgents] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // États pour les formulaires
    const [newCommissariat, setNewCommissariat] = useState({
        name: '',
        address: '',
        city: '',
        phone: '',
        email: ''
    });

    const [newAgent, setNewAgent] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        commissariatId: ''
    });

    // Charger les données
    useEffect(() => {
        fetchCommissariats();
        fetchAgents();
        fetchUsers();
    }, []);

    const fetchCommissariats = async () => {
        try {
            const response = await api.get('/commissariats');
            setCommissariats(response.data);
        } catch (err) {
            console.error('Erreur lors du chargement des commissariats:', err);
            toast.error('Erreur lors du chargement des commissariats');
        }
    };

    const fetchAgents = async () => {
        try {
            const response = await api.get('/users?role=commissariat_agent');
            setAgents(response.data);
        } catch (err) {
            console.error('Erreur lors du chargement des agents:', err);
            toast.error('Erreur lors du chargement des agents');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users?role=user');
            setUsers(response.data);
        } catch (err) {
            console.error('Erreur lors du chargement des utilisateurs:', err);
            toast.error('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    // Gestion des commissariats
    const handleCreateCommissariat = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/commissariats', newCommissariat);
            setCommissariats([...commissariats, response.data]);
            setNewCommissariat({
                name: '',
                address: '',
                city: '',
                phone: '',
                email: ''
            });
            toast.success('Commissariat créé avec succès');
        } catch (err) {
            console.error('Erreur lors de la création du commissariat:', err);
            toast.error(err.response?.data?.message || 'Erreur lors de la création du commissariat');
        }
    };

    const handleDeleteCommissariat = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commissariat ?')) {
            try {
                await api.delete(`/commissariats/${id}`);
                setCommissariats(commissariats.filter(c => c._id !== id));
                toast.success('Commissariat supprimé avec succès');
            } catch (err) {
                console.error('Erreur lors de la suppression du commissariat:', err);
                toast.error(err.response?.data?.message || 'Erreur lors de la suppression du commissariat');
            }
        }
    };

    // Gestion des agents
    const handleCreateAgent = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/users', {
                ...newAgent,
                role: 'commissariat_agent'
            });
            setAgents([...agents, response.data]);
            setNewAgent({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                commissariatId: ''
            });
            toast.success('Agent créé avec succès');
        } catch (err) {
            console.error('Erreur lors de la création de l\'agent:', err);
            toast.error(err.response?.data?.message || 'Erreur lors de la création de l\'agent');
        }
    };

    const handleDeleteAgent = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
            try {
                await api.delete(`/users/${id}`);
                setAgents(agents.filter(a => a._id !== id));
                toast.success('Agent supprimé avec succès');
            } catch (err) {
                console.error('Erreur lors de la suppression de l\'agent:', err);
                toast.error(err.response?.data?.message || 'Erreur lors de la suppression de l\'agent');
            }
        }
    };

    // Gestion des utilisateurs
    const handleDeleteUser = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await api.delete(`/users/${id}`);
                setUsers(users.filter(u => u._id !== id));
                toast.success('Utilisateur supprimé avec succès');
            } catch (err) {
                console.error('Erreur lors de la suppression de l\'utilisateur:', err);
                toast.error(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
            }
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Chargement...</div>;
    }

    if (error) {
        return <div className="dashboard-error">Erreur: {error}</div>;
    }

  return (
    <div className="dashboard admin-dashboard">
      <h2>Tableau de Bord Administrateur</h2>
            <p>Bienvenue, {user?.firstName} ! Gérez les commissariats, les agents et les utilisateurs.</p>

            {/* Navigation par onglets */}
            <div className="admin-tabs">
                <button 
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Vue d'ensemble
                </button>
                <button 
                    className={`tab-button ${activeTab === 'commissariats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('commissariats')}
                >
                    Commissariats
                </button>
                <button 
                    className={`tab-button ${activeTab === 'agents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('agents')}
                >
                    Agents
                </button>
                <button 
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Utilisateurs
                </button>
            </div>

            {/* Contenu des onglets */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-section">
                        <div className="stats-cards">
                            <div className="stat-card">
                                <h3>Commissariats</h3>
                                <p className="stat-number">{commissariats.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Agents</h3>
                                <p className="stat-number">{agents.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Utilisateurs</h3>
                                <p className="stat-number">{users.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'commissariats' && (
                    <div className="commissariats-section">
                        <h3>Gestion des Commissariats</h3>
                        
                        {/* Formulaire de création de commissariat */}
                        <form onSubmit={handleCreateCommissariat} className="admin-form">
                            <h4>Créer un nouveau commissariat</h4>
                            <div className="form-group">
                                <label>Nom du commissariat</label>
                                <input
                                    type="text"
                                    value={newCommissariat.name}
                                    onChange={(e) => setNewCommissariat({...newCommissariat, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Adresse</label>
                                <input
                                    type="text"
                                    value={newCommissariat.address}
                                    onChange={(e) => setNewCommissariat({...newCommissariat, address: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Ville</label>
                                <input
                                    type="text"
                                    value={newCommissariat.city}
                                    onChange={(e) => setNewCommissariat({...newCommissariat, city: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Téléphone</label>
                                <input
                                    type="tel"
                                    value={newCommissariat.phone}
                                    onChange={(e) => setNewCommissariat({...newCommissariat, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newCommissariat.email}
                                    onChange={(e) => setNewCommissariat({...newCommissariat, email: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="btn primary-btn">Créer le commissariat</button>
                        </form>

                        {/* Liste des commissariats */}
                        <div className="commissariats-list">
                            <h4>Liste des commissariats</h4>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Ville</th>
                                            <th>Email</th>
                                            <th>Téléphone</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {commissariats.map(commissariat => (
                                            <tr key={commissariat._id}>
                                                <td>{commissariat.name}</td>
                                                <td>{commissariat.city}</td>
                                                <td>{commissariat.email}</td>
                                                <td>{commissariat.phone}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleDeleteCommissariat(commissariat._id)}
                                                        className="btn danger-btn"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'agents' && (
                    <div className="agents-section">
                        <h3>Gestion des Agents</h3>
                        
                        {/* Formulaire de création d'agent */}
                        <form onSubmit={handleCreateAgent} className="admin-form">
                            <h4>Créer un nouvel agent</h4>
                            <div className="form-group">
                                <label>Prénom</label>
                                <input
                                    type="text"
                                    value={newAgent.firstName}
                                    onChange={(e) => setNewAgent({...newAgent, firstName: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nom</label>
                                <input
                                    type="text"
                                    value={newAgent.lastName}
                                    onChange={(e) => setNewAgent({...newAgent, lastName: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newAgent.email}
                                    onChange={(e) => setNewAgent({...newAgent, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    value={newAgent.password}
                                    onChange={(e) => setNewAgent({...newAgent, password: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Téléphone</label>
                                <input
                                    type="tel"
                                    value={newAgent.phone}
                                    onChange={(e) => setNewAgent({...newAgent, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Commissariat</label>
                                <select
                                    value={newAgent.commissariatId}
                                    onChange={(e) => setNewAgent({...newAgent, commissariatId: e.target.value})}
                                    required
                                >
                                    <option value="">Sélectionner un commissariat</option>
                                    {commissariats.map(commissariat => (
                                        <option key={commissariat._id} value={commissariat._id}>
                                            {commissariat.name} ({commissariat.city})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn primary-btn">Créer l'agent</button>
                        </form>

                        {/* Liste des agents */}
                        <div className="agents-list">
                            <h4>Liste des agents</h4>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Commissariat</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agents.map(agent => (
                                            <tr key={agent._id}>
                                                <td>{agent.firstName} {agent.lastName}</td>
                                                <td>{agent.email}</td>
                                                <td>
                                                    {commissariats.find(c => c._id === agent.commissariat)?.name || 'Non assigné'}
                                                </td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleDeleteAgent(agent._id)}
                                                        className="btn danger-btn"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="users-section">
                        <h3>Gestion des Utilisateurs</h3>
                        
                        {/* Liste des utilisateurs */}
                        <div className="users-list">
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Date d'inscription</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user._id}>
                                                <td>{user.firstName} {user.lastName}</td>
                                                <td>{user.email}</td>
                                                <td>{dayjs(user.createdAt).format('DD/MM/YYYY')}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="btn danger-btn"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    </div>
  );
}

export default AdminDashboard;