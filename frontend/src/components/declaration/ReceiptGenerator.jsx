import React, { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import api from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

dayjs.locale('fr');

function ReceiptGenerator({ declaration, onReceiptGenerated }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [receiptNumber, setReceiptNumber] = useState(declaration.receiptNumber || '');

    const generateReceipt = async () => {
        try {
            setIsGenerating(true);
            
            // Générer un numéro de récépissé si non existant
            if (!receiptNumber) {
                const newReceiptNumber = `REC-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                setReceiptNumber(newReceiptNumber);
                
                // Mettre à jour la déclaration avec le numéro de récépissé
                try {
                    const response = await api.put(`/declarations/${declaration._id}`, {
                        receiptNumber: newReceiptNumber,
                        receiptDate: new Date().toISOString()
                    });
                    
                    if (response.data) {
                        toast.success('Récépissé généré avec succès !');
                        if (onReceiptGenerated) {
                            onReceiptGenerated(newReceiptNumber);
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de la mise à jour du récépissé:', error);
                    toast.error('Erreur lors de la mise à jour du récépissé');
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
            receiptElement.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
                    <h1 style="font-size: 24px; margin-bottom: 10px;">Récépissé Officiel de Déclaration de Perte</h1>
                    <p style="font-size: 16px;">N° ${receiptNumber}</p>
                    <p style="font-size: 16px;">Date d'émission: ${dayjs().format('DD MMMM YYYY')}</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 20px; margin-bottom: 15px;">Informations de la Déclaration</h2>
                    <p style="font-size: 14px; margin: 5px 0;"><strong>Type de déclaration:</strong> ${declaration.declarationType === 'objet' ? 'Perte d\'objet' : 'Disparition de personne'}</p>
                    <p style="font-size: 14px; margin: 5px 0;"><strong>Date de la déclaration:</strong> ${dayjs(declaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                    <p style="font-size: 14px; margin: 5px 0;"><strong>Lieu de la perte:</strong> ${declaration.location}</p>
                    
                    ${declaration.declarationType === 'objet' && declaration.objectDetails ? `
                        <h3 style="font-size: 18px; margin: 15px 0;">Détails de l'objet perdu</h3>
                        <p style="font-size: 14px; margin: 5px 0;"><strong>Catégorie:</strong> ${declaration.objectDetails.objectCategory}</p>
                        <p style="font-size: 14px; margin: 5px 0;"><strong>Nom:</strong> ${declaration.objectDetails.objectName}</p>
                        ${declaration.objectDetails.objectBrand ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Marque:</strong> ${declaration.objectDetails.objectBrand}</p>` : ''}
                        ${declaration.objectDetails.color ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Couleur:</strong> ${declaration.objectDetails.color}</p>` : ''}
                        ${declaration.objectDetails.serialNumber ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Numéro de série:</strong> ${declaration.objectDetails.serialNumber}</p>` : ''}
                    ` : ''}
                    
                    ${declaration.declarationType === 'personne' && declaration.personDetails ? `
                        <h3 style="font-size: 18px; margin: 15px 0;">Détails de la personne disparue</h3>
                        <p style="font-size: 14px; margin: 5px 0;"><strong>Nom:</strong> ${declaration.personDetails.lastName}</p>
                        <p style="font-size: 14px; margin: 5px 0;"><strong>Prénom:</strong> ${declaration.personDetails.firstName}</p>
                        <p style="font-size: 14px; margin: 5px 0;"><strong>Date de naissance:</strong> ${dayjs(declaration.personDetails.dateOfBirth).format('DD MMMM YYYY')}</p>
                        ${declaration.personDetails.lastSeenLocation ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Dernier lieu vu:</strong> ${declaration.personDetails.lastSeenLocation}</p>` : ''}
                    ` : ''}
                    
                    <h3 style="font-size: 18px; margin: 15px 0;">Description détaillée</h3>
                    <p style="font-size: 14px; margin: 5px 0;">${declaration.description}</p>
                </div>
                
                <div style="margin-top: 50px; border-top: 1px solid #000; padding-top: 20px;">
                    <p style="font-size: 14px; margin: 5px 0;"><strong>Commissariat:</strong> ${declaration.commissariat?.name || 'Non assigné'}</p>
                    <p style="font-size: 14px; margin: 5px 0;"><strong>Adresse du commissariat:</strong> ${declaration.commissariat?.address || 'Non disponible'}</p>
                    <p style="font-size: 14px; margin: 5px 0;"><strong>Téléphone:</strong> ${declaration.commissariat?.phone || 'Non disponible'}</p>
                    
                    <div style="margin-top: 50px;">
                        <p style="font-size: 14px; margin: 5px 0;">Signature et cachet du commissariat</p>
                        <div style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></div>
                    </div>
                </div>
            `;

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
                disabled={isGenerating}
                style={{ marginTop: '20px' }}
            >
                {isGenerating ? 'Génération en cours...' : 'Établir le récépissé officiel'}
            </button>
            {receiptNumber && (
                <p className="receipt-info">
                    Récépissé N° {receiptNumber} établi le {dayjs().format('DD/MM/YYYY')}
                </p>
            )}
        </div>
    );
}

export default ReceiptGenerator; 