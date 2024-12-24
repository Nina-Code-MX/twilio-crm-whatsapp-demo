import express from 'express';
import bodyParser from 'body-parser';
import { crmRouter, sendColdMessageRouter } from './routes/whatsapp/index';
import { ninaCodeVoiceRouter } from './routes/voice/index';
import { ninaCodeSMSRouter } from './routes/sms/index';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/sms/ninacode', ninaCodeSMSRouter);
app.use('/voice/ninacode', ninaCodeVoiceRouter);
app.use('/whatsapp/crm', crmRouter);
app.use('/whatsapp/sendColdMessage', sendColdMessageRouter);

export default app;
