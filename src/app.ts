import express from 'express';
import bodyParser from 'body-parser';
import { crmRouter, sendColdMessageRouter } from './routes/whatsapp/index';
import { ninaCodeRouter as ninaCodeVoiceRouter } from './routes/voice';
import { ninaCodeRouter as ninaCodeSMSRouter } from './routes/sms';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/sms/ninacode', ninaCodeSMSRouter);
app.use('/voice/ninacode', ninaCodeVoiceRouter);
app.use('/whatsapp/crm', crmRouter);
app.use('/whatsapp/sendColdMessage', sendColdMessageRouter);

export default app;
