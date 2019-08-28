const express = require("express");
const mysqlSesssionStore = require("express-mysql-session")
const passport = require("passport");
const session  = require("express-session");
const fs = require("fs");
const cookieParser = require("cookie-parser")
const mysql = require("mysql");
const bodyParser = require("body-parser");
require("dotenv").config();

//DATABASE CONNETCION OPTIONS
var DBoptions = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: 3306,
    host: "localhost",
    database: "travelkgp"
}

//SETTING UP DATABASE CONNECTION
var connection = mysql.createConnection(DBoptions);

//TO STORE SESSIONS IN DB
var sessionStore = new mysqlSesssionStore(DBoptions);

//CONNECT TO DATABASE
connection.connect( (err) => {

    if(err){
        console.log("Error in connecting to database ;-(");
        // throw err;
    }
    else
        console.log("Connected to DB :-)");

});


var app = express();

//SERVER SETUPS
app.set('view engine', 'pug');
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
//COOKIE SETUP
app.use(session({
    secret: 'fshnuhaueUHbkJHIIJHiiuNHiuhIUhIUHiuHIUjhIHiuMiuIU',
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    cookie: {secure: true}
}));
//SETUP FOR AUTHENTICATION
app.set(passport.initialize())
app.set(passport.session())

//SCRIPTS SUPPLIER
app.get("/scripts/:name", (req, res) => {

    if(req.params.name == "none")
        res.sendFile(__dirname + "/fullcalendar-4.3.1/packages/" + req.query.loc);
    else{

        res.sendFile(__dirname + "/scripts/" + req.params.name);

    }
});

app.get("/", (req, res) => {
    res.redirect("/oauth/facebook");
})

//HOME PAGE
app.get("/home", (req, res) => {
    if(req.isAuthenticated()) {
        console.log("Calendar fetched for travel from "+ req.query.from);
        res.sendFile(__dirname + "/home.html");
    }else{
        res.redirect("/");
    }
});

//ENTRY PAGE
app.get("/entrypage", (req, res) => {

    if(req.isAuthenticated()) {
        console.log("Entry page requested");
        res.sendFile(__dirname + "/entrypage.html");
    }else{
        res.redirect("/");
    }
});

//LOGIN PAGE
app.get("/oauth/facebook", (req, res) => {

    res.sendFile(__dirname + "/login.html");

});

app.post("/oauth/facebook", (req, res) => {

    req.login(id, (err) => {
        if(err)
            throw err;

        res.session.name = req.body.name;
        res.session.id = req.body.id;
        res.session.fblink = req.body.link;
        res.session.profilepicURL = req.body.profilepic;
        res.session.accessToken = req.body.accessToken;


        res.send("success!");

        console.log(req.session);
    })


})

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});

//VIEW ENTRIES
app.get("/viewentry", (req, res) => {

    if(req.isAuthenticated()) {

        // var date = req.query.date;
        // var from = req.query.from;
        // console.log(from);
        console.log("entries fetched for "+req.query.date + " from " +req.query.from);

        res.sendFile(__dirname + "/viewentry.html");
    }else{
        res.redirect("/");
    }

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
app.listen(80, () => {
    console.log("server running...");
})