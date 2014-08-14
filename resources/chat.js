// +--------------------------------------------------------------------------------------+
// |                                    Chat object                                       |
// +--------------------------------------------------------------------------------------+

Chat = function( updateTime ) {
	var chatlog  = document.getElementById("chatlog");
	var online   = document.getElementById("online");
	var onUpdateFun = function(){};
	var userdata = {};
	var posts = {
		local: [],
		remote: [],
	}

	$("#content").jScrollPane({
		mouseWheelSpeed: 22
	});
	var scrollPane = $("#content").data('jsp');

	function login( form, success, error ) {
		$.ajax( "chat/login", {
			type: "POST",
			data: { username: form.username.val, password: form.password.val },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function register( form, success, error ) {
		$.ajax( "chat/register", {
			type: "POST",
			data: { username: form.username.val, password1: form.password1.val, password2: form.password2.val },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function post( message, success, error ) {
		$.ajax( "chat/post", {
			type: "POST",
			data: { message: message },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function getMessageList( size, success, error ) {
		$.ajax( "chat/get", {
			type: "GET",
			data: { type: "list", size: size },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function getMessageById( id, success, error ) {
		$.ajax( "chat/get", {
			type: "GET",
			data: { type: "multi", id: id.join(",") },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function getMyUserData( success, error ) {
		$.ajax( "chat/user", {
			type: "GET",
			data: { type: "me" },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function getOnline( success, error ) {
		$.ajax( "chat/online", {
			type: "GET",
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}


	function editPost( id, message, success, error ) {
		$.ajax( "chat/edit", {
			type: "GET",
			data: { id: id, message: message },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function deletePost( id, success, error ) {
		$.ajax( "chat/delete", {
			type: "GET",
			data: { type: "post", id: id },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function deleteUser( id, success, error ) {
		$.ajax( "chat/delete", {
			type: "GET",
			data: { type: "user", id: id },
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}

	function scrollToEnd() {
		scrollPane.reinitialise();
		scrollPane.scrollToPercentY( 100, true );
	}

	function push( id, name, message ) {
		var controls = name;
		if ( userdata.role >= 2 ) {
			controls += ' ';
			controls += '<button class="delete" msgid="'+id+'">X</button>';
			controls += '<button class="edit" msgid="'+id+'">ed</button>';
		}

		message = Chat.utils.replaceURL( message );
		message = Chat.utils.replaceEmoticons( message );

		var str = '<div id="message-'+id+'" class="message">';
		str += '<div class="sender '+Chat.utils.getSenderClass(name)+'">'+controls+'</div>'
		str += '<div class="text">'+message+'</div>'
		str += '</div>';
		$(chatlog).append( str );
		posts.local.push(id);
		if ( userdata.role >= 2 ) {
			$("#chatlog .delete").unbind().click( function() {
				var id = $(this).attr("msgid")
				deletePost( id, function( data ) {
					new Chat.toast().show( data.message );
					$("#chatlog #message-"+id).remove();
				}, function( data ) {
					new Chat.toast().show( data.message );
				});
			});
			$("#chatlog .edit").unbind().click( function() {
				var id = $(this).attr("msgid");
				var text = prompt( "Edit the text", $("#chatlog #message-"+id+" .text").html() );
				editPost( id, text, function( data ) {
					new Chat.toast().show( data.message );
					Chat.utils.reloadAfter( 1500 );
				}, function( data ) {
					new Chat.toast().show( data.message );
				});
			});
		}
	}

	function logout( success, error ) {
		$.ajax( "chat/logout", {
			type: "GET",
			dataType: "json",
			success: function( data ) {
				if( data.status == "success" ) { success( data ); } else { error( data ); }
			}
		});
	}


	function updateChatlog() {
		getMessageList( (posts.local.length<5) ? 100 : 10, function( data ) {
			var ids = [];
			var count = 0;
			var lastmsg = '';
			for (a in data.result) ids.push(data.result[a].id);
			ids.pop();
			posts.remote = ids.diff( posts.local );
			if ( posts.remote.length != 0 ) getMessageById( posts.remote, function( data ) {
				if ( data.result.id != undefined ) {
					lastmsg = '[' + data.result.name + '] ' + data.result.message;
					push( data.result.id, data.result.name, data.result.message );
					count++;
				} else {
					while ( data.result.length != 0 ) {
						post = data.result.pop();
						lastmsg = '[' + post.name + '] ' + post.message;
						push( post.id, post.name, post.message );
						count++;
					}
				}
				onUpdateFun( count, lastmsg );
				scrollToEnd();
			});
		});
	}

	function updateUserData() {
		getMyUserData( function( data ){
			userdata = data.result;
		}, function( data ) {
			new Chat.toast().show( data.message );
			logout( function(){
				Chat.utils.reloadAfter( 1500 );
			}, function(){
				Chat.utils.reloadAfter( 1500 );
			} );
		});
		setTimeout( function() {
			getOnline( function( data ){
				function appendOnline( user ) {
					var html = '<div class="user" userid="'+user.id+'">'+user.username+' ';
					switch ( user.role ) {
						case '0': html += '(B)'; break;
						case '2': html += '(M)'; break;
						case '3': html += '(A)'; break;
					}
					if ( userdata.role >= 3 ) {
						html += ' ';
						html += '<button class="delete" userid="'+user.id+'">X</button>';
					}
					html += '</div>'; return html;
				}
				var html = '';
				if ( data.result.id != undefined ) {
					html += appendOnline( data.result );
				} else {
					for ( var i=0; i<data.result.length; i++ ) html += appendOnline( data.result[i] );
				}
				if ( html.length < 2 ) {
					html += '<span>Nobody is online</span>';
				}
				$("#online #list").html( html );
				if ( userdata.role >= 3 ) {
					$("#online .delete").unbind().click( function() {
						var id = $(this).attr("userid");
						if ( confirm("You are about to delete a user #"+id+". Are you sure?") ) {
							deleteUser( id, function( data ) {
								new Chat.toast().show( data.message );
							}, function( data ) {
								new Chat.toast().show( data.message );
							});
						}
					});
				}
			});
		}, 2000 );
	}

	function updateUserInterface() {
		scrollPane.reinitialise();
		var msg = $("#message").val();
		if ( msg != undefined ) {
			$("#message").css( "width", $(document).width() - 245 );
			if( msg.length > 160 ) $("#message").val( msg.substring(0, 160) );
			$("#counter").html( 160 - msg.length );
		}
	}

	updateUserData();
	setTimeout( updateChatlog, parseInt(updateTime/2) );
	setInterval( updateChatlog, updateTime );
	setInterval( updateUserInterface, 2500 );
	setInterval( updateUserData, 5000 );

	this.login = login;
	this.logout = logout;
	this.register = register;
	this.post = post;
	this.onUpdate = function( fun ) { onUpdateFun = fun };
}




// +--------------------------------------------------------------------------------------+
// |                                    Audio Player                                      |
// +--------------------------------------------------------------------------------------+

Chat.audio = function() {
	var audio = {};
	var first_error = false;
	var ext = (function() {
		//if ( new Audio().canPlayType('audio/mpeg;') ) return "mp3";
		//else return "oga";
		return "oga";
	})();

	audio.receive = new Audio("resources/receive."+ext);
	audio.error   = new Audio("resources/error."+ext);
	audio.success = new Audio("resources/success."+ext);
	function playAudio( a ) { a.pause(); a.currentTime = 0; a.play(); }

	this.play = function( type ) {
		try {
			switch( type ) {
				case "receive": playAudio( audio.receive ); break;
				case "error":   playAudio( audio.error ); break;
				case "success": playAudio( audio.success ); break;
				default:        playAudio( audio.success ); break;
			}
		} catch( error ) {
			if ( !first_error ) {
				new Chat.toast().show("Cannot play audio of '"+type+"' type");
				first_error = true;
			}
		}
	}
}




// +--------------------------------------------------------------------------------------+
// |                                Titlebar notification                                 |
// +--------------------------------------------------------------------------------------+

Chat.notification = function() {
	var defaultTitle = document.title;
	var totalCount = 0;
	var isFocused = true;
	var lastmsg = '';

	$(window).focus( function() {
		isFocused = true;
		totalCount = 0;
		document.title = defaultTitle;
	});

	$(window).blur( function() {
		isFocused = false;
	});

	(function a() {
		if ( isFocused ) totalCount = 0;
		if ( ! isFocused && totalCount != 0 ) document.title = '('+totalCount+') ' + lastmsg;
		setTimeout( a, 500 );
	}( true ));

	this.update = function( count, msg ) {
		totalCount += count;
		lastmsg = msg;
	}
}





// +--------------------------------------------------------------------------------------+
// |                                      Loginbox                                        |
// +--------------------------------------------------------------------------------------+

Chat.loginbox = function() {
	var inputbox;
	var status;
	var onEnter = function(){};

	function spawn() {
		var serial = Chat.utils.getRandomSerial( "loginbox", 4 );
		var str = '<div id="' + serial + '">';
		str += '<div class="popup">';
		str += '<div class="header">Login</div>';
		str += '<button id="close">X</button>';
		str += '<div class="body">';
		str += '<div class="label">Username</div><input id="username"><div class="error" id="username-error">!</div><br>';
		str += '<div class="label">Password</div><input id="password" type="password"><div class="error" id="password-error">!</div><br>';
		str += '</div>';
		str += '<div class="actions"><button id="submit">Login</button></div>';
		str += '</div>';
		str += '<div class="popup-background"></div>';
		str += '</div>';
		$(document.body).append( $(str) );
		inputbox = $("#"+serial).get(0);
	}

	function focus() {
		setTimeout( function() {
			$("#"+inputbox.id+" input").get(0).focus();
		}, 120 );
	}

	function get() {
		var v = [];
		for ( i=0;; i++ ) {
			elem = $("#"+inputbox.id+" input").get(i);
			if ( elem != null ) {
				v[i] = v[ $(elem).attr("id") ] = {
					id:    $(elem).attr("id"),
					val:   $(elem).val()
				};
			} else break;
		} return v;
	}

	function show() {
		if( !status ) {
			status = true;
			$("#"+inputbox.id+" #close").unbind().click( hide );
			$(document).unbind().keydown( function(event) {
				key = event.keyCode || event.which || null;
				if ( key == 27 ) hide();
				if ( key == 13 ) enter();
			});
			$("#"+inputbox.id+" #submit").unbind().click( enter );
			$("#"+inputbox.id+" .popup").css({
				"position": "fixed",
				"top": document.documentElement.clientHeight/2 - $("#"+inputbox.id+" .popup").height()/2,
				"left": document.documentElement.clientWidth/2 - $("#"+inputbox.id+" .popup").width()/2
			});
			$("#"+inputbox.id+" .popup-background").fadeTo( 200, 0.3 );
			$("#"+inputbox.id+" .popup").fadeTo( 80, 1 );
			focus();
		} return this;
	}

	function hide() {
		if( status ) {
			status = false;
			$("#"+inputbox.id+" .popup-background").fadeOut( 300 );
			$("#"+inputbox.id+" .popup").fadeOut( 100 );
		} return this;
	}

	function enter() {
		onEnter( get() );
	}

	function setError( field, value ) {
		$("#"+inputbox.id+" #"+field+"-error").css( "background", value ? "#F00" : "#FFF" );
	}

	this.setError = setError;
	this.show = show;
	this.hide = hide;
	this.get = get;

	this.onEnter = function( fun ) { onEnter = fun };

	spawn();
}




// +--------------------------------------------------------------------------------------+
// |                                     Registerbox                                      |
// +--------------------------------------------------------------------------------------+

Chat.registerbox = function() {
	var inputbox;
	var status;
	var onEnter = function(){};

	function spawn() {
		var serial = Chat.utils.getRandomSerial( "registerbox", 4 );
		var str = '<div id="' + serial + '">';
		str += '<div class="popup">';
		str += '<div class="header">Registration</div>';
		str += '<button id="close">X</button>';
		str += '<div class="body">';
		str += 'Username can contain only:<br>0-9, A-Z, "-", "." and "_" characters.<br>No spaces allowed.<hr>';
		str += '<div class="label">Username</div><input id="username"><div class="error" id="username-error">!</div><br>';
		str += '<div class="label">Password</div><input id="password1" type="password"><div class="error" id="password1-error">!</div><br>';
		str += '<div class="label">...repeat</div><input id="password2" type="password"><div class="error" id="password2-error">!</div><br>';
		str += '</div>';
		str += '<div class="actions"><button id="submit">Register</button></div>';
		str += '</div>';
		str += '<div class="popup-background"></div>';
		str += '</div>';
		$(document.body).append( $(str) );
		inputbox = $("#"+serial).get(0);
	}

	function focus() {
		setTimeout( function() {
			$("#"+inputbox.id+" input").get(0).focus();
		}, 120 );
	}

	function get() {
		var v = [];
		for ( i=0;; i++ ) {
			elem = $("#"+inputbox.id+" input").get(i);
			if ( elem != null ) {
				v[i] = v[ $(elem).attr("id") ] = {
					id:    $(elem).attr("id"),
					val:   $(elem).val()
				};
			} else break;
		} return v;
	}

	function show() {
		if( !status ) {
			status = true;
			$("#"+inputbox.id+" #close").unbind().click( hide );
			$(document).unbind().keydown( function(event) {
				key = event.keyCode || event.which || null;
				if ( key == 27 ) hide();
				if ( key == 13 ) enter();
			});
			$("#"+inputbox.id+" #submit").unbind().click( enter );
			$("#"+inputbox.id+" .popup").css({
				"position": "fixed",
				"top": document.documentElement.clientHeight/2 - $("#"+inputbox.id+" .popup").height()/2,
				"left": document.documentElement.clientWidth/2 - $("#"+inputbox.id+" .popup").width()/2
			});
			$("#"+inputbox.id+" .popup-background").fadeTo( 200, 0.3 );
			$("#"+inputbox.id+" .popup").fadeTo( 80, 1 );
			focus();
		} return this;
	}

	function hide() {
		if( status ) {
			status = false;
			$("#"+inputbox.id+" .popup-background").fadeOut( 300 );
			$("#"+inputbox.id+" .popup").fadeOut( 100 );
		} return this;
	}

	function enter() {
		onEnter( get() );
	}

	function setError( field, value ) {
		$("#"+inputbox.id+" #"+field+"-error").css( "background", value ? "#F00" : "#FFF" );
	}

	this.setError = setError;
	this.show = show;
	this.hide = hide;
	this.get = get;

	this.onEnter = function( fun ) { onEnter = fun };

	spawn();
}




// +--------------------------------------------------------------------------------------+
// |                                        Toast                                         |
// +--------------------------------------------------------------------------------------+

Chat.toast = function() {
	var toast;

	function spawn() {
		var serial = Chat.utils.getRandomSerial( "toast", 4 );
		var str = '<div id="' + serial + '" class="toast"></div>';
		$(document.body).append( $(str) );
		toast = $("#"+serial).get(0);
	}

	function show( text ) {
		if ( text != undefined ) set( text );
		$(toast).stop().fadeOut(0);
		$(toast).fadeIn( 50 ).delay( 500 ).fadeOut( 2000 );
	}

	function set( text ) {
		$(toast).html( text );
	}

	this.show = show;
	this.set = set;
	spawn();
}




// +--------------------------------------------------------------------------------------+
// |                                   Utility functions                                  |
// +--------------------------------------------------------------------------------------+

Chat.utils = {};

Chat.utils.getRandomSerial = function( name, length ) {
	return name + "-" + Math.floor(Math.random() * Math.pow(10,length));
}

Chat.utils.reloadAfter = function( time ) {
	setTimeout( function() {
		location.reload();
	}, time );
}

Chat.utils.getUrlParameter = function( name ) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp( "[\\?&]"+name+"=([^&#]*)" );
	var results = regex.exec( window.location.href );
	if( results == null ) return undefined; return results[1];
}

// ----- Array diff function -----
Array.prototype.diff = function(a) {
	return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};

Chat.utils.replaceURL = function( text ) {
	var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
	return text.replace(exp,"<a href='$1' target='_blank'>$1</a>"); 
}

Chat.utils.emoticons = {
	':)' : 'happy', ':(' : 'sad', ':-)' : 'happy', ':-(' : 'sad', ';)' : 'wink', ';(' : 'crying',
	';-)' : 'wink', ';-(' : 'crying', ':\'(' : 'crying', '^_^' : 'nian', ':P' : 'tongue', '-_-' : 'tired',
	':-P' : 'tongue', ':p' : 'tongue', ':-p' : 'tongue', ':D' : 'grin', ':-D' : 'grin', ':DD' : 'grin',
	':3' : 'cute', ';3' : 'cute-wink', '8)' : 'sunglasses', ':/' : 'uncertain', ';/' : 'uncertain',
	'D:' : 'terrified', ':S' : 'confused', 'x(' : 'angry', 'x)' : 'laughing', 'xD' : 'laughing'
}

Chat.utils.replaceEmoticons = function( text ) {
	var text = " "+text;
	var emoticons = Chat.utils.emoticons;
	var patterns = [];
	var metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;

	// build a regex pattern for each defined property
	for (var i in emoticons) {
		if (emoticons.hasOwnProperty(i)){ // escape metacharacters
			patterns.push('( '+i.replace(metachars, "\\$&")+')');
		}
	}

	// build the regular expression and replace
	return text.replace(new RegExp(patterns.join('|'),'g'), function (match) {
		return typeof emoticons[match.substr(1)] != 'undefined' ?
		' <img src="resources/smileys/'+emoticons[match.substr(1)]+'.png">' :
		match;
	}).substr(1);
}

Chat.utils.getSenderClass = function( sender ) {
	var offset = Chat.utils.simpleDigest( sender ) % 26 + 1;
	return 's'+offset;
}

Chat.utils.initialDigest = Math.floor(Math.random()*26);
Chat.utils.simpleDigest = function( str ) {
	var digest = Chat.utils.initialDigest;
	for ( var i = 0; i < str.length; i++ ) digest += str.charCodeAt(i);
	return digest;
}




// +--------------------------------------------------------------------------------------+
// |                                      Entrypoint                                      |
// +--------------------------------------------------------------------------------------+

$(document).ready( function() {
	var audio        = new Chat.audio();
	var toast        = new Chat.toast();
	var notification = new Chat.notification();
	var loginbox     = new Chat.loginbox();
	var registerbox  = new Chat.registerbox();


	if ( Chat.utils.getUrlParameter("donated") != undefined ) {
		toast.show("You have donated $" + Chat.utils.getUrlParameter("donated") + " to this project. Thank you!");
	}

	var chat = new Chat( 2000 );
	chat.onUpdate( function( c, m ) {
		audio.play("receive");
		notification.update( c, m );
	})

	$("#login").click( function() {
		loginbox.show();
		loginbox.onEnter( function( form ) {
			loginbox.setError( "username", false );
			chat.login( form, function( data ) {
				loginbox.hide();
				audio.play("success");
				toast.show( data.message );
				Chat.utils.reloadAfter( 1500 );
			}, function( data ) {
				audio.play("error");
				toast.show( data.message );
				loginbox.setError( "username", true );
			});
		});
	});

	$("#register").click( function() {
		registerbox.show();
		registerbox.onEnter( function( form ) {
			registerbox.setError( "username",  false );
			registerbox.setError( "password1", false );
			registerbox.setError( "password2", false );
			chat.register( form, function( data ) {
				registerbox.hide();
				audio.play("success");
				toast.show( data.message );
				Chat.utils.reloadAfter( 1500 );
			}, function( data ) {
				audio.play("error");
				toast.show( data.message );
				if ( data.field != undefined ) registerbox.setError( data.field, true );
			});
		});
	});

	$("#logout").click( function() {
		chat.logout( function( data ) {
			audio.play("success");
			toast.show( data.message );
			Chat.utils.reloadAfter( 1500 );
		});
	});

	$("#messagebox").submit( function() {
		chat.post( $("#message").val(), function( data ) {
			// audio.play("send");
			$("#message").val('');
		}, function( data ) {
			audio.play("error");
			toast.show( data.message );
		});
		return false;
	});
});