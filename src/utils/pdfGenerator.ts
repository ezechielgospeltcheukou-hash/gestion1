import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export const generateSaleReceiptPDF = async (sale: any, businessConfig: any) => {
  try {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 20px; }
            .business-name { font-size: 24px; font-weight: bold; color: #059669; }
            .receipt-title { font-size: 18px; margin-top: 5px; color: #666; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .details-table th, .details-table td { border-bottom: 1px solid #eee; padding: 10px 5px; text-align: left; }
            .details-table th { background-color: #f9fafb; color: #666; font-size: 12px; text-transform: uppercase; }
            .total-row { font-weight: bold; font-size: 16px; }
            .total-row td { border-bottom: 2px solid #059669; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="business-name">${businessConfig.label || 'Commerce'}</div>
            <div class="receipt-title">Reçu de Vente</div>
          </div>
          
          <div class="info-row">
            <span><strong>Date :</strong> ${new Date(sale.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
            <span><strong>Référence :</strong> ${sale.transactionReference || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span><strong>Méthode de paiement :</strong> ${sale.paymentMethod || 'Espèces'}</span>
            <span><strong>Vendeur :</strong> ${sale.soldBy || 'N/A'}</span>
          </div>

          <table class="details-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Quantité</th>
                <th style="text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${sale.productName || 'Produit'}</td>
                <td>${sale.quantity}</td>
                <td style="text-align: right">${sale.totalPrice?.toLocaleString()} FCFA</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; padding-top: 20px;"><strong>TOTAL PAYÉ</strong></td>
                <td style="text-align: right; padding-top: 20px; color: #059669;"><strong>${sale.totalPrice?.toLocaleString()} FCFA</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Merci pour votre confiance !</p>
            <p>Généré par Comptabilité Chrétiens</p>
          </div>
        </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      // Sur le web, on utilise l'impression native du navigateur
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        Alert.alert('Erreur', 'Veuillez autoriser les fenêtres pop-up pour imprimer.');
      }
      return;
    }

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Partager le reçu de vente'
      });
    } else {
      Alert.alert('Information', 'Le partage n\'est pas disponible sur cet appareil. Le fichier est enregistré à : ' + uri);
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF :', error);
    Alert.alert('Erreur', 'Impossible de générer le reçu PDF.');
  }
};

export const generateBilanPDF = async (stats: any, businessConfig: any, periodLabel: string) => {
  try {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .business-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .report-title { font-size: 18px; margin-top: 5px; color: #666; }
            .period { font-size: 14px; color: #999; margin-top: 5px; }
            
            .section { margin-top: 30px; }
            .section-title { font-size: 16px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            
            .metrics-grid { display: flex; flex-wrap: wrap; gap: 15px; }
            .metric-card { flex: 1; min-width: 150px; background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; }
            .metric-card.green { border-left-color: #059669; }
            .metric-card.red { border-left-color: #dc2626; }
            .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
            .metric-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 5px; }
            
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="business-name">${businessConfig.label || 'Commerce'}</div>
            <div class="report-title">Rapport d'Activité et Bilan Financier</div>
            <div class="period">Période : ${periodLabel}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Performances Commerciales</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Chiffre d'Affaires</div>
                <div class="metric-value">${stats.chiffreAffaires?.total?.toLocaleString() || 0} FCFA</div>
              </div>
              <div class="metric-card green">
                <div class="metric-label">Bénéfice Net</div>
                <div class="metric-value">${stats.resultatNet?.toLocaleString() || 0} FCFA</div>
              </div>
              <div class="metric-card red">
                <div class="metric-label">Dépenses Totales</div>
                <div class="metric-value">${stats.depenses?.total?.toLocaleString() || 0} FCFA</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">État de la Trésorerie</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Encaissements</div>
                <div class="metric-value">${stats.tresorerie?.encaissement?.toLocaleString() || 0} FCFA</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Décaissements</div>
                <div class="metric-value">${stats.tresorerie?.decaissement?.toLocaleString() || 0} FCFA</div>
              </div>
              <div class="metric-card ${stats.tresorerie?.solde >= 0 ? 'green' : 'red'}">
                <div class="metric-label">Solde Caisse</div>
                <div class="metric-value">${stats.tresorerie?.solde?.toLocaleString() || 0} FCFA</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Indicateurs d'Activité</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Ventes</div>
                <div class="metric-value">${stats.indicateurs?.totalVentes || 0}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Panier Moyen</div>
                <div class="metric-value">${stats.indicateurs?.valeurMoyennePanier?.toLocaleString() || 0} FCFA</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Généré par Comptabilité Chrétiens</p>
          </div>
        </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        Alert.alert('Erreur', 'Veuillez autoriser les fenêtres pop-up pour imprimer.');
      }
      return;
    }

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Exporter le bilan PDF'
      });
    } else {
      Alert.alert('Information', 'Le fichier est enregistré à : ' + uri);
    }
  } catch (error) {
    console.error('Erreur lors de la génération du bilan PDF :', error);
    Alert.alert('Erreur', 'Impossible de générer le bilan PDF.');
  }
};
