import { Router } from 'express';
import { Twilio } from 'twilio';
import dotenv from "dotenv";

dotenv.config();

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const conversationState: Record<string, { step: string; config?: any, data?: any }> = {};
//const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const router = Router();

/* Request body example:
{
  SmsMessageSid: 'SM5fd81c607050e5a6349d9d376be12160',
  NumMedia: '0',
  ProfileName: 'Germán González',
  MessageType: 'text',
  SmsSid: 'SM5fd81c607050e5a6349d9d376be12160',
  WaId: '5213310723661',
  SmsStatus: 'received',
  Body: 'Howdy',
  To: 'whatsapp:+14155238886',
  NumSegments: '1',
  ReferralNumMedia: '0',
  MessageSid: 'SM5fd81c607050e5a6349d9d376be12160',
  AccountSid: 'ACaca1c90659ba3c848d22e89975741d3f',
  From: 'whatsapp:+5213310723661',
  ApiVersion: '2010-04-01'
}
*/

router.post('/', async (req, res) => {
    const incomingMessage = req.body.Body?.toLowerCase().trim();
    const WaId = req.body.WaId || null;
    const from = req.body.From;
    const mediaContentType = req.body.MediaContentType0 || null;
    const mediaUrl = req.body.MediaUrl0 || null;

    console.log(`Incomming webhook:`, req.body);
    console.log(`conversationState:`, conversationState || null);

    if (!conversationState[WaId]) {
        conversationState[WaId] = { step: "start", config: {}, data: {} };
    }

    const userState = conversationState[WaId];

    if (!userState?.config?.From) {
        userState.config.From = from.replace("whatsapp:", "");
    }

    if (!userState?.config?.WaId) {
        userState.config.WaId = WaId;
    }

    if (!userState?.config?.AccountSid) {
        userState.config.AccountSid = req.body.AccountSid || null;
    }

    let reply = `*CRM*
Thanks for reaching out!

Reply with '*request*' _If you would like to create a request._
Reply '*status*' _If your would like to get the status of one of your requests._`;

    if (mediaUrl && mediaContentType && mediaUrl === "text/vcard") {
        // userState.step = "request-name";
    }

    if (userState.step === "start") {
        if (incomingMessage === "status") {
            userState.step = "status-order";
            reply = `Please provide your order number:`;
        } else if (incomingMessage === "request") {
            userState.step = "request-product";
            //userState.step = "request-name";
            reply = `Please provide the patient's name:`;

            const interactiveMessage = {
                to: from,
                from: "whatsapp:" + process.env.TWILIO_NUMBER,
                interactive: {
                    type: "list", // Change to "button" for button messages
                    header: {
                        type: "text",
                        text: "Choose a Product",
                    },
                    body: {
                        text: "Here are our available products. Tap to select one:",
                    },
                    footer: {
                        text: "Reply with your selection.",
                    },
                    sections: [
                        {
                            title: "Available Products",
                            rows: [
                                {
                                    id: "product_1",
                                    title: "Product 1",
                                    description: "Description of Product 1",
                                },
                                {
                                    id: "product_2",
                                    title: "Product 2",
                                    description: "Description of Product 2",
                                },
                            ],
                        },
                    ],
                },
            } as any;

            sendMessageInteractive(from, interactiveMessage);

            return;
        } else {
            // reply = `Hello! Reply with 'Request' to create a request or 'Status' to check your order.`;
        }
    } else if (userState.step === "status-order") {
        const orderNumber = incomingMessage;
        const orderStatus = "Processing";
        userState.step = "start";
        reply = `Your order number ${orderNumber} is currently ${orderStatus}.`;
    } else if (userState.step === "request-product") {
        userState.data = { product: incomingMessage };
        userState.step = "request-name";
        reply = `Please provide the patient's name:`;
    } else if (userState.step === "request-name") {
        userState.data = { patientName: incomingMessage };
        userState.step = "request-phone";
        reply = `Please provide the patient's phone number:`;
    } else if (userState.step === "request-phone") {
        userState.data.patientPhone = incomingMessage;
        userState.step = "request-email";
        reply = `Please provide the patient's email:`;
    } else if (userState.step === "request-email") {
        userState.data.patientEmail = incomingMessage;
        userState.step = "start"; // Reset state
        reply = `Request created. This is your order number: xxxx`;
    } else {
        userState.step = "start";
        reply = `Sorry, I didn't understand that. Please start again.`;
    }

    /*if (userState.step === "start") {
        if (incomingMessage === "status") {
            userState.step = "status-order";
            reply = `Please provide the order number`;
        } else if (incomingMessage === "request") {
            userState.step = "request-name";
            reply = `Please provide the patient name or attach the contact vcard from WhatsApp`;
        }
    } else if (userState.step === "status-order") {
        if (incomingMessage === "restart") {
            userState.step = "start";
        } else {
            let regExpProduct = new RegExp(/^[a-z0-9]{5}$/);
            let orderNumber = incomingMessage.split("-");
            let productId = orderNumber[0];
            let orderId = parseInt(orderNumber[1]);

            if (regExpProduct.test(productId) && orderId > 0) {
                // DB loookup
                const testRecord: Record<string, {id: string, code: string, status: string, name: string, order_number: number}> = {
                    "g360a": {id: "G360A-1111", code: 'code', status: "In Progress", name: "Invitate Onco", order_number: 1367},
                };

                const record = testRecord[productId];

                if (record) {
                    userState.step = "start";
                    reply = `Your *${record.name}* request is *${record.status}*. Thank you for reaching out!`;
                } else {
                    reply = `Sorry, I couldn't find that order. Try again or type restart to start over.`;
                }
            } else {
                reply = `Sorry, That is not a valid order number. Please try again or type restart to start over.`;
            }
        }
    } else if (userState.step === "request-name") {
        userState.step = "request-name";

        if (mediaContentType === "text/vcard") {
            let { name: patientName, phone: patientPhone } = await getVcardDetails(mediaUrl);

            if (patientName === "Unknown") {
                reply = `Sorry, we couldn't retrieve the patient name.`;
            } else if (patientPhone === "Unknown") {
                reply = `Sorry, we couldn't retrieve the patient phone.`;
            } else {
                userState.step = "request-confirm";
                userState.data = { patientName, patientPhone };
                reply = `Your patient information is:\nName: ${patientName}\nPhone: ${patientPhone}\n\If this is correct please reply with 'yes' or 'no' to start over.`;
            }
        } else {
            if (
                (userState.data.hasOwnProperty("patientName") && userState.data.hasOwnProperty("patientPhone"))
                &&
                (userState.data.patientName && userState.data.patientName)
            ) {
                let { patientName, patientPhone } = userState.data;
                userState.step = "request-confirm";
                reply = `Your patient information is:\nName: ${patientName}\nPhone: ${patientPhone}\n\If this is correct please reply with 'yes' or 'no' to start over.`;
            } else if (
                (!userState.data.hasOwnProperty("patientName"))
                &&
                (!userState.data.patientName)
            ) {
                reply = `Please provide the patient name`;
            } else if (
                (!userState.data.hasOwnProperty("patientPhone"))
                &&
                (!userState.data.patientPhone)
            ) {
                userState.step = "request-confirm";
                userState.data.patientName = incomingMessage;
                reply = `Please provide the patient phone (a)`;
            } else {
                reply = `Please provide the patient phone (b)`;
            }
        }
    } else if (userState.step === "request-confirm") {
        reply = `Your request has been submitted. We will contact you shortly.`;
    } else {
        userState.step = "start";
        reply = `Sorry, I didn't understand that. Please try again.`;
    }*/

    sendMessage(from, reply);
});

