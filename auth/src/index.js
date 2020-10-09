const express = require("express");
const { port, host, db } = require("./configuration");
const { connectDb } = require("./helpers/db");

const app = express();

const startServer = () => {
  app.listen(port, () => {
    console.log(`Started AUTH service on port ${port}`);
    console.log(`Our host is ${host}`);
    console.log(`Database url ${db}`);
  });
};

app.get("/test", (req, res) => {
  res.send("Our AUTH server is working correctly");
});

app.get("/api/currentuser", (req, res) => {
	res.json({
		id: "12345",
		email: "user@email.com"
	});
});

connectDb()
  .on("error", console.log)
  .on("disconnected", connectDb)
  .once("open", startServer);