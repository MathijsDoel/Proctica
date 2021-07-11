const Express = require("express");
const bodyParser = require('body-parser');
const fs = require('fs');


const app = Express();
const port = 3000; 

app.use(Express.static("public"));
app.set('view-engine', 'ejs')

let loggedIn = [];
// {"username": "", "IP": ""}

// req.socket.remoteAddress to get IP
app.get("/", (req, res)=> {
    if(loggedIn.length == 0){
        res.render(__dirname + "/public/index.ejs", {error: ""});
    }
    else{
        for(let i = 0;i<loggedIn.length;i++){
            if(req.socket.remoteAddress == loggedIn[i]["IP"]){
                res.redirect("/dashboard");
                break;
            }
            else if(i == loggedIn.length - 1){
                res.render(__dirname + "/public/index.ejs", {error: ""});
            }
        }
    }
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
    if(loggedIn.length == 0){
        res.redirect("/")
    }
    else{
        for(let i = 0;i<loggedIn.length;i++){
            if(req.socket.remoteAddress == loggedIn[i]["IP"]){
                let rawdata = fs.readFileSync('courses-info.json');
                let data = JSON.parse(rawdata);
                let courses = data["courses"];
                res.render(__dirname + "/public/dashboard.ejs", {courses: courses});
                break;
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})

app.get("/quiz/:course/:index", (req, res)=>{
    if(loggedIn.length == 0){
        res.redirect("/")
    }
    else{
        for(let i = 0;i<loggedIn.length;i++){
            if(req.socket.remoteAddress == loggedIn[i]["IP"]){
                let user = loggedIn[i]["username"];
                let course = parseInt(req.params.course);
                let index = parseInt(req.params.index);
                let rawdata = fs.readFileSync('questions.json');
                let temp_data = JSON.parse(rawdata);
                let data = temp_data["course" + course];

                let rawdata2 = fs.readFileSync('courses-results.json');
                let temp_data2 = JSON.parse(rawdata2);
                let temp_userdata = temp_data2["users"][user];
                if(temp_userdata == undefined){
                    temp_data2["users"][user] = {};
                    let json_data = JSON.stringify(temp_data2, null, 2);
                    fs.writeFileSync("courses-results.json", json_data);
                    rawdata2 = fs.readFileSync('courses-results.json');
                    temp_data2 = JSON.parse(rawdata2);
                }
                let test_data = temp_data2["users"][user]["course" + course];
                let data2;
                if(test_data == undefined){
                    temp_data2["users"][user]["course" + course] = {"questions": [], "complete": false, "grade": 0, "corrected": []};
                    let json_data = JSON.stringify(temp_data2, null, 2);
                    fs.writeFileSync("courses-results.json", json_data);
                    rawdata2 = fs.readFileSync('courses-results.json');
                    temp_data2 = JSON.parse(rawdata2);
                    data2 = temp_data2["users"][user]["course" + course]["questions"];
                }
                else{
                    data2 = temp_data2["users"][user]["course" + course]["questions"];
                }
                if(temp_data2["users"][user]["course" + course]["complete"] == true){
                    res.redirect("/results/" + course);
                    return;
                }

                if(index >= data.length || index<0){
                    res.send("question not found");
                }
                else{
                    let next_index = index + 1;
                    let previous_index = index - 1;
                    let total_questions = data.length;
                    let answers = data[index]["answers"];
                    let given;
                    for(let j = 0; j<data2.length;j++){
                        if(data2[j]["question"] == index.toString()){
                            given = parseInt(data2[j]["answer"]);
                            break;
                        }
                        else if(j == data2.length - 1){
                            given = -1;
                        }
                    }
                    res.render(__dirname + "/public/quiz.ejs", {main_question: data[index]["question"], next:next_index, previous:previous_index, total_questions:total_questions, index:index, answers:answers, given:given, course:course});
                }
                break;
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})

app.post("/quiz/:course/:index", (req, res)=>{
    let course_index = parseInt(req.params.course);
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
    let course = user_info["course" + course_index]["questions"];
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
                if(course[index] == undefined){
                    course.push({"question": index_str, "answer": value});
                }
                else{
                    course.splice(index, 0, {"question": index_str, "answer": value});
                }
                break;
                // if(course[index] != undefined){
                //     course.splice(index, 0, {"question": index_str, "answer": value});
                // }
               
            }
        }
    }
    data["users"][user]["course" + course_index]["questions"] = course;
    let json_data = JSON.stringify(data, null, 2);
    fs.writeFileSync("courses-results.json", json_data);

    res.redirect("/quiz/" + course_index + "/" + index);
});

app.get("/results/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let rawdata_questions = fs.readFileSync('questions.json');
    let data_questions = JSON.parse(rawdata_questions);
    let questions = data_questions["course" + index];
    let length = questions.length;
    let user;
    if(loggedIn.length == 0){
        res.redirect('/')
    }
    else{
        for(let i = 0;i < loggedIn.length;i++){
            if(loggedIn[i]["IP"] == req.socket.remoteAddress){
                user = loggedIn[i]["username"]
                let rawdata_results = fs.readFileSync('courses-results.json');
                let data_results = JSON.parse(rawdata_results);
                let users_results = data_results["users"][user]["course" + index]["questions"];
                let grade = data_results["users"][user]["course" + index]["grade"];
                let user_answers = data_results["users"][user]["course" + index]["corrected"];
                res.render(__dirname + "/public/results.ejs", {info: user_answers, grade: grade});
                break;
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})

app.get("/home", (req, res)=>{
    res.render(__dirname + "/public/home.ejs")
})

app.get("/movie/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let rawdata = fs.readFileSync('courses-info.json');
    let data = JSON.parse(rawdata);
    let courses = data["courses"];
    let video;
    for(let j = 0; j < courses.length;j++){
        if(courses[j]["id"] == index){
            video = "https://www.youtube.com/embed/" + courses[j]["video"];
        }
    }
    res.render(__dirname + "/public/movie.ejs", {video: video})
})

app.get("/overview/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let rawdata_questions = fs.readFileSync('questions.json');
    let data_questions = JSON.parse(rawdata_questions);
    let questions = data_questions["course" + index];
    let length = questions.length;
    let user;
    if(loggedIn.length == 0){
        res.redirect('/')
    }
    else{
        for(let i = 0;i < loggedIn.length;i++){
            if(loggedIn[i]["IP"] == req.socket.remoteAddress){
                user = loggedIn[i]["username"]
                let rawdata_results = fs.readFileSync('courses-results.json');
                let data_results = JSON.parse(rawdata_results);
                let users_results = data_results["users"][user]["course" + index]["questions"];

                let user_answers = [];
                let back = 0;
                for(let j = 0;j<length;j++){
                    if(j-back >= users_results.length){
                        user_answers.push("Geen antwoord ingevuld");
                    }
                    else if(j == parseInt(users_results[j - back]["question"])){
                        user_answers.push(users_results[j - back]["answer"]);
                    }
                    else{
                        user_answers.push("Geen antwoord ingevuld");
                        back+=1;
                    }
                }
                data_results["users"][user]["course" + index]["corrected"] = user_answers;
                let json_data = JSON.stringify(data_results, null, 2);
                fs.writeFileSync("courses-results.json", json_data);
                res.render(__dirname + "/public/overview.ejs", {info: user_answers});
                break;
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})

app.post("/overview/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let user;
    if(loggedIn.length == 0){
        res.redirect('/')
    }
    else{
        for(let i = 0;i < loggedIn.length;i++){
            if(loggedIn[i]["IP"] == req.socket.remoteAddress){
                user = loggedIn[i]["username"]
                let rawdata_results = fs.readFileSync('courses-results.json');
                let data_results = JSON.parse(rawdata_results);
                let user_answers = data_results["users"][user]["course" + index]["corrected"]

                let rawdata_questions = fs.readFileSync('questions.json');
                let data_questions = JSON.parse(rawdata_questions);
                let questions = data_questions["course" + index];
                let length = questions.length;

                let points = 0;
                for(let j = 0;j<length;j++){

                    if(questions[j]["correct"] == parseInt(user_answers[j])){
                        points++;
                    }
                }
                let grade = points/length * 9 + 1;
                data_results["users"][user]["course" + index]["complete"] = true;
                data_results["users"][user]["course" + index]["grade"] = grade;
                let json_data = JSON.stringify(data_results, null, 2);
                fs.writeFileSync("courses-results.json", json_data);


                res.redirect("/results/"+ index)
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})

app.get("/logout", (req, res)=>{
    for(let i = 0;i < loggedIn.length;i++){
        if(loggedIn[i]["IP"] == req.socket.remoteAddress){
            loggedIn.splice(i, 1);
        }
    }
    res.redirect("/")
})

app.get("/info/:index", (req, res)=>{
    let index = parseInt(req.params.index);
    let rawdata_questions = fs.readFileSync('courses-info.json');
    let data = JSON.parse(rawdata_questions);
    let info = data["courses"];
    let info2;
    for(let j = 0;j<info.length;j++){
        if(info[j]["id"] == index){
            info2 = info[j]["pdf"];
            break;
        }
        else if(j == info.length - 1){
            info2 = "error"
        }
    }
    res.render(__dirname + "/public/pdf.ejs", {info:info2})
})

app.listen(process.env.PORT || port, ()=>{
    console.log("server is running.......");
})