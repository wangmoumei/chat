/**
 * index.js
 * @author LeeHey 
 * @email lcxfs1991@gmail.com
 * @description
 * This file is to setup the basic Node.js server and require necessary server module
 */
 
//express.js framework
//express.js 框架
var express = require('express');
var app = express();
 
//create an http object based on express.js
//基于express.js新建http对象
var http = require('http').Server(app);
 
//module manage folder path
//这是一个管理文件路径的模块
var path = require('path');
 
//main processing file
//主要处理聊天室系统的文件，稍后详细解释
var chat = require('./routes/chat');
 
//set /public as the folder to serve static files
//设置/public作为存放静态文件（如模块，样式）的文件夹
app.use(express.static(path.join(__dirname, 'public')));
 
//route / to /public/index.html
//使‘/’的请求都会输出./public/index.html文件内容
app.get('/', function(req, res){
  res.sendFile('./public/index.html');
});
 
 
//initialize all http setting in chat object
//初始化聊天室
chat.initialize(http);
 
 
//listen to port 2501
//监听2501端口
http.listen(2501, function(){
  console.log('listening on *:2501');
});