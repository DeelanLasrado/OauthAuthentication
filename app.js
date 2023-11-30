require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const saltRounds=10;

const app=express();
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});



const User=new mongoose.model("User",userSchema);



app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));

app.get("/",(req,res)=>{
    res.render("home.ejs");
});

app.get("/register",(req,res)=>{
    res.render("register.ejs");
});

app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
        const newUser = new User ({
            email : req.body.username,
            password:hash
        });

        newUser.save()
            .then(() => {
                res.render("secrets.ejs");
            })
            .catch((error) => {
                console.error(error);
            });
    });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }).exec()
        .then((foundUser) => {
            if (foundUser) {
                
                bcrypt.compare(password,foundUser.password,(err,result)=>{
                    
                    if (result === true) {
                        
                        res.render("secrets.ejs");
                    } else {
                        res.send("Incorrect password");
                    }
                });
            } else {
                res.send("User not found");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
});


app.listen(3000,function(){
    console.log("Server is running on port 3000");
});