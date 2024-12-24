import knex from "knex";
import config from "../knexfile";
import dotenv from "dotenv";

dotenv.config();

const db = knex(config[process.env.NODE_ENV || "development"]);

export default db;