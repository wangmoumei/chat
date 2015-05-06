//express.js framework
var express = require('express');
var app = express();

//socket io module
var socketIo = require('socket.io');

// create a new ojbect chat
var chat = {};

//chat property
// io object
chat.io = false;
//user name
chat.userName = {};
//name has been used
chat.usedName = [];
//user number
chat.userNum = 0;
//current room name
chat.currentRoom = {};

//chat initialization with the passing http object
chat.initialize = function(http) {
	console.log(this);
	this.io = socketIo(http);
	this.ioListen();
	
}

// major socket listening method
chat.ioListen = function() {
	
	var that = this;

	this.io.on('connection', function(socket){
		
		that.assignRoom(socket);

		that.changeRoom(socket);

		that.sysMsg(socket);

		that.userMsg(socket);

		that.assignGuestName(socket);

		that.changeName(socket);

		that.disconnect(socket);

		console.log('socket connection');
	});
}

// send user message
chat.userMsg = function(socket) {

	var that = this;

	socket.on('chat message', function(msg){
		msg = that.userName[socket.id] + ' said: ' + msg;
		console.log(socket.id + "|" +msg);
		that.io.to(that.currentRoom[socket.id]).emit('chat message', msg);
	});

}

//send system message
chat.sysMsg = function(socket) {

	var that = this;

	socket.on('sys message', function(msg){
		that.io.to(that.currentRoom[socket.id]).emit('sys message', msg);
		console.log(socket.id + "|" +msg);
	});	
	
}

//assign a guest name to new joining user
chat.assignGuestName = function(socket) {

	this.userName[socket.id] = 'Guest' + this.userNum;
	this.usedName.push('Guest' + this.userNum);
	this.userNum++;

	var msg = this.userName[socket.id] + ' enter the room! Welcome!';
console.log(socket.id + "|" +msg);
	this.io.emit('new user', msg);

}

//disconnection
chat.disconnect = function(socket) {

	var that = this;

	socket.on('disconnect', function(){
		var msg = that.userName[socket.id] + ' just left';
console.log(socket.id + "|" +msg);
		that.io.emit('exit user', msg);

		var nameIndex = that.usedName.indexOf(that.userName[socket.id]);

		delete that.userName[socket.id];
		delete that.usedName[nameIndex];   

		socket.leave(that.currentRoom[socket.id]);

		delete that.currentRoom[socket.id]; 
	});

}

//change user name
chat.changeName = function(socket) {

	var that = this;

	socket.on('change name', function(msg){
		console.log("change name "+socket.id + "|" +msg);
		if (that.usedName.indexOf(msg) == -1) {

			var nameIndex = that.usedName.indexOf(that.userName[socket.id]);
			that.userName[socket.id] = msg;
			that.usedName[nameIndex] = msg;
			socket.emit('sys message', 'Your name has been changed as ' + msg);
		}
		else {
			socket.emit('sys message', 'Your name has been used');
		}

	});
}

//assign room 'Lobby' once they enter
chat.assignRoom = function(socket) {
	
	var that = this;
	socket.join('Lobby', function(){
		that.currentRoom[socket.id] = 'Lobby';
	});
}

//change room
chat.changeRoom = function(socket) {

	var that = this;
console.log("changeRoom " + socket.id);
	socket.on('change room', function(msg){

		var sysMsg = that.userName[socket.id] + ' left room ' + that.currentRoom[socket.id];

		that.io.to(that.currentRoom[socket.id]).emit('sys message', sysMsg);

		socket.leave(that.currentRoom[socket.id], function(){

			socket.join(msg);

			that.currentRoom[socket.id] = msg;

			sysMsg = that.userName[socket.id] + ' join room ' + that.currentRoom[socket.id];
			
			socket.emit('sys message', sysMsg);

			socket.emit('change room name', msg);

		});

	});

}

module.exports = chat;