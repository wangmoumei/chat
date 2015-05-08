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
chat.Room = [];
chat.Room[0]={name:'Lobby',count:0};
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
		msg = that.userName[socket.id] + ': ' + msg;
		console.log(socket.id + "|" +msg);
		that.io.to(that.Room[that.currentRoom[socket.id]].name).emit('chat message', msg);
	});

}

//send system message
chat.sysMsg = function(socket) {

	var that = this;

	socket.on('sys message', function(msg){
		that.io.to(that.Room[that.currentRoom[socket.id]].name).emit('sys message', msg);
		console.log(socket.id + "|" +msg);
	});	
	
}

//assign a guest name to new joining user
chat.assignGuestName = function(socket) {

	this.userName[socket.id] = 'Guest' + this.userNum;
	this.usedName.push('Guest' + this.userNum);
	this.userNum++;

	var msg = this.userName[socket.id] + ' 加入了聊天室';
	console.log(socket.id + "|" +msg);
	this.io.emit('new user', msg);

}

//disconnection
chat.disconnect = function(socket) {

	var that = this;

	socket.on('disconnect', function(){
		var msg = that.userName[socket.id] + ' 离开了聊天室';
		that.io.emit('exit user', msg);
		that.Room[that.currentRoom[socket.id]].count--;
		
		var nameIndex = that.usedName.indexOf(that.userName[socket.id]);
		that.roomlst();
		
		delete that.userName[socket.id];
		delete that.usedName[nameIndex];   
		
		socket.leave(that.Room[that.currentRoom[socket.id]].name);

		delete that.currentRoom[socket.id]; 
	});

}

//change user name
chat.changeName = function(socket) {

	var that = this;

	socket.on('change name', function(msg){
		if (that.usedName.indexOf(msg) == -1) {

			var nameIndex = that.usedName.indexOf(that.userName[socket.id]);
			var name = that.userName[socket.id];
			that.userName[socket.id] = msg;
			that.usedName[nameIndex] = msg;
			
			socket.emit('sys message', name + '的名字已经更改为 ' + msg);
		}
		else {
			socket.emit('sys message', '你的名字已经被占用');
		}

	});
}

//assign room 'Lobby' once they enter
chat.assignRoom = function(socket) {
	console.log(this.currentRoom);
	var that = this;
	socket.join('Lobby', function(){
		that.currentRoom[socket.id] = 0;
		that.Room[0].count ++;
		that.roomlst();
	});
}

//change room
chat.changeRoom = function(socket) {

	var that = this;
	
console.log("changeRoom " + socket.id);
	socket.on('change room', function(msg){
		if(msg == that.Room[that.currentRoom[socket.id]].name) return;
		
		socket.leave(that.Room[that.currentRoom[socket.id]].name, function(){
			var sysMsg = that.userName[socket.id]+ '离开了你的房间' + that.Room[that.currentRoom[socket.id]].name ;
			that.Room[that.currentRoom[socket.id]].count--;
			that.io.to(that.Room[that.currentRoom[socket.id]].name).emit('sys message', sysMsg);
			socket.join(msg);
			var num = that.currentRoom[socket.id];
			for(var i=0;i<that.Room.length;i++){
				if(that.Room[i].name == msg){
					that.Room[i].count ++;
					that.currentRoom[socket.id] = i;
				}
			}
			if(num == that.currentRoom[socket.id]){
				var room={name:msg,count:1};
				that.Room.push(room);
				that.currentRoom[socket.id] = that.Room.length - 1;
			}
			
			
			sysMsg = '你加入了房间' + that.Room[that.currentRoom[socket.id]].name;
			//向这一个客户端广播系统消息:你加入了房间
			socket.emit('sys message', sysMsg);
			//向这一个客户端广播改房间名
			socket.emit('change room name', msg);

			that.roomlst();
		});

	});

}
chat.roomlst = function(){
	var roomlst=[];
	for(var i=0;i<this.Room.length;i++)(this.Room[i].count>0)?roomlst.push({name:this.Room[i].name,count:this.Room[i].count}):null;
	console.log(this.Room);
	//向所有人广播房间列表
	this.io.emit('room list', roomlst);
};
module.exports = chat;