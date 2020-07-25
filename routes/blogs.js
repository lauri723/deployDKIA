var express = require("express"),
    router = express.Router(),
    Blog = require("../models/blog"),
    middleware = require("../middleware"),
    { isLoggedIn, checkUserBlog, checkUserComment, isAdmin, } = middleware
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'laurijl',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// INDEX ROUTE
router.get("/", isLoggedIn, function (req, res, next) {
    Blog.find({}).sort({ created: -1 }).exec(function (err, allBlogs) {
        if (err) {
            next(err)
        } else {
            res.render("blogs/index", { blog: allBlogs });
        }
    });
});

// NEW ROUTE
router.get("/new", isAdmin, function (req, res) {
    res.render("blogs/new");
});

// CREATE ROUTE
router.post("/", isAdmin, upload.single('image'), function (req, res) {
    // req.body.blog = req.sanitize(req.body.blog);
    cloudinary.uploader.upload(req.file.path, function (result) {
        // add cloudinary url for the image to the campground object under image property
        req.body.blog.image = result.secure_url;
        // add author to campground
        req.body.blog.author = {
            id: req.user._id,
            username: req.user.username
        }
        Blog.create(req.body.blog, function (err, blog) {
            if (err) {
                return res.redirect('back');
            }
            res.redirect('/blogs/' + blog.id);
        });
    });
});

// SHOW ROUTE
router.get("/:id", function (req, res, next) {
    Blog.findById(req.params.id).populate("comments").exec(function (err, foundBlog) {
        if (err) {
            next(err)
        } else {
            res.render("blogs/show", { blog: foundBlog });
        }
    })
});

// EDIT ROUTE
router.get("/:id/edit", isAdmin, function (req, res, next) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            next(err)
        } else {
            res.render("blogs/edit", { blog: foundBlog });
        }
    });
});

// UPDATE ROUTE
router.put("/:id", isAdmin, function (req, res) {
    // req.body.blog = req.sanitize(req.body.blog);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (err, updatedBlog) {
        if (err) {
            // TODO differentiate between "expected" errors (e.g. malformatted user inputs), vs unexpected errors (database is down).
            // Expected errors should redirect, with indication of what user did wrong, whereas unexpected error should respond with 500.
            res.redirect("back");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});


// DESTROY ROUTE
router.delete("/:id", isAdmin, function (req, res, next) {
    Blog.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            next(err)
        } else {
            res.redirect("/blogs");
        }
    });
});



module.exports = router;
