import { Router } from 'express';
import * as enVoice from './../../locales/en/ninacode-general.json';
import * as esVoice from './../../locales/es/ninacode-general.json';
import dotenv from "dotenv";
import i18next from '../../i18n.config';
import Utils from '../../lib/utils';

dotenv.config();
i18next.addResourceBundle('en', 'sms', enVoice, true, true);
i18next.addResourceBundle('es', 'sms', esVoice, true, true);
i18next.setDefaultNamespace('sms');

const ninacodeRouter: Router = Router();
const SMSResponse = require('twilio').twiml.MessagingResponse;

ninacodeRouter.get('/', async (req, res) => {
    res.status(200).json({ message: 'Listening...' });
});

ninacodeRouter.post('/', async (req, res) => {
    if (!Utils.validateSignature(req)) {
        console.error('Invalid Twilio signature');
        res.status(403).send('Forbidden');
        return;
    }

    const twiml = new SMSResponse();

    twiml.message({
        from: process.env.TWILIO_PHONE_NUMBER,
    }, 'Goodbye!');
    res.status(200).send('');
    // res.type('text/xml').status(200).send(twiml.toString());
});

export default ninacodeRouter;