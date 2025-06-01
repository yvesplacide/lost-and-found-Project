// frontend/src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Notre hook d'authentification
import { toast } from 'react-toastify';
import '../styles/Auth.css'; // Import du nouveau CSS


function AuthPage() {
    const [isRegistering, setIsRegistering] = useState(false); // Pour basculer entre Login et Register
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const { user, login, register: authRegister } = useAuth(); // Renomme register du context en authRegister
    const navigate = useNavigate();

    // Redirige l'utilisateur s'il est déjà connecté
    useEffect(() => {
        if (user) {
            // Redirection basée sur le rôle de l'utilisateur
            if (user.role === 'admin') {
                navigate('/admin-dashboard');
            } else if (user.role === 'commissariat_agent') {
                navigate('/');
            } else {
                navigate('/');
            }
            toast.info(`Vous êtes déjà connecté en tant que ${user.role}.`);
        }
    }, [user, navigate]);


    const onSubmit = async (data) => {
        try {
            if (isRegistering) {
                // Logique d'inscription
                const registeredUser = await authRegister(data);
                if (registeredUser) {
                    toast.success(`Bienvenue, ${registeredUser.firstName} !`);
                    reset(); // Réinitialise le formulaire après succès
                    // Rediriger l'utilisateur après l'inscription/connexion
                    if (registeredUser.role === 'admin') {
                        navigate('/admin-dashboard');
                    } else if (registeredUser.role === 'commissariat_agent') {
                        navigate('/');
                    } else {
                        navigate('/');
                    }
                }
            } else {
                // Logique de connexion
                const loggedInUser = await login(data.email, data.password);
                if (loggedInUser) {
                    toast.success(`Ravi de vous revoir, ${loggedInUser.firstName} !`);
                    reset(); // Réinitialise le formulaire après succès
                    // Rediriger l'utilisateur après l'inscription/connexion
                    if (loggedInUser.role === 'admin') {
                        navigate('/admin-dashboard');
                    } else if (loggedInUser.role === 'commissariat_agent') {
                        navigate('/');
                    } else {
                        navigate('/');
                    }
                }
            }
        } catch (error) {
            // Les messages d'erreur sont déjà gérés par `toast.error` dans `AuthContext`
            console.error("Auth submission error:", error); // Pour le débogage
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{isRegistering ? "Inscription" : "Connexion"}</h2>
                    <p>{isRegistering ? "Créez votre compte" : "Connectez-vous à votre compte"}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {isRegistering && (
                        <>
                            <div className="form-group">
                                <label htmlFor="firstName">Prénom</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    placeholder="Votre prénom"
                                    {...register('firstName', { required: 'Le prénom est requis' })}
                                />
                                {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Nom</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    placeholder="Votre nom"
                                    {...register('lastName', { required: 'Le nom est requis' })}
                                />
                                {errors.lastName && <span className="error-message">{errors.lastName.message}</span>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Téléphone (optionnel)</label>
                                <input
                                    type="text"
                                    id="phone"
                                    placeholder="Votre numéro de téléphone"
                                    {...register('phone', { pattern: { value: /^[0-9]{10}$/, message: 'Numéro de téléphone invalide (10 chiffres)' } })}
                                />
                                {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Adresse (optionnel)</label>
                                <input
                                    type="text"
                                    id="address"
                                    placeholder="Votre adresse"
                                    {...register('address')}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Votre email"
                            {...register('email', { 
                                required: 'L\'email est requis', 
                                pattern: { 
                                    value: /^\S+@\S+$/i, 
                                    message: 'Adresse email invalide' 
                                } 
                            })}
                        />
                        {errors.email && <span className="error-message">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Votre mot de passe"
                            {...register('password', { 
                                required: 'Le mot de passe est requis', 
                                minLength: { 
                                    value: 6, 
                                    message: 'Le mot de passe doit contenir au moins 6 caractères' 
                                } 
                            })}
                        />
                        {errors.password && <span className="error-message">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="btn primary-btn">
                        {isRegistering ? "S'inscrire" : "Se connecter"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isRegistering ? "Déjà un compte ?" : "Pas encore de compte ?"}
                        <button 
                            onClick={() => setIsRegistering(!isRegistering)} 
                            className="btn secondary-btn"
                        >
                            {isRegistering ? "Se connecter" : "S'inscrire"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;