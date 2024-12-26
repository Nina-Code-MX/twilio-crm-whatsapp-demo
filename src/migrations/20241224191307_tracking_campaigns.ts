import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('tracking_campaigns', (table) => {
        table.increments('id').primary();
        table.integer('campaign_id').unsigned().notNullable();
        table.integer('customer_id').unsigned().notNullable();
        table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
        table.dateTime('updated_at').notNullable().defaultTo(knex.fn.now());

        table.foreign('campaign_id').references('campaigns.id');
        table.foreign('customer_id').references('customers.id');
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('tracking_campaigns');
}

