import React, { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import api from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

dayjs.locale('fr');

// Fonction pour générer le contenu HTML du récépissé
export const generateReceiptContent = (declaration, receiptNumber) => {
    // Vérifier si les données de l'utilisateur existent
    const user = declaration.user || {};
    
    // Formater la date de naissance
    const formatDateOfBirth = (date) => {
        if (!date) return 'Non spécifiée';
        try {
            return dayjs(date).format('DD/MM/YYYY');
        } catch (error) {
            return 'Non spécifiée';
        }
    };

    return `
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; margin-bottom: 10px;">RÉPUBLIQUE DE CÔTE D'IVOIRE</h1>
            <h2 style="font-size: 20px; margin-bottom: 10px;">Union – Discipline – Travail</h2>
            <h3 style="font-size: 18px; margin-bottom: 10px;">MINISTÈRE DE L'INTÉRIEUR ET DE LA SÉCURITÉ</h3>
            <h4 style="font-size: 16px; margin-bottom: 10px;">Direction Générale de la Police Nationale</h4>
            <h4 style="font-size: 16px; margin-bottom: 10px;">Commissariat de Police de ${declaration.commissariat?.name || 'Non assigné'}</h4>
        </div>

        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
            <h1 style="font-size: 24px; margin-bottom: 10px;">RÉCÉPISSÉ DE DÉCLARATION DE PERTE</h1>
            <p style="font-size: 16px;">N° : ${receiptNumber || declaration.receiptNumber}</p>
            <p style="font-size: 16px;">Date : ${dayjs(declaration.receiptDate || new Date()).format('DD MMMM YYYY')}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; margin-bottom: 15px;">IDENTITÉ DU DÉCLARANT</h2>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Nom et prénoms :</strong> ${user.lastName || ''} ${user.firstName || ''}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Date de naissance :</strong> ${formatDateOfBirth(user.dateOfBirth)}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Lieu de naissance :</strong> ${user.birthPlace || 'Non spécifié'}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Profession :</strong> ${user.profession || 'Non spécifiée'}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Adresse :</strong> ${user.address || 'Non spécifiée'}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Contact :</strong> ${user.phone || 'Non spécifié'}</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; margin-bottom: 15px;">OBJET DE LA DÉCLARATION</h2>
            <p style="font-size: 14px; margin: 5px 0;">Le susnommé a déclaré en ce jour la perte de l'objet suivant :</p>
            
            ${declaration.declarationType === 'objet' ? `
                <p style="font-size: 14px; margin: 5px 0;"><strong>Nature du document/objet perdu :</strong> ${declaration.objectDetails?.objectCategory || 'Non spécifiée'}</p>
                ${declaration.objectDetails?.serialNumber ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Numéro du document :</strong> ${declaration.objectDetails.serialNumber}</p>` : ''}
                ${declaration.objectDetails?.objectBrand ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Marque :</strong> ${declaration.objectDetails.objectBrand}</p>` : ''}
                <p style="font-size: 14px; margin: 5px 0;"><strong>Date approximative de la perte :</strong> ${dayjs(declaration.declarationDate).format('DD MMMM YYYY')}</p>
                <p style="font-size: 14px; margin: 5px 0;"><strong>Lieu présumé de la perte :</strong> ${declaration.location}</p>
            ` : `
                <p style="font-size: 14px; margin: 5px 0;"><strong>Type de déclaration :</strong> Disparition de personne</p>
                <p style="font-size: 14px; margin: 5px 0;"><strong>Nom :</strong> ${declaration.personDetails?.lastName || 'Non spécifié'}</p>
                <p style="font-size: 14px; margin: 5px 0;"><strong>Prénom :</strong> ${declaration.personDetails?.firstName || 'Non spécifié'}</p>
                <p style="font-size: 14px; margin: 5px 0;"><strong>Date de naissance :</strong> ${dayjs(declaration.personDetails?.dateOfBirth).format('DD MMMM YYYY') || 'Non spécifiée'}</p>
                ${declaration.personDetails?.gender ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Genre :</strong> ${declaration.personDetails.gender}</p>` : ''}
                ${declaration.personDetails?.height ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Taille :</strong> ${declaration.personDetails.height} cm</p>` : ''}
                ${declaration.personDetails?.weight ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Poids :</strong> ${declaration.personDetails.weight} kg</p>` : ''}
                ${declaration.personDetails?.clothingDescription ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Description des vêtements :</strong> ${declaration.personDetails.clothingDescription}</p>` : ''}
                ${declaration.personDetails?.distinguishingMarks ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Signes particuliers :</strong> ${declaration.personDetails.distinguishingMarks}</p>` : ''}
                <p style="font-size: 14px; margin: 5px 0;"><strong>Date de la disparition :</strong> ${dayjs(declaration.declarationDate).format('DD MMMM YYYY')}</p>
                <p style="font-size: 14px; margin: 5px 0;"><strong>Dernier lieu vu :</strong> ${declaration.personDetails?.lastSeenLocation || declaration.location}</p>
            `}
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; margin-bottom: 15px;">UTILITÉ DE LA DÉCLARATION</h2>
            <p style="font-size: 14px; margin: 5px 0;">Cette déclaration est faite pour servir et valoir ce que de droit, notamment dans le cadre de la recherche de la personne disparue, et comme preuve de bonne foi.</p>
        </div>

        <div style="margin-top: 50px;">
            <p style="font-size: 14px; margin: 5px 0;">Fait à : ${declaration.commissariat?.name || 'Non assigné'}</p>
            <p style="font-size: 14px; margin: 5px 0;">Le : ${dayjs(declaration.receiptDate || new Date()).format('DD MMMM YYYY')}</p>
            
            <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                <div style="width: 45%;">
                    <p style="font-size: 14px; margin: 5px 0;">Le Déclarant</p>
                    <div style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></div>
                </div>
                <div style="width: 45%;">
                    <p style="font-size: 14px; margin: 5px 0;">L'Officier de Police Judiciaire</p>
                    <p style="font-size: 14px; margin: 5px 0;">Nom : ${declaration.agentAssigned && declaration.agentAssigned.firstName && declaration.agentAssigned.lastName ? `${declaration.agentAssigned.firstName} ${declaration.agentAssigned.lastName}` : 'Non assigné'}</p>
                    <div style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></div>
                    <p style="font-size: 14px; margin: 5px 0;">Signature et cachet du commissariat</p>
                </div>
            </div>
        </div>
    `;
};

function ReceiptGenerator({ declaration, onReceiptGenerated }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [receiptNumber, setReceiptNumber] = useState(declaration.receiptNumber || '');

    // Ajouter des logs pour déboguer
    console.log('Déclaration reçue:', declaration);
    console.log('Agent assigné:', declaration.agentAssigned);
    console.log('Données utilisateur:', declaration.user);

    // Vérifier si les données utilisateur sont disponibles
    const user = declaration.user || {};
    console.log('Données utilisateur extraites:', user);

    const generateReceipt = async () => {
        try {
            setIsGenerating(true);
            
            if (!receiptNumber) {
                const newReceiptNumber = `REC-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                setReceiptNumber(newReceiptNumber);
                
                try {
                    const response = await api.put(`/declarations/${declaration._id}`, {
                        receiptNumber: newReceiptNumber,
                        receiptDate: new Date().toISOString(),
                        agentAssigned: declaration.agentAssigned?._id,
                        status: 'Traité',
                        processedAt: new Date().toISOString()
                    });
                    
                    if (response.data) {
                        console.log('Déclaration mise à jour:', response.data);
                        toast.success('Récépissé généré et déclaration traitée');
                        if (onReceiptGenerated) {
                            onReceiptGenerated(newReceiptNumber);
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de la mise à jour de la déclaration:', error);
                    toast.error('Erreur lors de la mise à jour de la déclaration');
                    return;
                }
            }

            // Créer un élément temporaire pour le contenu du récépissé
            const receiptElement = document.createElement('div');
            receiptElement.style.width = '210mm';
            receiptElement.style.padding = '20mm';
            receiptElement.style.backgroundColor = 'white';
            receiptElement.style.fontFamily = 'Arial, sans-serif';
            receiptElement.style.position = 'absolute';
            receiptElement.style.left = '-9999px';
            receiptElement.innerHTML = generateReceiptContent(declaration, receiptNumber);

            // Ajouter l'élément au document
            document.body.appendChild(receiptElement);

            // Convertir en canvas puis en PDF
            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`recepisse_officiel_${receiptNumber}.pdf`);

            // Nettoyer
            document.body.removeChild(receiptElement);
        } catch (error) {
            console.error('Erreur lors de la génération du récépissé:', error);
            toast.error('Erreur lors de la génération du récépissé');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="receipt-generator">
            <button 
                onClick={generateReceipt}
                className="btn primary-btn"
                disabled={isGenerating || declaration.status === 'Refusée'}
                style={{ 
                    marginTop: '20px',
                    opacity: declaration.status === 'Refusée' ? '0.6' : '1',
                    cursor: declaration.status === 'Refusée' ? 'not-allowed' : 'pointer'
                }}
            >
                {isGenerating ? 'Génération en cours...' : 
                 declaration.status === 'Refusée' ? 'Récépissé non disponible' : 
                 'Établir le récépissé officiel'}
            </button>
            {receiptNumber && (
                <div className="receipt-info">
                    <p>Récépissé N° {receiptNumber} établi le {dayjs().format('DD/MM/YYYY')}</p>
                    <div 
                        className="receipt-preview"
                        dangerouslySetInnerHTML={{ __html: generateReceiptContent(declaration, receiptNumber) }}
                    />
                </div>
            )}
        </div>
    );
}

export default ReceiptGenerator; 