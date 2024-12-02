import dotenv from "dotenv";
import TwilioClient from 'twilio';

dotenv.config();

export default class Utils {
    /**
     * Delay function
     * 
     * @param {number} ms 
     * @returns {Promise<void>}
     */
    public static delay = async (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get vCard details from media URL from Twilio
     * 
     * @param {string} mediaUrl 
     * @returns {Promise<{name: string, phone: string, email: string}>}
     */
    public static getVcardDetails = async (mediaUrl: string): Promise<{name: string, phone: string, email: string}> => {
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
            const nameMatch = vCard.match(/FN:(.+)/);
            const telMatch = vCard.match(/TEL;.*:(.+)/);
            const emailMatch = vCard.match(/EMAIL:(.+)/);

            return {
                name: nameMatch ? nameMatch[1] : "Unknown",
                phone: telMatch ? telMatch[1] : "Unknown",
                email: emailMatch ? emailMatch[1] : "Unknown"
            };
        } catch (error) {
            console.error(error);
            return { name: "Unknown", phone:  "Unknown", email: "Unknown" };
        }
    };

    public static validateSignature = (req: any): boolean => {
        return TwilioClient.validateRequest(
            process.env.TWILIO_AUTH_TOKEN || '',
            req.headers['x-twilio-signature'] || '',
            `${process.env.URL}/sms/ninacode`,
            req.body
        );
    };
}
