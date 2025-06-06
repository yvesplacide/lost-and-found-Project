// frontend/src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Notre hook d'authentification
import { toast } from 'react-toastify';
import { IoArrowBack } from 'react-icons/io5';
import '../styles/Auth.css'; // Import du nouveau CSS


function AuthPage() {
    const [searchParams] = useSearchParams();
    const [isRegistering, setIsRegistering] = useState(searchParams.get('mode') === 'register');
    const [registrationStep, setRegistrationStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
    const { user, login, register: authRegister } = useAuth(); // Renomme register du context en authRegister
    const navigate = useNavigate();

    // Réinitialiser le formulaire quand l'utilisateur se déconnecte
    useEffect(() => {
        if (!user) {
            reset({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                birthPlace: '',
                phone: '',
                address: '',
                profession: ''
            });
            setRegistrationStep(1);
        }
    }, [user, reset]);

    // Redirige l'utilisateur s'il est déjà connecté
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin-dashboard');
            } else if (user.role === 'commissariat_agent') {
                navigate('/');
            } else {
                navigate('/');
            }
        }
    }, [user, navigate]);


    const onSubmit = async (data) => {
        try {
            if (isRegistering) {
                if (registrationStep === 1 || registrationStep === 2) {
                    setRegistrationStep(registrationStep + 1);
                    return;
                }
                
                setIsLoading(true);
                const formattedData = {
                    ...data,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null
                };
                
                const registeredUser = await authRegister(formattedData);
                if (registeredUser) {
                    toast.success('Inscription réussie');
                    reset();
                    setRegistrationStep(1);
                    if (registeredUser.role === 'admin') {
                        navigate('/admin-dashboard');
                    } else if (registeredUser.role === 'commissariat_agent') {
                        navigate('/');
                    } else {
                        navigate('/');
                    }
                }
            } else {
                setIsLoading(true);
                const loggedInUser = await login(data.email, data.password);
                if (loggedInUser) {
                    toast.success('Connexion réussie');
                    reset();
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
            console.error("Auth submission error:", error);
            toast.error('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    const renderRegistrationForm = () => {
        if (registrationStep === 1) {
            return (
                <>
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

                    <button type="submit" className="btn primary-btn" disabled={isLoading}>
                        {isLoading ? (
                            <span className="button-loader">
                                <span className="loader"></span>
                                Chargement...
                            </span>
                        ) : (
                            'Continuer'
                        )}
                    </button>
                </>
            );
        }

        if (registrationStep === 2) {
            return (
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
                        <label htmlFor="phone">Téléphone</label>
                        <input
                            type="text"
                            id="phone"
                            placeholder="Votre numéro de téléphone"
                            {...register('phone', { 
                                required: 'Le numéro de téléphone est requis',
                                pattern: { 
                                    value: /^[0-9]{10}$/, 
                                    message: 'Numéro de téléphone invalide (10 chiffres)' 
                                } 
                            })}
                        />
                        {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                    </div>

                    <div className="form-buttons">
                        <button type="button" className="btn secondary-btn" onClick={() => setRegistrationStep(1)} disabled={isLoading}>
                            Retour
                        </button>
                        <button type="submit" className="btn primary-btn" disabled={isLoading}>
                            {isLoading ? (
                                <span className="button-loader">
                                    <span className="loader"></span>
                                    Chargement...
                                </span>
                            ) : (
                                'Continuer'
                            )}
                        </button>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="form-group">
                    <label htmlFor="address">Adresse</label>
                    <input
                        type="text"
                        id="address"
                        placeholder="Votre adresse"
                        {...register('address', { required: 'L\'adresse est requise' })}
                    />
                    {errors.address && <span className="error-message">{errors.address.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="profession">Profession</label>
                    <input
                        type="text"
                        id="profession"
                        placeholder="Votre profession"
                        {...register('profession', { required: 'La profession est requise' })}
                    />
                    {errors.profession && <span className="error-message">{errors.profession.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="dateOfBirth">Date de naissance</label>
                    <input
                        type="date"
                        id="dateOfBirth"
                        {...register('dateOfBirth', { required: 'La date de naissance est requise' })}
                    />
                    {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="birthPlace">Lieu de naissance</label>
                    <input
                        type="text"
                        id="birthPlace"
                        placeholder="Votre lieu de naissance"
                        {...register('birthPlace', { required: 'Le lieu de naissance est requis' })}
                    />
                    {errors.birthPlace && <span className="error-message">{errors.birthPlace.message}</span>}
                </div>

                <div className="form-buttons">
                    <button type="button" className="btn secondary-btn" onClick={() => setRegistrationStep(2)} disabled={isLoading}>
                        Retour
                    </button>
                    <button type="submit" className="btn primary-btn" disabled={isLoading}>
                        {isLoading ? (
                            <span className="button-loader">
                                <span className="loader"></span>
                                Inscription en cours...
                            </span>
                        ) : (
                            'S\'inscrire'
                        )}
                    </button>
                </div>
            </>
        );
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <button 
                        onClick={() => navigate('/')} 
                        className="back-btn"
                        title="Retour à l'accueil"
                    >
                        ←
                    </button>
                    <h2>{isRegistering ? "Inscription" : "Connexion"}</h2>
                    <p>
                        {isRegistering 
                            ? `Créez votre compte - Étape ${registrationStep}/3`
                            : "Connectez-vous à votre compte"
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {isRegistering ? renderRegistrationForm() : (
                        <>
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

                            <button type="submit" className="btn primary-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="button-loader">
                                        <span className="loader"></span>
                                        Connexion en cours...
                                    </span>
                                ) : (
                                    'Se connecter'
                                )}
                            </button>
                        </>
                    )}
                </form>

                <div className="auth-footer">
                    <p>
                        {isRegistering ? "Déjà un compte ?" : "Pas encore de compte ?"}
                        <button 
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setRegistrationStep(1);
                                reset();
                            }} 
                            className="btn secondary-btn"
                            disabled={isLoading}
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