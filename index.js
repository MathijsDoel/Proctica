const Express = require("express");
const bodyParser = require('body-parser');
const fs = require('fs');
const e = require("express");


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
    const username = req.body.username;
    const password = req.body.password;

    let rawdata = fs.readFileSync('users.json');
    let data = JSON.parse(rawdata);
    let users = data["users"]

    for(let i = 0;i<users.length;i++){
        if(username == users[i]["username"] && password == users[i]["password"]){
            loggedIn.push({"username": username, "IP": req.socket.remoteAddress})
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
                let user = loggedIn[i]["username"];
                if(user == 'admin'){
                    res.redirect("/admin");
                }
                else{
                    let rawdata = fs.readFileSync('courses-info.json');
                    let data = JSON.parse(rawdata);
                    let courses = data["courses"];

                    let rawdata2 = fs.readFileSync('courses-results.json');
                    let temp_data2 = JSON.parse(rawdata2);
                    let temp_userdata = temp_data2["users"][user];

                    let rawdata3 = fs.readFileSync('questions.json');
                    let questions = JSON.parse(rawdata3);

                    let grades = [];
                    let progress = [];
                    let total = 0;
                    let average;
            
                    for(let j = 0; j < courses.length;j++){
                        if(temp_userdata == undefined){
                            progress.push(0);
                        }
                        else{
                        if(temp_userdata["course" + (j + 1)] != undefined){
                            if(temp_userdata["course" + (j + 1)]["grade"] > 0){
                                grades.push(temp_userdata["course" + (j + 1)]["grade"]);
                                total += temp_userdata["course" + (j + 1)]["grade"];
                            }
                            let temp_progress = 0;
                            if(temp_userdata["course" + (j + 1)]["questions"].length > 0){
                                temp_progress += Math.round((temp_userdata["course" + (j + 1)]["questions"].length / questions["course" + (j + 1)].length) * 50);
                            }
        
                            if(temp_userdata["course" + (j + 1)]["info"]){
                                temp_progress += 25;
                            }
                            if(temp_userdata["course" + (j + 1)]["movie"]){
                                temp_progress += 25;
                            }
        
                            if(temp_userdata["course" + (j + 1)]["complete"]){
                                temp_progress = 100;
                            }
                            else{
                                temp_progress *= 0.9;
                                temp_progress = Math.round(temp_progress);
                            }
        
                            progress.push(temp_progress);

                        }
                        else{
                            progress.push(0);
                        }
                    }
                    }
                    if(grades.length > 0){
                        average = Math.round((total/grades.length) * 10)/10;
                    }
                    else{
                        average = "-";
                    }
                    
                    res.render(__dirname + "/public/dashboard.ejs", {courses: courses, grades: grades, average: average, progress: progress});
                    break;
                }
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

                if(data == undefined){
                    res.send('<h1>Deze cursus is nog niet af</h1><a href="/dashboard">Terug naar dashboard</a>');
                }
                else{
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
                        temp_data2["users"][user]["course" + course] = {"questions": [], "complete": false, "grade": 0, "corrected": [], "info": false, "movie": false};
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

                let users_results2 =  data_results["users"][user]["course" + index]["corrected"];

                let grade = data_results["users"][user]["course" + index]["grade"];

                let real_questions = [];
                for(let j = 0;j<length;j++){
                    real_questions.push(questions[j]["question"]);
                }
                let real_answers = [];
                for(let j = 0;j<length;j++){
                    real_answers.push(questions[j]["answers"]);
                }
                let correct = [];
                let amount = 0;
                for(let j = 0;j<length;j++){
                    if(users_results2[j] == questions[j]["correct"].toString()){
                        correct.push(j);
                        amount++;
                    }
                    else{
                        correct.push(-1);
                    }
                }
                res.render(__dirname + "/public/results.ejs", {info: users_results2, questions: real_questions, answers: real_answers, index: index, correct: correct, grade: grade, amount: amount});
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
    if(loggedIn.length == 0){
        res.redirect('/')
    }
    else{
        for(let i = 0;i < loggedIn.length;i++){
            if(loggedIn[i]["IP"] == req.socket.remoteAddress){
                user = loggedIn[i]["username"]
                let index = parseInt(req.params.index);
                let rawdata = fs.readFileSync('courses-info.json');
                let data = JSON.parse(rawdata);
                let courses = data["courses"];

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
                let test_data = temp_data2["users"][user]["course" + index];
                let data2;
                if(test_data == undefined){
                    temp_data2["users"][user]["course" + index] = {"questions": [], "complete": false, "grade": 0, "corrected": [], "info": false, "movie": false};
                    let json_data = JSON.stringify(temp_data2, null, 2);
                    fs.writeFileSync("courses-results.json", json_data);
                    rawdata2 = fs.readFileSync('courses-results.json');
                    temp_data2 = JSON.parse(rawdata2);
                    data2 = temp_data2["users"][user]["course" + index]["questions"];
                }
                else{
                    data2 = temp_data2["users"][user]["course" + index]["questions"];
                }
                
                if(temp_data2["users"][user]["course" + index]["movie"] == false){
                    temp_data2["users"][user]["course" + index]["movie"] = true;
                    let json_data = JSON.stringify(temp_data2, null, 2);
                    fs.writeFileSync("courses-results.json", json_data);
                    rawdata2 = fs.readFileSync('courses-results.json');
                    temp_data2 = JSON.parse(rawdata2);
                }


                let video;
                for(let j = 0; j < courses.length;j++){
                    if(courses[j]["id"] == index){
                        video = "https://www.youtube.com/embed/" + courses[j]["video"];
                    }
                }
                res.render(__dirname + "/public/movie.ejs", {video: video, index: index})
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
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

                let real_questions = [];
                for(let j = 0;j<length;j++){
                    real_questions.push(questions[j]["question"]);
                }
                let real_answers = [];
                for(let j = 0;j<length;j++){
                    real_answers.push(questions[j]["answers"]);
                }
                data_results["users"][user]["course" + index]["corrected"] = user_answers;
                let json_data = JSON.stringify(data_results, null, 2);
                fs.writeFileSync("courses-results.json", json_data);
                res.render(__dirname + "/public/overview.ejs", {info: user_answers, questions: real_questions, answers: real_answers, index: index});
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
                let grade = Math.round((points/length * 9 + 1) * 10)/10;
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
    if(loggedIn.length == 0){
        res.redirect('/')
    }
    else{
        for(let i = 0;i < loggedIn.length;i++){
            if(loggedIn[i]["IP"] == req.socket.remoteAddress){
                user = loggedIn[i]["username"]
                let index = parseInt(req.params.index);
                let rawdata = fs.readFileSync('courses-info.json');
                let data = JSON.parse(rawdata);
                let courses = data["courses"];

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
                let test_data = temp_data2["users"][user]["course" + index];
                let data2;
                if(test_data == undefined){
                    temp_data2["users"][user]["course" + index] = {"questions": [], "complete": false, "grade": 0, "corrected": [], "info": false, "movie": false};
                    let json_data = JSON.stringify(temp_data2, null, 2);
                    fs.writeFileSync("courses-results.json", json_data);
                    rawdata2 = fs.readFileSync('courses-results.json');
                    temp_data2 = JSON.parse(rawdata2);
                    data2 = temp_data2["users"][user]["course" + index]["questions"];
                }
                else{
                    data2 = temp_data2["users"][user]["course" + index]["questions"];
                }
                
                if(temp_data2["users"][user]["course" + index]["info"] == false){
                    temp_data2["users"][user]["course" + index]["info"] = true;
                    let json_data = JSON.stringify(temp_data2, null, 2);
                    fs.writeFileSync("courses-results.json", json_data);
                    rawdata2 = fs.readFileSync('courses-results.json');
                    temp_data2 = JSON.parse(rawdata2);
                }


                let info2;
                for(let j = 0; j < courses.length;j++){
                    if(courses[j]["id"] == index){
                        info2 = courses[j]["pdf"];
                        break;
                    }
                }
                res.render(__dirname + "/public/pdf.ejs", {info: info2, index: index})
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})


app.get("/summary/:index", (req, res) => {
    if(loggedIn.length == 0){
        res.redirect('/')
    }
    else{
        for(let i = 0;i < loggedIn.length;i++){
            if(loggedIn[i]["IP"] == req.socket.remoteAddress){
                user = loggedIn[i]["username"]
                let index = parseInt(req.params.index);
                let rawdata = fs.readFileSync('courses-info.json');
                let data = JSON.parse(rawdata);
                let courses = data["courses"];

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
                let test_data = temp_data2["users"][user]["course" + index];
                let data2;
                if(test_data == undefined){
                    temp_data2["users"][user]["course" + index] = {"questions": [], "complete": false, "grade": 0, "corrected": [], "info": false, "movie": false};
                    let json_data = JSON.stringify(temp_data2, null, 2);
                    fs.writeFileSync("courses-results.json", json_data);
                    rawdata2 = fs.readFileSync('courses-results.json');
                    temp_data2 = JSON.parse(rawdata2);
                    data2 = temp_data2["users"][user]["course" + index]["questions"];
                }
                else{
                    data2 = temp_data2["users"][user]["course" + index]["questions"];
                }
                
                // if(temp_data2["users"][user]["course" + index]["info"] == false){
                //     temp_data2["users"][user]["course" + index]["info"] = true;
                //     let json_data = JSON.stringify(temp_data2, null, 2);
                //     fs.writeFileSync("courses-results.json", json_data);
                //     rawdata2 = fs.readFileSync('courses-results.json');
                //     temp_data2 = JSON.parse(rawdata2);
                // }


                let info2;
                for(let j = 0; j < courses.length;j++){
                    if(courses[j]["id"] == index){
                        info2 = courses[j]["summary"];
                        break;
                    }
                }
                res.render(__dirname + "/public/summary.ejs", {info: info2, index: index})
            }
            else if(i == loggedIn.length - 1){
                res.redirect("/")
            }
        }
    }
})


app.get("/admin", (req, res)=>{
    if(loggedIn.length == 0){
        res.redirect('/')
    }
    else{
        for(let i = 0;i < loggedIn.length;i++){
            if(loggedIn[i]["IP"] == req.socket.remoteAddress){
                if(loggedIn[i]["username"] == 'admin'){
                    let rawdata = fs.readFileSync('courses-results.json');
                    let data = JSON.parse(rawdata)["users"];

                    let rawdata2 = fs.readFileSync('courses-info.json');
                    let data2 = JSON.parse(rawdata2)["courses"];

                    let users = [];
                    for(let user in data){
                        let grades = [];
                        let total = 0;
                        let amount = 0;
                        let finished = 0;
                        for(let courses in data[user]){
                            grades.push(data[user][courses]["grade"]);
                            if(data[user][courses]["grade"] > 0){
                                total += data[user][courses]["grade"];
                                amount++;
                            }
                            if(data[user][courses]["complete"] == true){
                                finished++;
                            }
                        }
                        let max;
                        if(grades.length > 0){
                            max = Math.max(...grades);
                        }
                        else{
                            max = "-";
                        }
                        let average;
                        if(amount > 0){
                            average = total/amount;
                        }
                        else{
                            average = "-"
                        }
                        users.push({"name": user, "grades": grades, "average": average, "max": max, "finished": finished, "total": data2.length});
                    }
                    all_averages = [];
                    all_progress = [];
                    for(let j = 0; j < users.length;j++){
                        if(users[j]["average"] != '-'){
                            all_averages.push(users[j]["average"]);
                        }
                        all_progress.push(users[j]["finished"]);
                    }

                    let highest_average = Math.max(...all_averages);
                    let highest_progress = Math.max(...all_progress);

                    let best_users_average = [];
                    let best_users_progress = [];
                    for(let j = 0;j < users.length;j++){
                        if(users[j]["average"] == highest_average){
                            best_users_average.push({"name": users[j]["name"], "score": users[j]["average"]});
                        }
                        if(users[j]["finished"] == highest_progress){
                            best_users_progress.push({"name": users[j]["name"], "score": users[j]["finished"]});
                        }
                    }
                    let average_winners = [];
                    let average_winner;
                    if(best_users_average.length > 1){
                        for(let k = 0; k < best_users_average.length;k++){
                            for(let j = 0; j < users.length;j++){
                                if(best_users_average[k]["name"] == users[j]["name"]){
                                    average_winners.push(users[j]["finished"])
                                }
                            }
                        }
                        let max = Math.max(...average_winners);

                        average_winner= best_users_average[average_winners.indexOf(max)];
                    }
                    else{
                        average_winner = best_users_average[0];
                    }

                    let progress_winners = [];
                    let progress_winner;
                    if(best_users_progress.length > 1){
                        for(let k = 0; k < best_users_progress.length;k++){
                            for(let j = 0; j < users.length;j++){
                                if(best_users_progress[k]["name"] == users[j]["name"]){
                                    progress_winners.push(users[j]["average"])
                                }
                            }
                        }
                        let max = Math.max(...progress_winners);

                        progress_winner= best_users_progress[progress_winners.indexOf(max)];
                    }
                    else{
                        progress_winner = best_users_progress[0];
                    }

                    let total = 0;
                    let counter = 0;
                    for(let j = 0; j < users.length;j++){
                        if(users[j]["average"] != '-'){
                            total+=users[j]["average"];
                            counter++;
                        }
                    }
                    let total_average = Math.round((total/counter)*10)/10;

                    let total2 = 0;
                    let counter2 = 0;
                    for(let j = 0; j < users.length;j++){
                            total2+=users[j]["finished"];
                            counter2++;
                    }
                    let total_progress = Math.round(total2/counter2 * 10)/10;

                    res.render(__dirname + "/public/admin.ejs", {users: users, best_average: average_winner, best_progress: progress_winner, total_average: total_average, total_progress: total_progress})

                }
                else{
                    res.send("je hebt geen toegang tot deze pagina ga weg noob")
                }
            }
            else if(i == loggedIn.length - 1){
                res.redirect('/')
            }
        }
    }   
})

app.listen(process.env.PORT || port, ()=>{
    console.log("server is running.......");
})