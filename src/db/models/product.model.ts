import { UUID } from "crypto";
import mysql, { RowDataPacket } from "mysql2/promise"
import dbConfig from "../../db.config";

export interface Product extends RowDataPacket {
    id?: UUID;
    laboratory_id?: UUID;
    owner_account_id?: UUID;
    name?: string;
    description?: string;
    code?: string;
    eta?: number;
    image?: string;
    is_visible?: boolean;
    price?: number;
    currency?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export default class Products {
    private static connection: mysql.Connection;

    static async connect(): Promise<void> {
        try {
            Products.connection = await mysql.createConnection(dbConfig);
        } catch(error) {
            console.error('Error connecting to the database: ', error);
        }
    }

    static async create(product: Product): Promise<Product> {
        return product;
    }

    static async update(product: Product): Promise<Product> {
        return product;
    }

    static async delete(id: UUID): Promise<void> {
        return;
    }

    static async findById(id: UUID): Promise<Product | null> {
        await Products.connect();
        try {
            const [rows] = await Products.connection.query<Product[]>('SELECT * FROM products WHERE id = ?', [id]);
            await Products.connection.end();
            return rows[0] || null;
        } catch(error) {
            console.error('Error finding product by id: ', error);
            return null;
        }
    }

    static async findAll(): Promise<Product[]> {
        await Products.connect();

        try {
            const [rows] = await Products.connection.query<Product[]>('SELECT * FROM products');
            await Products.connection.end();
            return rows;
        } catch (error) {
            console.error('Error finding all products: ', error);
            return [];
        }
    }
}