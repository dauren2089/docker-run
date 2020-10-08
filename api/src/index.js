const express = require('express');
const { connectDb } = require('./helpers/db');
const { port, host, db } = require('./configuration');
const app = express();

const startServer = () => {
	app.listen(port, () => {
		console.log(`Started API service on port: ${port}`);
		console.log(`On host: ${host}`);
	});
}

app.get('/test', (req, res) => {
	res.send("Our API sercer is working correctly");
});

connectDb()
	.on("error", console.log)
	.on("disconnect", connectDb)
	.once("open", startServer);