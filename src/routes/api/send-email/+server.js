import { json } from '@sveltejs/kit';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set in environment variables');
}

sgMail.setApiKey(SENDGRID_API_KEY);

export async function POST({ request }) {
    try {
        const { to, subject, patientName, signingLink } = await request.json();

        if (!SENDGRID_API_KEY) {
            throw new Error('SendGrid API key is not configured');
        }

        const msg = {
            to,
            from: 'medcmsrv@gmail.com', // Update this with your verified sender
            subject,
            text: `Hello ${patientName},\n\nPlease click the following link to sign your ICF document: ${signingLink}`,
            html: `
                <h2>Hello ${patientName},</h2>
                <p>Please click the following link to sign your ICF document:</p>
                <p><a href="${signingLink}">${signingLink}</a></p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        const result = await sgMail.send(msg);
        console.log('SendGrid API Response:', result);
        return json({ success: true });

    } catch (error) {
        console.error('Error sending email:', error.toString());
        return json({ 
            error: error.toString(),
            details: error.response?.body || 'No additional details available'
        }, { status: 500 });
    }
} 