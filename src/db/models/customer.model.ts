import db from "../database";

export interface Notification {
    whatsapp?: boolean;
    email?: boolean;
    sms?: boolean;
};

export interface Customer {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    notifications?: Notification;
    created_at?: Date;
    updated_at?: Date;
};

export default class Customers {

    static async findAll(): Promise<Customer[]> {
        try {
            return await db('customers') as Customer[];
        } catch (error) {
            console.error('Error finding all customers: ', error);
            return [];
        }
    }

    static async getUnsetByCampaign(campaignId: number): Promise<Customer[]> {
        try {
            return await db('customers')
                .whereNotIn(
                    'id', 
                    db('tracking_campaigns').select('customer_id').where({ campaign_id: campaignId })
                ) as Customer[];
        } catch (error) {
            console.error('Error finding unset customers by campaign: ', error);
            return [];
        }
    }

}