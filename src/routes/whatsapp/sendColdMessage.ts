import { Router } from 'express';
import { Twilio } from 'twilio';
import dotenv from "dotenv";

dotenv.config();

const limitPerSecond = 80;
const sendColdMessageRouter: Router = Router();
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

type ReqBody = {
    from: string;
    to: string;
    body?: string;
    contentSid?: string;
    contentVariables?: string;
};

sendColdMessageRouter.post('/', async (req, res) => {
    const to: string = req.body.From || '';

    if (!to) {
        res.status(400).json({ message: 'Invalid request' });
        return;
    }

    const createMessage: ReqBody = {
        from: `whatsapp:${process.env.TWILIO_NUMBER}`,
        to: `whatsapp:${to}`,
        contentSid: process.env.TWILIO_TEMPLATE_SEND_WA_MESSAGE || ''
    };

    try {
        await client.messages.create(createMessage);
    } catch (error) {
        console.error(error);
    }

    res.status(200).json({ message: 'Message sent successfully' });
});

export default sendColdMessageRouter;