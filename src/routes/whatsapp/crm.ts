import { Router } from 'express';
import { Twilio } from 'twilio';
import { UUID } from 'crypto';
import dotenv from "dotenv";
import i18next from '../../i18n.config';
import Products, { Product } from '../../db/models/product.model';
import Utils from '../../lib/utils';

dotenv.config();

type ConversationState = {
    step: string;
    config?: any;
    data: {
        product: Product;
        patientName: string;
        patientPhone: string;
        patientEmail: string;
        confirm: boolean;
    };
};

type Conversation = {
    id: string;
    accountSid?: string;
    from: string;
    mediaContentType?: string;
    mediaUrl?: string;
    message: string;
};

type webhookRespose = {
    errors?: any[];
    message: string;
    status: string;
};

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const crmRouter: Router = Router();
const conversationState: Record<string, ConversationState> = {};

/**
 * Handle incoming webhook from Twilio
 */
crmRouter.post('/', async (req, res) => {
    const conv: Conversation = {
        id: req.body.WaId || '',
        accountSid: req.body.AccountSid || '',
        from: req.body.From || '',
        mediaContentType: req.body.MediaContentType0 || '',
        mediaUrl: req.body.MediaUrl0 || '',
        message: req.body.Body || '',
    }

    if (!conv.from) {
        const response: webhookRespose = { errors: ['No WaId provided.'], message: "Conversation not started", status: "error" };
        res.status(200).json(response)
    } else {
        conversationGo(res, conv);
    }
});

/**
 * Start a conversation
 * 
 * @param {any} res
 * @param {Conversation} conversation
 * 
 * @returns {Promise<void>}
 */
const conversationGo = async (res: any, conversation: Conversation): Promise<void> => {
    if (!conversationState[conversation.id]) {
        conversationState[conversation.id] = {
            step: "start",
            config: {},
            data: {
                product: {} as Product,
                patientName: "",
                patientPhone: "",
                patientEmail: "",
                confirm: false,
            }
        };
    }

    const userState = conversationState[conversation.id];

    if (!userState?.config?.From) {
        userState.config.From = conversation.from.replace("whatsapp:", "");
    }

    if (!userState?.config?.id) {
        userState.config.id = conversation.id;
    }

    if (!userState?.config?.AccountSid) {
        userState.config.AccountSid = conversation.accountSid || '';
    }

    let reply = i18next.t('common:crm.initial');

    if (userState.step === "start") {
        if (conversation.message.toLowerCase() === "status") {
            userState.step = "status-order";
            reply = i18next.t('common:crm.status.start');
        } else if (["request", "solicitar"].includes(conversation.message.toLowerCase())) {
            userState.step = "request-product";
            reply = i18next.t('common:crm.request.patient_name');

            const interactiveMessage = {
                to: conversation.from,
                from: "whatsapp:" + process.env.TWILIO_NUMBER,
                contentSid: process.env.TWILIO_TEMPLATE_PRODUCTS || '',
            } as any;

            sendMessageInteractive(conversation.from, interactiveMessage);

            return;
        }
    } else if (userState.step === "status-order") {
        const orderNumber = conversation.message;
        const orderStatus = "Processing";
        userState.step = "start";
        reply = i18next.t('common:crm.status.found', { orderNumber, orderStatus });
    } else if (userState.step === "request-product") {
        userState.data.product = await Products.findById(conversation.message as UUID) || {} as Product;
        userState.step = "request-name";
        reply = i18next.t('common:crm.request.patient_name');
    } else if (userState.step === "request-name") {
        if (conversation.mediaContentType === "text/vcard" && conversation.mediaUrl) {
            let { name, phone, email } = await Utils.getVcardDetails(conversation.mediaUrl);

            userState.data.patientName = name;
            userState.data.patientPhone = phone;
            userState.data.patientEmail = email;
            
            if (name === "Unknown") {
                userState.step = "request-name";
                reply = i18next.t('common:crm.request.unknown_patient_name');
            } else if (phone === "Unknown") {
                userState.step = "request-phone";
                reply = i18next.t('common:crm.request.unknown_patient_phone');
            } else if (email === "Unknown") {
                userState.step = "request-email";
                reply = i18next.t('common:crm.request.unknown_patient_email');
            } else {
                userState.step = "request-confirm";
                reply = i18next.t('common:crm.request.confirm_info', {
                    patientName: userState.data.patientName,
                    patientPhone: userState.data.patientPhone,
                    patientEmail: userState.data.patientEmail,
                    productName: userState.data.product.name
                });
            }
        } else {
            userState.data.patientName = conversation.message;
            userState.step = "request-phone";
            reply = i18next.t('common:crm.request.patient_phone');
        }
    } else if (userState.step === "request-phone") {
        userState.data.patientPhone = conversation.message;
        userState.step = "request-email";
        reply = i18next.t('common:crm.request.patient_email');
    } else if (userState.step === "request-email") {
        userState.data.patientEmail = conversation.message;
        userState.step = "request-confirm";
        reply = i18next.t('common:crm.request.confirm_info', {
            patientName: userState.data.patientName,
            patientPhone: userState.data.patientPhone,
            patientEmail: userState.data.patientEmail,
            productName: userState.data.product.name
        });
    } else if (userState.step === "request-confirm") {
        userState.data.confirm = ["yes", "si"].includes(conversation.message.toLowerCase()) ? true : false;
        userState.step = "start";

        if (userState.data.confirm) {
            reply = i18next.t('common:crm.request.created', { orderNumber: "xxxx" });
        } else {
            reply = i18next.t('common:crm.request.cancelled');
        }
    } else {
        userState.step = "start";
        reply = i18next.t('common:crm.request.unknown_option');
    }

    sendMessage(conversation.from, reply);

    const response: webhookRespose = { message: "Conversation started", status: "success" };

    return res.status(200).json(response);
}

/**
 * Send a message to a WhatsApp number
 * 
 * @param {string} to
 * @param {string} reply
 * @returns {Promise<void>}
 */
const sendMessage = async (to: string, reply: string): Promise<void> => {
    try {
        await client.messages.create({
            from: 'whatsapp:' + process.env.TWILIO_NUMBER,
            to: to,
            body: reply,
        });
    } catch (error) {
        console.error(error);
    }
};

/**
 * Send an interactive message to a WhatsApp number
 * 
 * @param {string} to
 * @param {any} interactive
 * @returns {Promise<void>}
 */
const sendMessageInteractive = async (to: string, interactive: any): Promise<void> => {
    try {
        await client.messages.create(interactive);
    } catch (error) {
        console.error(error);
    }
};

export default crmRouter;
