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
// server.listen('/tmp/nginx.socket');
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
var generateRandomColor=()=>{
              var letters = '0123456789ABCDEF';
              var color = '#';
              for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
              }
              return color;
            }
generateFood(100,1980);

/**
 * Socket connection
 * @param {object} socket - socket object.
 */

io.on('connection', (socket) => {
    var connected=false;
    var currentPlayer = {
        id: socket.id,
        size:40,
        color: generateRandomColor(),
        invincible: true,
        team:'solo'
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

            socket.emit('confirmMessage', {
                msg:1,
                id:socket.id,
                color:currentPlayer.color
            });
            currentPlayer.uname=from;
            players.push(currentPlayer);
            socket.emit('game',{
                players:players,
                food:food
            });
            socket.broadcast.emit('playerJoin', currentPlayer);
            connected=true;
            
        }else{
                socket.emit('confirmMessage', {
                    msg:0
                });
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
                    break;
                }
            }
            socket.broadcast.emit('playerDisconnect', { uname: currentPlayer.uname });
        }
        
    });

    // change food pos
    socket.on('changeFoodPos',(from)=>{
        socket.broadcast.emit('changeFoodPos',from);
        for(var i=0;i<food.length;i++){
            if(food[i].id==from.id){
                food[i].left=from.coords.left;
                food[i].top=from.coords.top;

            }
        }
    })

    // update enemy size
    socket.on('increaseEnemy',(from)=>{

        socket.broadcast.emit('increaseEnemy',from);
        // for(var i=0;i<players.length;i++){
        //     if(players[i].uname==from.target){
        //         players[i].size=from.targetCurrSize;
        //         break;
        //     }
        // }
    })

    // update my size
    socket.on('updateSize',(from)=>{
        console.log(from);
        for(var i=0;i<players.length;i++){
            if(players[i].uname==from.uname){
                players[i].size=from.size;
                break;
            }
        }
    })

    // moving message
    socket.on('moving', (from)=>{
        socket.broadcast.emit('moving', from);
    })

    // kick player when he'd been eaten
    socket.on('kickMe',(uname)=>{
        for(var i=0;i<players.length;i++){
                if(players[i].uname==uname){
                    var index=players.indexOf(players[i]);
                    if(index>-1){
                        players.splice(index,1);
                    }
                    break;
                }
            }
            socket.broadcast.emit('playerDisconnect', { uname: uname });
    });

    // I'm not invincible anymore
    socket.on('notInvincible',(from)=>{
        for(var i=0;i<players.length;i++){
                if(players[i].uname==from){
                    players[i].invincible=false;
                    socket.broadcast.emit('notInvincible',from);
                    break;
                }
            }
    })

    // send team invitation
    socket.on('askForTeam',(from)=>{
        console.log(from.player);
        socket.broadcast.to(from.player).emit('askForTeam', from.other);
    });

    // confirm team
    socket.on('confirmTeam',(from)=>{
        socket.broadcast.to(from.player).emit('confirmTeam', from.team);
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