import { Router } from 'express';
import { Twilio } from 'twilio';
import dotenv from "dotenv";
import Customers, { Customer, Notification } from '../../db/models/customer.model';

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
    const campaign: string = req.body.template_name || null;

    if (!campaign) {
        res.status(400).json({ message: 'Invalid request' });
        return;
    }

    const contentSid: string|null = await validateTemplate(campaign);

    if (!contentSid) {
        res.status(400).json({ message: 'Invalid template' });
        return;
    }

    const customers: Customer[] = await Customers.findAll();

    customers.map(customer => customer.notifications = JSON.parse(customer.notifications as string));
    customers.forEach(async (customer) => {
        if (customer?.notifications?.whatsapp) {
            const createMessage: ReqBody = {
                from: `whatsapp:${process.env.TWILIO_NUMBER}`,
                to: `whatsapp:${customer.phone}`,
                contentSid: contentSid
            };

            try {
                await client.messages.create(createMessage);
            } catch (error) {
                console.error(error);
            }
        }
    });

    res.status(200).json({ message: 'Message sent successfully' });
});

/**
 * Validate if Template exists and approved.
 * 
 * @param {string} templateName 
 * @returns {Promise<string|null>}
 */
const validateTemplate = async (templateName: string): Promise<string|null> => {
    try {
        const exists = await client.content.v2.contentAndApprovals.list({ contentName: templateName });

        if (exists.length > 0 && exists[0].approvalRequests.status === 'approved') {
            return exists[0].sid;
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
};

export default sendColdMessageRouter;