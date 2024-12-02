import { Router } from 'express';
import * as enVoice from './../../locales/en/ninacode-general.json';
import * as esVoice from './../../locales/es/ninacode-general.json';
import dotenv from "dotenv";
import i18next from '../../i18n.config';
import Utils from '../../lib/utils';

dotenv.config();
i18next.addResourceBundle('en', 'voice', enVoice, true, true);
i18next.addResourceBundle('es', 'voice', esVoice, true, true);
i18next.setDefaultNamespace('voice');

const ninacodeRouter: Router = Router();
const VoiceResponse = require('twilio').twiml.VoiceResponse;

ninacodeRouter.get('/', async (req, res) => {
    res.status(200).json({ message: 'Listening...' });
});

ninacodeRouter.post('/', async (req, res) => {
    if (!Utils.validateSignature(req)) {
        res.status(403).send('Forbidden');
        return;
    }

    const twiml = new VoiceResponse();

    twiml.say(
        { language: 'es-MX', voice: 'Polly.Mia' },
        i18next.t('voice.unavailable')
    );
    twiml.pause({ length: 2 });
    twiml.record({ maxLength: 20 });
    twiml.hangup();

    res.type('text/xml').status(200).send(twiml.toString());
});

export default ninacodeRouter;