import { Router } from 'express';
import { Twilio } from 'twilio';
import dotenv from "dotenv";
import Campaigns, { Campaign } from '../../db/models/campaign.model';
import Customers, { Customer } from '../../db/models/customer.model';
import TrackingCampaigns, { TrackingCampaign } from '../../db/models/tracking_campaign.model';


dotenv.config();

const throttle = {
    limit: 80,
    last: Date.now(),
    count: 0
};

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
    const campaign_id: number = req.body.campaign_id || null;

    if (!campaign_id) {
        res.status(400).json({ message: 'Invalid request' });
        return;
    }

    const campaign: Campaign = await Campaigns.find(campaign_id);

    if (campaign.status !== 'active') {
        res.status(400).json({ message: 'Campaign is not active' });
        return;
    }

    const customers: Customer[] = await Customers.getUnsetByCampaign(campaign_id);
    customers.map(customer => customer.notifications = JSON.parse(customer.notifications as string));

    switch (campaign.type) {
        case 'whatsapp':
            await sendWhatsappMessage(campaign, customers, res);
            break;
        default:
            res.status(400).json({ message: 'Invalid campaign type' });
            break;
    }
});

const sendWhatsappMessage = async (campaign: Campaign, customers: Customer[], res: any) => {
    if (!campaign.twilio_name) {
        res.status(400).json({ message: 'Invalid template' });
        return;
    }

    const contentSid: string|null = await validateTemplate(campaign.twilio_name);

    if (!contentSid) {
        res.status(400).json({ message: 'Invalid template' });
        return;
    }

    customers.forEach(async (customer: Customer) => {
        if (customer?.notifications?.whatsapp) {
            const createMessage: ReqBody = {
                from: `whatsapp:${process.env.TWILIO_NUMBER}`,
                to: `whatsapp:${customer.phone}`,
                contentSid: contentSid
            };

            try {
                await client.messages.create(createMessage);

                const tc: TrackingCampaign = {
                    campaign_id: campaign.id || 0,
                    customer_id: customer.id || 0
                };

                TrackingCampaigns.create(tc);
                console.log(`Message sent to ${customer.first_name} ${customer.last_name}`, createMessage);
            } catch (error) {
                console.error(`Error sending message to ${customer.phone}`, error);
            }
        }
    });

    res.status(200).json({ message: 'Message sent successfully' });
};

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