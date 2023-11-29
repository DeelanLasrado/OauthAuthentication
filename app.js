const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");

const app=express();

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




app.listen(3000,function(){
    console.log("Server is running on port 3000");
});