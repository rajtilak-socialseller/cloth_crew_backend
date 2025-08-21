module.exports = async ({ username, password, connection }) => {
  try {
    // creating db
    await connection.query(`CREATE DATABASE ${username}`);
    //console.log("db created!");
    await connection.query(`CREATE USER ${username} WITH PASSWORD '${password}'`);
    // await connection.query(`ALTER USER ${username} SET search_path TO public`);
    //console.log("user created!");
    await connection.query(`GRANT ALL PRIVILEGES ON DATABASE ${username} TO ${username}`);
    //console.log("privileges granted!");
    await connection.query(`GRANT ALL ON SCHEMA public TO ${username}`);
    await connection.query(`GRANT USAGE ON SCHEMA public TO ${username}`);
    //console.log("usage granted!");
    await connection.query(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${username}`);
    await connection.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${username}`);
    //console.log("table privileges granted!");
    await connection.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${username}`);
    //console.log("auto sequences granted!");

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
