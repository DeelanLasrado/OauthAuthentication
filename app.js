require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");


const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

///
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");


const app=express();
mongoose.connect("mongodb://localhost:27017/userDB");



const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);

////
userSchema.plugin(findOrCreate);

const User=new mongoose.model("User",userSchema);



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false    
}));


app.use(passport.initialize());
app.use(passport.session());



passport.use(User.createStrategy());

////
passport.serializeUser((user,done)=>{
    done(null,user.id);
});
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then((user) => {
            done(null, user); // Add null as the first argument to indicate no error
        })
        .catch((err) => {
            done(err); // Pass the error to indicate an issue if there is one
        });
});


/////
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req,res)=>{
    res.render("home.ejs");
});

/////
app.get("/auth/google",
    passport.authenticate("google",{scope: ["profile"]})
);
///
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


app.get("/register",(req,res)=>{
    res.render("register.ejs");
});

app.get("/login",(req,res)=>{
    res.render("login.ejs");
});

app.get("/secrets",(req,res)=>{
    User.find({secret:{$ne:null}})
        .then((foundUsers)=>{       
            if(foundUsers){
                res.render("secrets",{usersWithSecrets:foundUsers})
            }        
        });
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit.ejs");
    }
    else{
        res.redirect("/login");
    }
});


app.post("/submit",(req,res)=>{
    const submittedSecret = req.body.secret;

    User.findById(req.user.id)
        .then((foundUser)=>{        
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save()
                    .then(()=>{res.redirect("/secrets")});
            }
        })
})

/////
app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.redirect("/"); // Handle the error appropriately
        }
        res.redirect("/");
    });
});


app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    });
});

app.post("/login", (req, res) => {
    const user=new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});


app.listen(3000,function(){
    console.log("Server is running on port 3000");
});