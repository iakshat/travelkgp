const express = require("express");
const httpslocalhost = require("https-localhost");
const pug = require("pug");
const https = require("https");
const fs = require("fs");
const mysql = require("mysql");
const bodyParser = require("body-parser");
require("dotenv").config();


var options = {
    key: fs.readFileSync( './localhost.key' ),
    cert: fs.readFileSync( './localhost.cert' ),
    requestCert: false,
    rejectUnauthorized: false
};

var connection = mysql.createConnection({

    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: 3306,
    host: "localhost",
    database: "travelkgp"

});

connection.connect( (err) => {

    if(err){
        console.log("Error in connecting to database ;-(");
        throw err;}
    else
        console.log("Connected to DB :-)");

});


var app = express();

//SERVER SETUPS
app.set('view engine', 'pug');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

//SCRIPTS SUPPLIER
app.get("/scripts/:name", (req, res) => {

    if(req.params.name == "none")
        res.sendFile(__dirname + "/fullcalendar-4.3.1/packages/" + req.query.loc);
    else{

        res.sendFile(__dirname + "/scripts/" + req.params.name);

    }
});

app.get("/", (req, res) => {
    res.redirect("/entrypage");
})

//HOME PAGE
app.get("/home", (req, res) => {

    console.log("Calendar fetched for travel from "+ req.query.from);
    res.sendFile(__dirname + "/home.html");

});

//ENTRY PAGE
app.get("/entrypage", (req, res) => {

    console.log("Entry page requested");
    res.sendFile(__dirname + "/entrypage.html");

});

//LOGIN PAGE
app.get("/oauth/facebook", (req, res) => {

    res.sendFile(__dirname + "/login.html");

})

//VIEW ENTRIES
app.get("/viewentry", (req, res) => {

    // var date = req.query.date;
    // var from = req.query.from;
    // console.log(from);
    console.log("entries fetched for "+req.query.date + " from " +req.query.from);

    res.sendFile(__dirname + "/viewentry.html");

});

//ADD NEW ENTRY
app.post("/addentry", (req, res)=> {

    // console.log("data recieved!!");
    // console.log(req.body);


    connection.query("INSERT INTO entries ( date, time, name, fblink, source) VALUES (?,?,?,?,?)", [req.body.date, req.body.time, req.body.name, req.body.fblink, req.body.from], (err) => {

        if(err){
            console.log("Error in adding entry ;-(");
            throw err;
        }else{

            res.send("success!");
            console.log(`Entry added by ${req.body.name} on ${req.body.date} at ${req.body.time}`);
        }

    })


})


//EVENTS HANDLER
app.get("/events", (req, res) => {

    var from = req.query.from;
    var date = req.query.date;

    if(date != undefined){

        connection.query("SELECT * FROM entries WHERE source = ? AND date = ?", [from, date], (err, rows) => {
            if(err)
                throw err;

            res.send( rows );

        });

    }else{

        connection.query("SELECT * FROM entries WHERE source = ?", [from] , (err, rows) => {

            if(err)
                throw err;

            var to_send = [];

            for( row of rows ){

                // console.log(row);

                to_send.push( {
                    title: row.time,
                    start: row.date,
                    allDay: true,
                    url: row.fblink,
                    name: row.name
                } );

            }

            res.send( to_send );

        });
    }

})

//RUN SERVER
app.listen(2000, () => {
    console.log("server running...");
})