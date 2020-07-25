require("dotenv").config();
var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    cookieParser   = require("cookie-parser"),
    LocalStrategy  = require("passport-local"),
    expressSanitizer = require("express-sanitizer"),
    Blog           = require("./models/blog"),
    Comment        = require("./models/comment"),
    User           = require("./models/user"),
    session        = require("express-session"),
    methodOverride = require("method-override")

var commentRoutes  = require("./routes/comments"),
    blogRoutes     = require("./routes/blogs"),
    indexRoutes    = require("./routes/index")

var { handleError } = require('./middleware');

mongoose.connect(process.env.DATABASEURL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).catch(err => {
    if (err) {
        console.error("Failed to connect to mongodb.")
        console.error(err.stack)
        process.exit(1)
    }
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.locals.moment = require('moment');
app.use(cookieParser('secret'));

app.use(require("express-session")({
    secret: "I am really short",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use("/", indexRoutes);
app.use("/blogs", blogRoutes);
app.use("/blogs/:id/comments", commentRoutes)
app.use(handleError);


var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});


