const Express = require("express");
const bodyParser = require('body-parser');
const fs = require('fs');


const app = Express();
const port = 3000; 

app.use(Express.static("public"));
app.set('view-engine', 'ejs')

let loggedIn = [];
// {"username": "", "IP": ""}

app.get("/", (req, res)=> {
    res.render(__dirname + "/public/index.ejs", {name: "mattydoel"});
})

app.use(bodyParser.urlencoded({ extended: false }))


app.post('/login', (req, res) => {
    // console.log("User request with IP-address: $(req.socket.remoteAddress)");
    const username = req.body.username;
    const password = req.body.password;
    // console.log(username);
    // console.log(password);
    let rawdata = fs.readFileSync('users.json');
    let data = JSON.parse(rawdata);
    let users = data["users"]

    for(let i = 0;i<users.length;i++){
        if(username == users[i]["username"] && password == users[i]["password"]){
            loggedIn.push({"username": username, "IP": req.socket.remoteAddress})
            console.log(loggedIn);
            res.redirect("/dashboard");
            break;
        }
        else if(i == users.length - 1){
            console.log("no corresponding user found");
        }
    }
  });

app.get("/dashboard", (req, res)=> {
    console.log(loggedIn);
    if(loggedIn.length == 0){
        res.redirect("/")
    }
    else{
        for(let i = 0;i<loggedIn.length;i++){
            if(req.socket.remoteAddress == loggedIn[i]["IP"]){
                res.sendFile(__dirname + "/public/dashboard.html");
                break;
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})

app.get("/quiz/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let rawdata = fs.readFileSync('public/questions.json');
    let temp_data = JSON.parse(rawdata);
    let data = temp_data["questions"];
    if(index >= data.length){
        res.send("question not found");
    }
    else{
        let next_index = index + 1;
        let previous_index = index - 1;
        res.render(__dirname + "/quiz.ejs", {main_question: data[index]["question"], a:data[index]["answers"][0], b:data[index]["answers"][1], c:data[index]["answers"][2], d:data[index]["answers"][3], next:next_index, previous:previous_index});
    }
})

app.listen(process.env.PORT || port, ()=>{
    console.log("server is running.......");
})