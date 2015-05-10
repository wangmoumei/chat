# chat 基于nodejs + socket.io 的聊天室
<p>chat code from other developer,study!网上找到的别人的代码，拿来学习一下吧。</p>

<p>发现原来版本的有些功能函数写了，但是没实现，我补充好，然后改改UI</p>
<p>原版本链接<a href="https://github.com/lcxfs1991/chat-socket.io">点击我</a></p>
<h3>第一次修改内容</h3>
<p>发现原来的代码没有更新房间列表，我加了更新的函数roomlist</p>
<p>尽可能多的加一些注释，让后面的初学者少爬些坑。。</p>
<p>UI后面再继续改吧</p>
<pre>
chat.roomlst = function(){
	var roomlst=[];
	for(var i=0;i<this.Room.length;i++)(this.Room[i].count>0)?roomlst.push({name:this.Room[i].name,count:this.Room[i].count}):null;
	console.log(this.Room);
	//向所有人广播房间列表
	this.io.emit('room list', roomlst);
};
</pre>
<h3>第二次修改内容</h3>
<p>今天比较闲。。也没有打游戏。。</p>
<p>更新了UI，原版的实在看不下去。有了心怡的UI才有动力学下去！233</p>
<img src="https://github.com/wangmoumei/chat/blob/master/public/image/ver2.0.png" width=400/>
<p>233 顺手做了移动版</p>
