const express = require('express');
const app = express();
const mongoose = require('mongoose');
const keys = require('./config/keys');
const Message = require('./models/msgs-models')
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');
const coookieSession = require('cookie-session');
const got = require('got');
const routes = require('./routes/auth-routes');
const chatRoute = require('./routes/chat-routes');
const socket = require('socket.io')
const passport = require('passport');
var MongoClient = require('mongodb').MongoClient;

var url = 'mongodb://chatroom:1chatroom@ds153824.mlab.com:53824/chatroom';
var db = 'mongodb://chatroom:1chatroom@ds153824.mlab.com:53824/chatroom';


// Set up view engine
const PORT = process.env.PORT || 3000;


//setting up view engine.
app.set('view engine', 'ejs')

app.use(coookieSession({
  maxAge: 24 * 60 * 60 * 1000,
  keys: [keys.session.cookieKey]
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());


// routes for auth and after auth
app.use('/auth', routes);
app.use(chatRoute);
app.use('/profile', profileRoutes);

app.get('/login', (req, res) => {
  res.render('login');
});

//prompting that the robots are listening.
var server = app.listen(PORT, () => {
  console.log(`The robots are listening on port ${PORT}`)
});

//connect to mongodb 
mongoose.connect(keys.mongodb.dbURI, { useNewUrlParser: true }, {
  useNewUrlParser: true
}, (err) => {
  if (err) {
    throw err;
  } else {
    console.log('Connected to Database')
  }
});

//middleeare for accessing CSS
app.use(express.static('public'))

// Socket setup
var io = socket(server);
//call function when connection is established
io.on('connection', (socket) => {
  console.log('Socket Connection', socket.id)

//reciving messages on connection
  var query = Message.find({});
  query.sort('-timestamp').limit(5).exec(
    (err, docs) => {
      if (err) {
        throw err;
      } else {

        for (var i = 0; i < docs.length; i++) {
          console.log(`${docs[i].username} posted ${docs[i].messages} on ${docs[i].timestamp}`);

        }

        socket.emit('load previous notes', docs);

      }
    });


  socket.on('chat', function (data) {
    //accessing model and saving it to the database
    var newMessage = new Message(data);
    newMessage.save((err) => {
      if (err) {
        throw err;
      } else {
        io.sockets.emit('chat', data);
      }
    })

  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data)
  });



})


/// NEW HOME ROUTE 


app.get('/', (req, res) => {

  var collections = []
  //connecting to db client to get data for display on home page
  MongoClient.connect(url, {
    useNewUrlParser: true
  }, function (err, db) {
    if (err) throw err;
    var database = db.db("chatroom");
    var users = database.collection('users').countDocuments();
    collections.push(users);

    var messages = database.collection('messages').countDocuments();
    collections.push(messages);

    var linesOfCode = got('https://api.codetabs.com/v1/loc?github=jordanmateen1991/Chat-Room', {
      json: true
    })
    collections.push(linesOfCode);


    Promise.all(collections).then((count) => {
      console.log(`Total users: ${count[0]}\nTotal Messages ${count[1]}`);
      res.render('home', {
        user: req.user,
        numOfUsers: count[0],
        numOfMsgs: count[1],
        totalLines: count[2].body[5].linesOfCode
      });
    })


  })
});

