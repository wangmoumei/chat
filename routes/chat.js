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
//房间数组,一个房间就是一个Room数组里的元素
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
		
		//客户端链接上一后,先把所有的事件绑绑好
		//一个一个绑写起来会把这个connection函数写太长,所以就分开成几个函数,分开绑吧。架构Get。
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
	//绑发消息的事件,客户端发消息的时候就来激活这个
	socket.on('chat message', function(msg){
		msg = that.userName[socket.id] + ': ' + msg;
		console.log(socket.id + "|" +msg);
		
		//只向这个房间范围的客户端广播,用到io.to(范围).emit
		that.io.to(that.Room[that.currentRoom[socket.id]].name).emit('chat message', msg);
	});

}

//send system message
chat.sysMsg = function(socket) {

	var that = this;

	socket.on('sys message', function(msg){
		//系统消息也只发到这个房间里,io.to(范围).emit
		that.io.to(that.Room[that.currentRoom[socket.id]].name).emit('sys message', msg);
	});	
	
}

//assign a guest name to new joining user
chat.assignGuestName = function(socket) {

	this.userName[socket.id] = 'Guest' + this.userNum;
	this.usedName.push('Guest' + this.userNum);
	this.userNum++;
	
	var msg = this.userName[socket.id] + ' 加入了聊天室';
	//新用户加入,全站广播 io.emit
	this.io.emit('new user', msg);

}

//disconnection
chat.disconnect = function(socket) {

	var that = this;

	socket.on('disconnect', function(){
		var msg = that.userName[socket.id] + ' 离开了聊天室';
		//用户关闭网页,断开链接,全站广播 io.emit
		that.io.emit('exit user', msg);
		//房间里的人数减1
		that.Room[that.currentRoom[socket.id]].count--;
		//更新房间列表
		that.roomlst();
		//用户列表里找到,然后delete
		var nameIndex = that.usedName.indexOf(that.userName[socket.id]);
		
		
		delete that.userName[socket.id];
		delete that.usedName[nameIndex];   
		//链接拜拜
		socket.leave(that.Room[that.currentRoom[socket.id]].name);

		delete that.currentRoom[socket.id]; 
	});

}

//change user name
chat.changeName = function(socket) {

	var that = this;

	socket.on('change name', function(msg){
		//判断要改的名字是否在用户列表里已经存在,数组的indexof找序号功能
		if (that.usedName.indexOf(msg) == -1) {

			var nameIndex = that.usedName.indexOf(that.userName[socket.id]);
			var name = that.userName[socket.id];
			that.userName[socket.id] = msg;
			that.usedName[nameIndex] = msg;
			
			//改了名字,只像这个用户自己广播socket.emit
			socket.emit('sys message',  '你的名字已经更改为 ' + msg);
			//也告诉房间里的所有人吧
			that.io.to(that.Room[that.currentRoom[socket.id]].name).emit('sys message',  name + '的名字已经更改为 ' + msg);
		}
		else {
			socket.emit('sys message', '你的名字已经被占用');
		}

	});
}

//这个函数里没有绑定事件,只是让新用户一进来直接进到lobby房间
chat.assignRoom = function(socket) {
	var that = this;
	//将这个用户限定到lobby广播范围,这样下次可以直接用to('lobby').emit来广播这个范围里的所有人。
	//这个<范围>跟<房间>类似，不知道学名叫什么。socket.io内置函数join
	socket.join('Lobby', function(){
		that.currentRoom[socket.id] = 0;
		that.Room[0].count ++;
		//更新房间列表
		that.roomlst();
	});
}

//change room
chat.changeRoom = function(socket) {

	var that = this;
	socket.on('change room', function(msg){
		//如果用户的房间还是原来这个,捣乱啊这是,不给换,直接return
		if(msg == that.Room[that.currentRoom[socket.id]].name) return;
		//先让用户离开他原来的范围，内置函数leave
		socket.leave(that.Room[that.currentRoom[socket.id]].name, function(){
			//离开房间，人数减少，然后广播给房间的人：有人离开了
			var sysMsg = that.userName[socket.id]+ '离开了你的房间' + that.Room[that.currentRoom[socket.id]].name ;
			that.Room[that.currentRoom[socket.id]].count--;
			that.io.to(that.Room[that.currentRoom[socket.id]].name).emit('sys message', sysMsg);
			//再让用户加入新的范围
			socket.join(msg);
			var num = that.currentRoom[socket.id];
			//如果房间已经在chat.Room数组里存在,直接数量++就好
			for(var i=0;i<that.Room.length;i++){
				if(that.Room[i].name == msg){
					that.Room[i].count ++;
					that.currentRoom[socket.id] = i;
				}
			}
			//如果没存在，创建一个新房间
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
			//向所有人广播房间列表和人数
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