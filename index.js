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
    res.render(__dirname + "/public/index.ejs", {error: ""});
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
            // console.log(loggedIn);
            res.redirect("/dashboard");
            break;
        }
        else if(i == users.length - 1){
            res.render(__dirname + "/public/index.ejs", {error:"gebruikersnaam of wachtwoord was incorrect"});
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
                res.render(__dirname + "/public/dashboard.ejs");
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
        let total_questions = data.length;
        let answers = data[index]["answers"];
        res.render(__dirname + "/public/quiz.ejs", {main_question: data[index]["question"], next:next_index, previous:previous_index, total_questions:total_questions, index:index, answers:answers});
    }
})

app.post("/quiz/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let index_str = req.params.index;
    let answers = [];
    const value = req.body.value;
    answers.push({"question": index_str, "answer": value});

    let rawdata = fs.readFileSync('courses-results.json');
    let data = JSON.parse(rawdata);
    let users = data["users"];
    let user;
    for(let i = 0;i < loggedIn.length;i++){
        if(loggedIn[i]["IP"] == req.socket.remoteAddress){
            user = loggedIn[i]["username"];
        }
    }
    let user_info = users[user];
    let course = user_info["course1"];
    if(course.length == 0){
        course.push({"question": index_str, "answer": value});
    }
    else{
        for(let i = 0;i<course.length;i++){
            if(course[i]["question"] == index_str){
                course[i]["answer"] = value;
                break;
            }
            else if(i == course.length - 1){
                course.push({"question": index_str, "answer": value});
            }
        }
    }
    data["users"][user]["course1"] = course;
    let json_data = JSON.stringify(data, null, 2);
    fs.writeFileSync("courses-results.json", json_data);

    res.redirect("/quiz/" + index);
});

app.get("/results/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let user;
    for(let i = 0;i < loggedIn.length;i++){
        if(loggedIn[i]["IP"] == req.socket.remoteAddress){
            user = loggedIn[i]["username"];
        }
    }
    let rawdata_results = fs.readFileSync('courses-results.json');
    let data_results = JSON.parse(rawdata_results);
    let users_resuslts = data_results["users"];

    let rawdata_questions = fs.readFileSync('public/question.json');
    let data_questions = JSON.parse(rawdata_questions);
    let users_questions = data_questions["users"];


    res.render(__dirname + "/public/results.ejs")
})

app.get("/test", (req, res)=>{
    things = ["hoi", "hallo", "hi"];
    res.render(__dirname + "/public/test.ejs", things=things)
})

app.post("/test", (req, res)=>{
    const value = req.body.value;
    console.log(value);
    res.redirect("/test")
})

app.get("/home", (req, res)=>{
    res.render(__dirname + "/public/home.ejs")
})

app.listen(process.env.PORT || port, ()=>{
    console.log("server is running.......");
})