/**
 * Get vCard details from media URL
 * 
 * @param mediaUrl 
 * @returns Promise<{name: string, phone: string}>
 */
const getVcardDetails = async (mediaUrl: string): Promise<{name: string, phone: string}> => {
    try {
        const response = await fetch(mediaUrl, {
            headers: {
                Authorization: `Basic ` + Buffer
                    .from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`)
                    .toString("base64"),
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download media: ${response.statusText}`);
        }

        const vCard = await response.text();
        console.log(`vCard: `, vCard);
        const nameMatch = vCard.match(/FN:(.+)/);
        const telMatch = vCard.match(/TEL;.*:(.+)/);

        return { name: nameMatch ? nameMatch[1] : "Unknown", phone: telMatch ? telMatch[1] : "Unknown" };
    } catch (error) {
        console.error(error);
        return { name: "Unknown", phone:  "Unknown" };
    }
};

/**
 * Send a message to a WhatsApp number
 * 
 * @param to
 * @param reply
 * @returns void
 */
const sendMessage = async (to: string, reply: string) => {
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

const sendMessageInteractive = async (to: string, interactive: any) => {
    try {
        const payload = {
            from: 'whatsapp:' + process.env.TWILIO_NUMBER,
            to: to,
            messagingServiceSid: 'MG7c0d156c071e80cb378b9a7757ffc32e',
            interactive: interactive
        } as any;

        await client.messages.create(payload);
    } catch (error) {
        console.error(error);
    }
};

export default router;

// https://smee.io/ninacodemx
// https://timberwolf-mastiff-9776.twil.io/demo-reply