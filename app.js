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
    port = process.env.PORT || 3000,
    Step = require('step');

server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

if (!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}

FB.options({
    appId: config.facebook.appId,
    appSecret: config.facebook.appSecret,
    redirectUri: config.facebook.redirectUri
});

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

var p_to_room_dict = {};
var room_to_p_dict = {};
var sid_to_p_dict = {};
var p_to_sid_dict = {};
var temp = []; // temp[0] = room, temp[1] = FB_id
var MAXIMUM_ROOM_CAPACITY = 4;
var room_to_people_count = {};
var username_to_room = {};
var usernameList = [];

var usernames = {};
var numUsers = 0;

io.sockets.on('connection', function(socket) {
    var addedUser = false;

    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        // console.log('CALLED DISCONNECT');

        // for (var i in room_to_p_dict) {
        //     if (room_to_p_dict[i].length == 0) {
        //         delete room_to_p_dict[i];
        //     }
        // }

        console.log('socket.room: ' + socket.room);
        console.log('room_to_p_dict: ' + JSON.stringify(room_to_p_dict));
        console.log('p_to_room_dict: ' + JSON.stringify(p_to_room_dict));

        if (room_to_p_dict[socket.room.toString()].length == 0) delete room_to_p_dict[socket.room.toString()];

        // remove the username from global usernames list
        if (addedUser) {
            delete usernames[socket.username];
            --numUsers;

            var index = usernameList.indexOf(socket.username);
            if (index > -1) {
                usernameList.splice(index, 1);
            }

            var room = username_to_room[socket.username];
            // NEED FB API USERNAME TO DELETE
            usernameList.splice(usernameList.indexOf(socket.username), 1);
            delete username_to_room[socket.username];
            room_to_people_count[room] = room_to_people_count[room] - 1;

            delete p_to_room_dict[socket.fbId.toString()];
            var index = room_to_p_dict[socket.room.toString()].indexOf(socket.fbId.toString());
            room_to_p_dict[socket.room.toString()].splice(index, 1);
            if (room_to_p_dict[socket.room.toString()].length == 0) {
                delete room_to_p_dict[socket.room.toString()];
            }

            console.log('socket.fbId: ' + socket.fbId);
            console.log('socket.room: ' + socket.room);
            console.log('room_to_p_dict after: ' + JSON.stringify(room_to_p_dict));
            console.log('p_to_room_dict after: ' + JSON.stringify(p_to_room_dict));

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: room_to_people_count[room],
                left_room: room
            });
        }
    });

    socket.on('new person', function(data) {
        // populate data from '/' before deciding on room number
        setTimeout(function() {
            socket.room = temp[0];
            sid_to_p_dict[socket.id] = temp[1];
            p_to_sid_dict[temp[1]] = socket.id;
            socket.emit('updaterooms', temp);
        }, 500);
    });
    socket.on('clicked', function(data) {
        // CHANGE AVAILABLE ROOMS/PEOPLE
        // console.log('CLICKED');
        // console.log(temp);
        p_to_room_dict[temp[1]] = temp[0];
        room_to_p_dict[temp[0]].push(temp[1]);
    });

    // CHAT STUFF
    // when the client emits 'new message', this listens and executes
    socket.on('new message', function(data, url) {
        // we tell the client to execute 'new message'
        var tmp = url.split('/');
        room = tmp[tmp.length - 1];
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data,
            room: room
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username, url, fbId) {
        // we store the username in the socket session for this client
        socket.username = username;
        socket.fbId = fbId;
        // add the client's username to the global list
        usernames[username] = username;
        ++numUsers;
        addedUser = true;
        usernameList.push(username);

        var tmp = url.split('/');
        room = tmp[tmp.length - 1];
        socket.room = room;
        username_to_room[socket.username] = room;

        if (Object.keys(room_to_people_count).indexOf(room) == -1) { // Room is newly being added
            room_to_people_count[room] = 1;
        } else {
            room_to_people_count[room] = room_to_people_count[room] + 1;
        }

        socket.emit('login', {
            numUsers: room_to_people_count[room],
            room: room
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: room_to_people_count[room],
            room: room
        });

        // console.log("username: " + username);
        // console.log("username_to_room: " + JSON.stringify(username_to_room));
        // console.log("room_to_people_count: " + JSON.stringify(room_to_people_count));

    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function(url) {
        var tmp = url.split('/');
        room = tmp[tmp.length - 1];
        socket.broadcast.emit('typing', {
            username: socket.username,
            room: room
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function(url) {
        var tmp = url.split('/');
        room = tmp[tmp.length - 1];
        socket.broadcast.emit('stop typing', {
            username: socket.username,
            room: room
        });
    });

    socket.on('get usernamelist', function() {
        socket.emit('usernamelist', {
            list: usernameList
        });
    });

});

app.get('/', function(req, res) {
    var accessToken = req.session.access_token;
    var first_name;
    if (!accessToken) {
        res.render('index', {
            loginUrl: FB.getLoginUrl({
                scope: 'user_about_me'
            })
        });
    } else {
        // populate available_rooms and available_people
        FB.api('fql', {
            q: 'SELECT uid2 FROM friend WHERE uid1 = me()',
            access_token: req.session.access_token
        }, function(re) {
            if (!re || re.error) {
                console.log(!re ? 'error occurred' : re.error);
                return;
            }
            FB.api('fql', {
                q: 'SELECT uid, first_name FROM user WHERE uid=me()',
                access_token: req.session.access_token
            }, function(r) {
                if (!re || re.error) {
                    console.log(!re ? 'error occurred' : re.error);
                    return;
                }
                var friends_list = re.data;
                var friends_list_2 = [];
                // Iterate through all people that are available to chat
                for (var i = 0; i < friends_list.length; i++) {
                    friends_list_2.push(friends_list[i]['uid2']);
                }

                function helper_function() {
                    var randint = Math.floor((Math.random() * 90000) + 10000);
                    temp[0] = randint;
                    temp[1] = r.data[0]['uid'];
                    var isValid = true;
                    for (var key in p_to_room_dict) {
                        if (friends_list_2.indexOf(key) != -1) { // friend found
                            var curr_room_list = room_to_p_dict[p_to_room_dict[key]];
                            // console.log('curr_room_list: ' + JSON.stringify(curr_room_list));
                            if (curr_room_list.length <= MAXIMUM_ROOM_CAPACITY) { // room at maximum capacity
                                for (var x = 0; x < curr_room_list.length; x++) { // loop through people in interested room
                                    if (friends_list_2.indexOf(curr_room_list[x].toString()) == -1) {
                                        isValid = false; // enforce clique
                                    }
                                }
                                if (isValid) {
                                    temp[0] = p_to_room_dict[key];
                                    return;
                                }
                            }
                        }
                    }
                    room_to_p_dict[temp[0]] = [];
                }
                helper_function();
                first_name = r.data[0]['first_name'];
                res.render('menu', {
                    name: first_name
                });
            });
        });
    }
});

app.get('/login/callback', home.loginCallback);
app.get('/logout', home.logout);
// app.get('/friends', api.friends);
app.get('/chat/:id', function(req, res, next) {
    // console.log(Number(req.params.id));
    FB.api('fql', {
        q: 'SELECT uid, first_name FROM user WHERE uid=me()',
        access_token: req.session.access_token
    }, function(r) {
        if (Number(req.params.id) != NaN &&
            (Object.keys(room_to_people_count).indexOf(req.params.id) != -1 && room_to_people_count[req.params.id] < MAXIMUM_ROOM_CAPACITY) ||
            Object.keys(room_to_people_count).indexOf(req.params.id) == -1) { // logic for shit
            res.render('chat.ejs', {
                fbId: r.data[0]['uid']
            });
        } else if (Number(req.params.id) != NaN && Object.keys(room_to_people_count).indexOf(req.params.id) != -1 && room_to_people_count[req.params.id] >= MAXIMUM_ROOM_CAPACITY) {
            res.send('Sorry. This room is at max capacity.' + '<br><br><a href="/">Back to Home</a>');
        } else {
            next();
        }

    });
})
