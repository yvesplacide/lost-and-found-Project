import React from 'react';
import { useNavigate } from 'react-router-dom';
import DeclarationForm from '../components/declaration/DeclarationForm';
import { toast } from 'react-toastify';
import '../styles/NewDeclarationPage.css';

function NewDeclarationPage() {
    const navigate = useNavigate();

    const handleSubmitSuccess = (declaration) => {
        toast.success('Déclaration créée avec succès !');
        navigate('/user-dashboard');
    };

    return (
        <div className="new-declaration-page">
            <div className="page-header">
                <h2>Nouvelle Déclaration</h2>
                <p>Remplissez le formulaire ci-dessous pour créer une nouvelle déclaration.</p>
            </div>
            <DeclarationForm onSubmitSuccess={handleSubmitSuccess} />
        </div>
    );
}

export default NewDeclarationPage; 