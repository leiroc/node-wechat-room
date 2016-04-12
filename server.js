var express = require('express'),
    bodyparser = require('body-parser'),
    compression = require('compression');


var app = express();

var server = require('http').createServer(app);

var io = require('socket.io')(server);

var port = process.env.PORT || 8080;

server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

app.use(compression());

//设置express寻找静态资源的位置
app.use(express.static(__dirname + '/www'));

//解析body
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));

//log hooks 11
var Logger = require("./log4js.js").getLogger("__filename");


// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function(socket) {
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function(data) {
        // we tell the client to execute 'new message'
        var msgType;

        data.msg = data.msg + "";

        /admin/.test(data.msg) ? msgType = 'alert' : msgType = data.type;

        console.log('msg----------------' + data.msg);
        if (/iframe/.test(data.msg) ||
            /size/.test(data.msg) ||
            /onload/.test(data.msg) ||
            /<|>/.test(data.msg) ||
            /src/.test(data.msg) ||
            /script/.test(data.msg) ||
            /style/.test(data.msg) ||
            /font/.test(data.msg) ||
            /img/.test(data.msg) ||
            /eval/.test(data.msg) ||
            /alert/.test(data.msg) ||
            /document/.test(data.msg) ||
            /href/.test(data.msg) ||
            /write/.test(data.msg)) {

            console.log('msg=========' + data.msg);
            data.msg = 'I am a pig hha...';
        }

        if (data.msg.length >= 200 && data.type != 'image') {
            data.msg = data.msg.substring(0, 200) + '......';
        }

        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data.msg,
            type: msgType
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