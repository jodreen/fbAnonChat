var express = require('express'),
    FB = require('fb'),
    http = require('http'),
    path = require('path'),
    app = express(),
    config = require('./config'),
    server = require('http').createServer(app),
    api = require('./routes/api'),
    io = require('socket.io')(server),
    home = require('./routes/home'),
    port = process.env.PORT || 3000;

server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

if (!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.cookieSession({
        secret: 'secret'
    }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

app.get('/', home.index);
app.get('/login/callback', home.loginCallback);
app.get('/logout', home.logout);
app.get('/search', api.search);
app.get('/friends', api.friends);
app.post('/announce', api.announce);
app.get('/chat', api.chat);
app.get('/test/:id', function(req, res, next) {
    if (true) { // logic for shit
        res.render('chat.ejs');
    } else {
        next();
    }
})

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var available_rooms = [];

io.sockets.on('connection', function(socket) {
    socket.on('new person', function(data) {
        console.log(available_rooms);
        if (available_rooms.length == 0) {
            // create new chat room
            var randint = Math.floor((Math.random() * 90000) + 10000);
            socket.room = randint;
            socket.join(randint);
            socket.emit('updaterooms', randint);
            // ^Change to return randint
            available_rooms.push(randint);
        } else {
            // filter through friends to find correct one
            var randint = Math.floor((Math.random() * randint) + 1);
            console.log(randint);
            socket.room = available_rooms[randint];
            socket.join(available_rooms[randint]);
            available_rooms.splice(randint, 1);
            socket.emit('updaterooms', available_rooms[randint]);
        }
        console.log(available_rooms);
    });
});


// Chat Socket.IO
io.on('connection', function(socket) {
    var addedUser = false;
    // when the client emits 'new message', this listens and executes
    // Look at menu.ejs to connect with this
    socket.on('new message', function(data) {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username) {
        // we store the username in the socket session for this client
        socket.username = username;
        // add the client's username to the global list
        usernames[username] = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function() {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function() {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        // remove the username from global usernames list
        if (addedUser) {
            delete usernames[socket.username];
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});