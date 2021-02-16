var mysql = require("mysql");
var db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "asongroom57",
  database: "opentutorials",
  multiplements: true,
});
db.connect();
module.exports = db;
