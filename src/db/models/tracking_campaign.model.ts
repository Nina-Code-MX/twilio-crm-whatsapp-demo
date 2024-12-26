import db from "../database";

export interface TrackingCampaign {
    id?: number;
    campaign_id: number;
    customer_id: number;
    created_at?: Date;
    updated_at?: Date;
};

export default class TrackingCampaigns {

    static async create(trackingCampaign: TrackingCampaign): Promise<number> {
        try {
            const [id] = await db('tracking_campaigns').insert(trackingCampaign);
            return id;
        } catch (error) {
            console.error('Error creating tracking_campaign: ', error);
            return 0;
        }
    }

    static async find(id: number): Promise<TrackingCampaign> {
        try {
            return await db('tracking_campaigns').where({ id }).first() as TrackingCampaign;
        } catch (error) {
            console.error('Error finding tracking_campaign: ', error);
            return {} as TrackingCampaign;
        }
    }

    static async findAll(): Promise<TrackingCampaign[]> {
        try {
            return await db('tracking_cammpaigns') as TrackingCampaign[];
        } catch (error) {
            console.error('Error finding all tracking_campaigns: ', error);
            return [];
        }
    }

    static async where(raw: string): Promise<TrackingCampaign[]> {
        try {

            return await db('tracking_campaigns').whereRaw(raw) as TrackingCampaign[];
        } catch (error) {
            console.error('Error finding campaign where: ', error);
            return [];
        }
    }

}