import db from "../database";

export interface Campaign {
    id?: number;
    name: string;
    description?: string;
    status: string;
    type: string;
    twilio_name?: string;
    twilio_sid?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
};

export default class Campaigns {

    static async find(id: number): Promise<Campaign> {
        try {
            return await db('campaigns').where({ id }).first() as Campaign;
        } catch (error) {
            console.error('Error finding campaign: ', error);
            return {} as Campaign;
        }
    }

    static async findAll(): Promise<Campaign[]> {
        try {
            return await db('cammpaigns') as Campaign[];
        } catch (error) {
            console.error('Error finding all campaigns: ', error);
            return [];
        }
    }

    static async where(raw: string): Promise<Campaign[]> {
        try {

            return await db('campaigns').whereRaw(raw) as Campaign[];
        } catch (error) {
            console.error('Error finding campaign where: ', error);
            return [];
        }
    }

}