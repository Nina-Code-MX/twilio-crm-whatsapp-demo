import express from 'express';
import bodyParser from 'body-parser';
import whatsappRouter from './routes/whatsapp';
import smsRouter from './routes/sms';
import recordingRouter from './routes/recording';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/whatsapp', whatsappRouter);
app.use('/sms', smsRouter);
app.use('/recording', recordingRouter);

export default app;
