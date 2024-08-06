const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
let { PythonShell } = require('python-shell');
const app = express();
const port = process.env.PORT || 4565;
const collection = require('./config.js');

const pythonShell = new PythonShell('app.py');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('./public'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

let mess = undefined;
let useName = undefined;
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render('fhome');
});

app.get('/home', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render('home', { useName: req.session.username });
});

app.get('/login', (req, res) => {
    res.render('login', { mess });
});

app.get('/signup', (req, res) => {
    res.render('signup', { mess });
});

app.get('/forgot', (req, res) => {
    res.render('forgot', { mess });
});

app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.log("Error: Failed to destroy the session during logout.", err);
                return res.status(500).send('Failed to log out, please try again.');
            }
            res.clearCookie('connect.sid');
            res.render('fhome');
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/signup', async (req, res) => {
    let username = req.body.username;
    let pass = req.body.password;
    let email = req.body.email;

    try {
        const existingUser = await collection.findOne({ email: email });
        if (existingUser) {
            return res.render('signup', { mess: "Email already exists. Please use a different email" });
        }

        let newUser = new collection({
            name: username,
            password: pass,
            email: email
        });

        newUser.save()
            .then(data => {
                console.log('Data successfully saved:', data);
                res.redirect('/login');
            })
            .catch(err => {
                console.error('Error saving data:', err);
                res.status(500).send("Failed to register user.");
            });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await collection.findOne({ email: req.body.email });
        if (!user) {
            return res.render('login', { mess: "Email doesn't exist" });
        } else {
            if (user.password === req.body.password) {
                req.session.userId = user._id;
                req.session.username = user.name;
                return res.redirect('/home');
            } else {
                return res.render('login', { mess: "Password is incorrect" });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/forgot', async (req, res) => {
    try {
        const email = req.body.email;
        const newPassword = req.body.new_password;
        const confirmPassword = req.body.confirm_password;

        const existingUser = await collection.findOne({ email: email });
        if (!existingUser) {
            return res.render("forgot", { mess: "Email not found" });
        }

        if (newPassword !== confirmPassword) {
            return res.render("forgot", { mess: "Passwords do not match" });
        }

        const updatedUser = await collection.updateOne({ email: email }, { $set: { password: newPassword } });
        if (updatedUser.modifiedCount > 0) {
            return res.render("login", { mess: "Password updated successfully. Please login with your new password" });
        } else {
            return res.render("forgot", { mess: "Please try again later" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


app.get('/about',(req,res)=>{
    res.render('about');
})


app.listen(port, err => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Server is listening on port ${port}`);
    }
});
