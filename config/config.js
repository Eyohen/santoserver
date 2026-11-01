require('dotenv').config();

// Local Postgres needs no TLS; hosted databases set DB_SSL=true.
const ssl = process.env.DB_SSL === 'true';

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  dialectOptions: ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  logging: false,
};

module.exports = { development: base, production: base };
