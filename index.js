const Express = require("express");
const bodyParser = require('body-parser');
const fs = require('fs');


const app = Express();
const port = 3000; 

app.use(Express.static("public"));

app.get("/", (req, res)=> {
    res.sendFile(__dirname + "/public/index.html");
})
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
// app.use(bodyParser.json())


app.post('/login', (req, res) => {
    console.log(req.ip);
    const username = req.body.username;
    const password = req.body.password;
    // console.log(username);
    // console.log(password);
    let rawdata = fs.readFileSync('users.json');
    let data = JSON.parse(rawdata);
    let users = data["users"]

    for(let i = 0;i<users.length;i++){
        if(username == users[i]["username"] && password == users[i]["password"]){
            res.redirect("/dashboard");
            break;
        }
        else if(i == users.length - 1){
            console.log("no corresponding user found");
        }
    }
  });

app.get("/dashboard", (req, res)=> {
    res.send("received your request");
})

app.listen(process.env.PORT || port, ()=>{
    console.log("server is running...");
})