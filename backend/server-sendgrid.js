const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email, code, username } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email et code requis' });
    }

    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Code de vérification - Comptabilité',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #059669; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Comptabilité Chrétiens</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <h2 style="color: #111827; margin-top: 0;">Bonjour ${username || 'Utilisateur'},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Voici votre code de vérification pour réinitialiser votre PIN :
              </p>
              <div style="background: #f0fdf4; border: 2px dashed #059669; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #059669; font-size: 48px; margin: 0; letter-spacing: 10px;">
                  ${code}
                </h1>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Ce code expire dans 15 minutes. Si vous n'avez pas demandé ce code, veuillez ignorer cet email.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              © 2024 Comptabilité Chrétiens
            </div>
          </div>
        `
      };

      await sgMail.send(msg);
      res.json({ success: true, message: 'Code envoyé avec succès' });
    } else {
      res.json({ 
        success: true, 
        message: 'Mode démo - code affiché dans l\'application',
        code: code
      });
    }
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur en ligne' });
});

app.listen(PORT, () => {
});
