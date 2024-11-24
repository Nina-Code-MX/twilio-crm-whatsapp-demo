import { Router } from 'express';
import { Twilio } from 'twilio';

const router = Router();

router.post('/', async (req, res) => {
    const message = req.body.Body?.toLowerCase().trim();
    const from = req.body.From;

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>Received ${message} from ${from}</Message></Response>`);
});

export default router;