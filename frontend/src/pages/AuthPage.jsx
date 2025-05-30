// frontend/src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Notre hook d'authentification
import { toast } from 'react-toastify';

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
                navigate('/commissariat-dashboard');
            } else {
                navigate('/user-dashboard');
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
                        navigate('/commissariat-dashboard');
                    } else {
                        navigate('/user-dashboard');
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
                        navigate('/commissariat-dashboard');
                    } else {
                        navigate('/user-dashboard');
                    }
                }
            }
        } catch (error) {
            // Les messages d'erreur sont déjà gérés par `toast.error` dans `AuthContext`
            console.error("Auth submission error:", error); // Pour le débogage
        }
    };

    return (
        <div className="auth-page">
            <h2>{isRegistering ? "Inscription" : "Connexion"}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                {isRegistering && (
                    <>
                        <div className="form-group">
                            <label htmlFor="firstName">Prénom</label>
                            <input
                                type="text"
                                id="firstName"
                                {...register('firstName', { required: 'Le prénom est requis' })}
                            />
                            {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Nom</label>
                            <input
                                type="text"
                                id="lastName"
                                {...register('lastName', { required: 'Le nom est requis' })}
                            />
                            {errors.lastName && <span className="error-message">{errors.lastName.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Téléphone (optionnel)</label>
                            <input
                                type="text"
                                id="phone"
                                {...register('phone', { pattern: { value: /^[0-9]{10}$/, message: 'Numéro de téléphone invalide (10 chiffres)' } })}
                            />
                            {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Adresse (optionnel)</label>
                            <input
                                type="text"
                                id="address"
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
                        {...register('email', { required: 'L\'email est requis', pattern: { value: /^\S+@\S+$/i, message: 'Adresse email invalide' } })}
                    />
                    {errors.email && <span className="error-message">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                        type="password"
                        id="password"
                        {...register('password', { required: 'Le mot de passe est requis', minLength: { value: 6, message: 'Le mot de passe doit contenir au moins 6 caractères' } })}
                    />
                    {errors.password && <span className="error-message">{errors.password.message}</span>}
                </div>

                <button type="submit" className="btn primary-btn">
                    {isRegistering ? "S'inscrire" : "Se connecter"}
                </button>
            </form>

            <p className="auth-switch">
                {isRegistering ? "Déjà un compte ?" : "Pas encore de compte ?"}
                <button onClick={() => setIsRegistering(!isRegistering)} className="btn text-btn">
                    {isRegistering ? "Se connecter" : "S'inscrire"}
                </button>
            </p>
        </div>
    );
}

export default AuthPage;