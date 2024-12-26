import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('campaigns', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description').nullable();
        table.enum('status', ['active', 'inactive']).defaultTo('active');
        table.enum('type', ['whatsapp', 'sms', 'email', 'facebook', 'instagram', 'google']).defaultTo('whatsapp');
        table.string('twilio_name').nullable();
        table.string('twilio_sid').nullable();
        table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
        table.dateTime('updated_at').notNullable().defaultTo(knex.fn.now());
        table.dateTime('deletead_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('campaigns');
}

