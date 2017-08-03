'use strict';

// module dependencies.
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const serveStatic = require('serve-static');
const db = require('./app/connection');
const app = express();
const port = 3000;
const accModel = require('./app/models/accModel');
const compModel = require('./app/models/compModel');
const gameModel = require('./app/models/gameModel');
const generate = require('./app/game_logic/generateGames');

// set views path, template engine and default layout
app.use('/lib', serveStatic(path.normalize(__dirname) + '/bower_components'));
app.use(serveStatic(path.normalize(__dirname) + '/public'));

// add request body data under ".body"
app.use(bodyParser.json());

// add routes in the application
require('./app/routes/index')(app);

// default route 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/views/index.html');
});
app.set('port', (process.env.PORT || 5000));
// start the app by listening on 3000
const server = app.listen(app.get('port'), ()=>{
    console.log('Open.io runs on port ' + app.get('port'));
});
server.listen('/tmp/nginx.socket');
const io = require('socket.io')(server);
var players=[];
var food=[];

var generateFood=(quantity,size)=>{
    for(var i=0;i<quantity;i++){
        food.push({
            id:i,
            left:Math.random() * (size - 0) + 0,
            top:Math.random() * (size - 0) + 0
        })      
    }
}
generateFood(3,800);

/**
 * Socket connection
 * @param {object} socket - socket object.
 */
var room="game";
io.on('connection', (socket) => {
    var connected=false;
    var currentPlayer = {
        id: socket.id,
        size:null,
        hue: Math.round(Math.random() * 360),
        type: null,
        lastHeartbeat: new Date().getTime(),
        target: {
            x: 0,
            y: 0
        }
    };

    // try to connect with a certain username
    socket.on('tryConnect',(from)=>{
        var ok=true;
        for(var i=0;i<players.length;i++){
            if(players[i].uname==from){
                ok=false;
            }
        }
        if(ok){
            socket.join(room);
            socket.emit('confirmMessage', 1);
            currentPlayer.uname=from;
            players.push(currentPlayer);
            socket.emit('game',{
                players:players,
                food:food
            });
            socket.broadcast.emit('playerJoin', currentPlayer);
            connected=true;
            
        }else{
                socket.emit('confirmMessage', 0);
        }
    });



    // in case of an unexpected disconnection remove me from players list
    socket.on('disconnect', (from) => {
        if(connected){
            for(var i=0;i<players.length;i++){
                if(players[i].id==socket.id){
                    var index=players.indexOf(players[i]);
                    if(index>-1){
                        players.splice(index,1);
                    }
                }
            }
            console.log(room);
            socket.broadcast.emit('playerDisconnect', { uname: currentPlayer.uname });
        }
        
    });

    // change food pos
    socket.on('changeFoodPos',(from)=>{
        socket.broadcast.emit('changeFoodPos',from);
    })

    // update enemy size
    socket.on('increaseEnemy',(from)=>{
        socket.broadcast.emit('increaseEnemy',from);
    })

    // moving message
    socket.on('moving', (from)=>{
        socket.broadcast.emit('moving', from);
    })

    
    // new message
    socket.on('newMessage', (from) => {
       
        socket.broadcast.emit('newMessage', {
            source: from
        });
    });

});

// expose app
exports = module.exports = app;