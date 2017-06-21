var express = require('express');
var app = express();
var path = require('path');
var http = require('http').createServer(app).listen(3000);
var io = require('socket.io')(http);



var rooms = [];



var playerfirst,playersecond;

app.use(express.static(path.join(__dirname, 'public')));
//app.set('views', path.join(__dirname, '/'));

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/views/index.html')
});


function init(){
	
  setEventHandlers();
}


var setEventHandlers = function() {
  // Socket.IO
  io.sockets.on("connection", onSocketConnection);
};


function onSocketConnection(client) {

	console.log("New player has connected: "+client.handshake.query.name);
	//console.log(client.handshake.query.name);
	console.log('Online Users :'+(rooms.length+1));

	if(rooms.length % 2 == 0){
		// EVEN
		    var new_room = (""+Math.random()).substring(2,7);
			rooms.push({'name':client.handshake.query.name,'room':new_room,'socket_id':client});
			client.join(new_room);
			//console.log(rooms);
			io.to(new_room).emit('msg',{body:'Waiting for Other Player....'});
			

	}else{
		// ODD
		
		var last = rooms[rooms.length - 1];
		rooms.push({'name':client.handshake.query.name,'room':last.room,'socket_id':client});
		client.join(last.room);
		//console.log(rooms);
		playersecond = rooms[rooms.length - 1];
	    playerfirst = rooms[rooms.length - 2];

		playerfirst.socket_id.emit("start", {myTurn: true, symbol: 'X',room:last.room});
    	playersecond.socket_id.emit("start", {myTurn: false, symbol: 'O',room:last.room});

		io.to(last.room).emit('opponents',{opponents:playerfirst.name.toUpperCase()+' VS '+playersecond.name.toUpperCase()});
		
	}
	
 client.on("move", playerMove);

  

  // Listen for client disconnected
  client.on("disconnect", onClientDisconnect);

  client.on('playAgain',function(data){
  	io.to(data.room).emit('playAgain',{});
  

  });

  client.on('gameTie',function(data){
	io.to(data.room).emit('gameTie');
});

  client.on("winner",function(data){
  	
  	io.to(data.room).emit('gameover',{winner:data.name.toUpperCase()});
  });

};





// Socket client has disconnected
function onClientDisconnect() {
   console.log('User Disconnected '+this.id);

  for (var i = 0; i < rooms.length; i++) {
    var socket_id = rooms[i].socket_id.id;

   	if(socket_id==this.id){

   		io.to(rooms[i].room).emit('disconnect',{'name':rooms[i].name});
   		var position = (rooms.indexOf(rooms[i])+1);
   		if(position % 2 == 0){
   			var otherplayer = (rooms.indexOf(rooms[i])-1);
   			rooms.splice(rooms.indexOf(rooms[i]),1);
   			rooms.splice(otherplayer,1);
   		

   		}else{
   			var otherplayer = (rooms.indexOf(rooms[i])+1);
   			rooms.splice(rooms.indexOf(rooms[i]),1);
   			rooms.splice(otherplayer,1);
   			
   		}
   		console.log('Online Users :'+(rooms.length));
   		 
   		}
   	}

};

function playerMove(data) {
	var square_id = data.id;
	var clas = data.class;
	var symbol = data.symbol;
	var roomno = data.room;
	if(symbol == 'X'){
		next = 'O';
	}else{
		next = 'X';
	}

	io.to(roomno).emit('change',{
		square_id:square_id,
		clas:clas,
		symb:symbol
	});

	io.to(roomno).emit("turn", {myTurn: true,next:next});
	


};







init();





