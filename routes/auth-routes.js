const router = require('express').Router();
const passport = require('passport');

// auth login 

router.get('/login', (req, res) => {
    res.render('login');
});

// auth logout

router.get('/logout', (req, res) => {
    // handle with passport
    res.send('logging out');
});


// auth with Google

router.get('/google', passport.authenticate('google', {
    scope: ['profile']
}) );

// callback route for google to redirect to

router.get('/google/redirect', (req, res) => {
    res.send('You reached the callback uri')
});

// auth with local

router.get('/local',(req, res) => {
    // handle with passport

    res.send('logging in with local');
});

module.exports = router;
