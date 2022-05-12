const knex = require("knex");
const dotenv = require("dotenv");
const Redis = require("ioredis");

dotenv.config();

async function main() {
  console.log("Starting the application");
  try {
    console.log("Testing Postgres Database");
    await createPGDatabase();
    await testNewPGDatabase();
    await deletePGDatabase();
    console.log("Done Testing Postgres Database");
  } catch (error) {
    console.error("Error: ", error);
  }
  try {
    console.log("Testing Redis");
    await testRedisStore();
    console.log("Done Testing Redis");
  } catch (error) {
    console.error("Error: ", error);
  }
}

async function testRedisStore() {
  const redis = new Redis({
    port: parseInt(process.env.REDIS_PORT), // Redis port
    host: process.env.REDIS_HOST, // Redis host
    username: process.env.REDIS_USERNAME, // needs Redis >= 6
    password: process.env.REDIS_PASSWORD,
  });
  try {
    console.log(
      `Redis connection details - host: ${process.env.REDIS_HOST}, port: ${process.env.REDIS_PORT}, username: ${process.env.REDIS_USERNAME}, password: ${process.env.REDIS_PASSWORD}`
    );
    console.log(
      "Trying to set a key 'myname' and value 'Viraj Shelke' in redis"
    );
    await redis.set("myname", "Viraj Shelke");
    console.log("Key value set. Trying to get the value from redis");
    const data = await redis.get("myname");
    console.log("The value for the key 'myname' is: ", data);
  } catch (error) {
    throw error;
  } finally {
    await redis.disconnect();
  }
}

async function testNewPGDatabase() {
  const dbobj = knex({
    client: "pg",
    connection: {
      host: process.env.PG_DB_HOST,
      port: parseInt(process.env.PG_DB_PORT),
      user: process.env.PG_DB_USERNAME,
      password: process.env.PG_DB_PASSWORD,
      database: process.env.PG_DB_NAME,
      migrations: {
        directory: __dirname + "/migrations/",
      },
    },
  });
  try {
    console.log("Trying run the migration scripts and create a new table");
    await dbobj.migrate.latest();
    console.log("Migrations done trying to add a new record into the table");
    await dbobj.insert({ id: 1, name: "Viraj Shelke" }).into("persons");
    console.log(
      "Adding a record done trying to read the data from the table using select * query"
    );
    const data = await dbobj("persons").select("*");
    console.log("The result of the query: ", data);
  } catch (error) {
    throw error;
  } finally {
    await dbobj.destroy();
  }
}

async function deletePGDatabase() {
  const dbobj = knex({
    client: "pg",
    connection: {
      host: process.env.PG_DB_HOST,
      port: parseInt(process.env.PG_DB_PORT),
      user: process.env.PG_DB_USERNAME,
      password: process.env.PG_DB_PASSWORD,
      database: "postgres",
    },
  });
  try {
    console.log(`Trying to delete database ${process.env.PG_DB_NAME}`);
    await dbobj.raw(`DROP DATABASE "${process.env.PG_DB_NAME}"`);
    console.log(`Database ${process.env.PG_DB_NAME} dropped successfully`);
  } catch (error) {
    if (error.code === "3D000") {
      console.log(`Database ${process.env.PG_DB_NAME} does not exists.`);
      return;
    }
    throw error;
  } finally {
    await dbobj.destroy();
  }
}
async function createPGDatabase() {
  const dbobj = knex({
    client: "pg",
    connection: {
      host: process.env.PG_DB_HOST,
      port: parseInt(process.env.PG_DB_PORT),
      user: process.env.PG_DB_USERNAME,
      password: process.env.PG_DB_PASSWORD,
      database: "postgres",
    },
  });

  try {
    console.log(
      `PG connection details - host: ${process.env.PG_DB_HOST}, port: ${process.env.PG_DB_PORT}, username: ${process.env.PG_DB_USERNAME}, password: ${process.env.PG_DB_PASSWORD}`
    );
    console.log(`Trying to create a new database ${process.env.PG_DB_NAME}`);
    await dbobj.raw(`CREATE DATABASE "${process.env.PG_DB_NAME}"`);
    console.log(`New database ${process.env.PG_DB_NAME} created successfully`);
  } catch (error) {
    if (error.code === "42P04") {
      console.log(`Database ${process.env.PG_DB_NAME} already exists.`);
      return;
    }
    throw error;
  } finally {
    await dbobj.destroy();
  }
}

main();
