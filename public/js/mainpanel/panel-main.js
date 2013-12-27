var disableNow = false;
var curCallID;
var curRoom;
var curUrl = "";
var incomingCallRef;
var curSnapshot;
var global_userObj=null;

//var raw_html='<li class="user ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-li-has-thumb ui-btn-up-c" browserid="[tag1]" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c"><!--<div class="nameInitial">JL</div>--><div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a class="ui-link-inherit"><img src="[tag2]" class="ui-li-thumb"><h3 class="ui-li-heading">[tag3]</h3><p class="ui-li-desc">[tag4]</p><div class="socialbuttons"></div></a></div></div></li>';
var raw_html='<li><a class="user" browserid="[tag1]"><img src="[tag2]" class="ui-li-thumb"><h3 class="ui-li-heading">[tag3]</h3><p class="ui-li-desc">[tag4]</p><div class="socialbuttons"></div></a><a class="deleteButton" contactid="[tag0]"></a></li>';

/**
 * Reflesh all contacts at once, any change in firebase will invoke this function
 * @param people - contact list pulled from Firebase
 */
function refleshContacts(people) {
    var self=this;
    console.log('reflesh contacts called');
    $(".user").off('click');    //de-attach events
    $(".deleteButton").off('click'); 
    var html_content="";
    for(var i in people) {  //enum people list and generate html content
        // console.log("var " + i+" = "+people[i]);
        var cooked_html='';
        if (people[i].handle) {
            // TODO: Generates something like: "ym00000,fb111111"
            var browser_id=0000;
            if (people[i].handle.yammer)
                browser_id='ym' + people[i].handle.yammer;
            else if (people[i].handle.facebook)
                browser_id='fb' + people[i].handle.facebook;

            cooked_html=raw_html.replace("[tag1]", browser_id);
            cooked_html=cooked_html.replace("[tag2]", people[i].avatar);
            cooked_html=cooked_html.replace("[tag3]", people[i].id);
            cooked_html=cooked_html.replace("[tag4]", people[i].description);
            html_content+=cooked_html;
        } else {
            // email invitation
            var fullName = people[i].firstname + ' ' + people[i].lastname;
            var avatar = "https://mug0.assets-yammer.com/mugshot/images/48x48/no_photo.png";
            cooked_html=raw_html;
            cooked_html=raw_html.replace("[tag0]", i);
            cooked_html=cooked_html.replace("[tag1]", people[i].email);
            cooked_html=cooked_html.replace("[tag2]", avatar);
            cooked_html=cooked_html.replace("[tag3]", fullName);
            cooked_html=cooked_html.replace("[tag4]", people[i].email);
            html_content+=cooked_html;
        }
    }

    $("#contactlist").html(html_content).listview('refresh');

    //attach events
    $(".user").on('click', function(evt) {
        makeCall.call(self, evt);
    });
    $(".deleteButton").on('click', function(evt) {
        removeContact(evt);
        //console.log(evt);
    });

    function makeCall(evt) {
        var externalId = $(evt.currentTarget).attr('browserID');
        //var myName=$(evt.currentTarget).find(".ui-li-heading").text();
        //console.log('externalId: ' + externalId);
        //console.log('person: ' + $(evt.currentTarget).find(".ui-li-heading").text());

        userLookup.apply(this, [externalId, function(result) {
            var callee = result.callee;
            if (callee) {
                curCallID = callee.objectId;
                $('.incperson').text($(evt.currentTarget).find(".ui-li-heading").text());
                $('.incsocial').text(externalId);
                $("#showPopup").click();
                call(callee);
                startCalltone();
            }
            else {
                // TODO: The user is not an existing colabeo user, add your own logic abt what to do.
                // if (result.facebook) {...}
                $.mobile.showPageLoadingMsg("a", "Please invite this user to install Colabeo.", true);
                setTimeout(
                  $.mobile.hidePageLoadingMsg, 2000
                );
                console.log('The user you are calling is not an colabeo user, I don\'t know what to do.');
                console.log(result);
            }
        }]);
    }

    function userLookup(externalId, done) {
        $.ajax({
            url: '/user/lookup',
            type: 'post',
            dataType: 'json',
            data: { externalId : externalId },
            success: function(data) {
                console.log(JSON.stringify(data));
                done(data);
            }
        });
    }

    function removeContact(evt) {
        var contactId = $(evt.currentTarget).attr('contactID');
        var userId = getUserID();
        var contactRef = new BerryBase('https://koalalab-berry.firebaseio.com/', userId);
        contactRef.removeContact(contactId, function(){
            console.log("Contact removed.");
        });

    }

    // check Firebase-index, find out the real Colabeo uid for this contact.
    function parseBrowserID(browserID, callback) {
        var result={};
        // TODO: Make it into a loop, in case our contact have multiple social networks
        var providerAbbr=browserID.substring(0,2);
        if (providerAbbr=='ym') {
            result.yammer=browserID.substring(2);
            this.indexRef.child('yammer').child(result.yammer).once('value', function(snapshot) {
                if (snapshot.val()) {
                    result.colabeo=snapshot.val();
                    callback(result);
                } else
                    callback(result);
            });
        }
        else if (providerAbbr=='fb') {
            result.facebook=browserID.substring(2);
            this.indexRef.child('facebook').child(result.facebook).once('value', function(snapshot) {
                if (snapshot.val()) {
                    result.colabeo=snapshot.val();
                    callback(result);
                } else
                    callback(result);
            });
        }
        else {
            result.colabeo=browserID;
            callback(result);
        }
    }
}

/**
 * Base Firebase operator
 * @param FirebaseURL
 * @param userID
 * @constructor
 */
function BerryBase(FirebaseURL, userID) {
    this.Firebase=FirebaseURL;
    this.userID=userID;
    this.FirebaseRef=new Firebase(FirebaseURL);
    this.FirebaseUserRef=this.FirebaseRef.child('users');
    this.FirebaseMyRef=this.FirebaseUserRef.child(userID);
    this.indexRef=this.FirebaseRef.child('index');
}

// callback will usually be the function thats altering html page
BerryBase.prototype.getContacts = function(callback) {
    var self=this;
    this.ContactsRef = this.FirebaseMyRef.child('contacts');
    this.ContactsRef.on('value', function(snapshot) {
        if (snapshot.name()=='contacts') {
            console.log(snapshot.val());
            callback.call(self, snapshot.val());
        } else {
            console.log("On "+ self.userID + ", no contacts found!");
        }
    });
}

BerryBase.prototype.removeContact = function(contactId, done) {
    var self=this;
    this.ContactRef = this.FirebaseMyRef.child('contacts/' + contactId);
    this.ContactRef.remove(function(error) {
        if (error) {
            console.log('Synchronization failed.');
            done();
        }
        else {
            console.log('Synchronization succeeded.');
            done();
        }
    });
}


//=================================================================
//  Utils
//=================================================================

// check social network connection status
function checkStatus(callback) {
    var jsonUrl = 'ajax/status';
    $.getJSON(jsonUrl, function(data) {
        callback(data);
    })
        .fail(function() {
            console.log('ajax.checkStatus() Fail!');
            callback(null);
        });
}

// get user id from user object
function getUserID() {
    if (global_userObj) {
        return global_userObj.objectId;
    }
    return null;
}

// retrieve user object from session cookie
function InitUserObject() {
    var user_raw= $.cookie('user');
    global_userObj=JSON.parse(atob(user_raw));
}

function getUserFullName() {
    return $('#userFirstName').attr('data-value') + ' ' + $('#userLastName').attr('data-value');
}

function GetURLParameter(sParam) {

    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

//=================================================================
//  Utils.renderingFuncs
//=================================================================

function renderSocialNetworkButton() {
    checkStatus(function(status) {
        if (status) {
            if (status.facebook) {
                $('#link_facebook').css('display', 'none');
                $('#unlink_facebook').css('display', 'inline-block');
            } else {
                $('#link_facebook').css('display', 'inline-block');
                $('#unlink_facebook').css('display', 'none');
            }
        }
    });
}

function renderUserInfo() {
    if (global_userObj) {
        $('#userId').attr('data-value', global_userObj.objectId);
        $('#userLastName').attr('data-value', global_userObj.lastname);
        $('#userFirstName').attr('data-value', global_userObj.firstname);
        $('#header h1').text(global_userObj.firstname + "'s Colabeo");
    }
}

function popupWindow(url) {
    var newWin=window.open(url, 'facebook', 'height=600, width=400');
    if (window.focus) { newWin.focus(); }
}

//=================================================================
// Main Thread
//=================================================================
//register contact list click event
$(document).ready(function() {
    InitUserObject();   // initial global user object passed from server
    var userID=getUserID();
    renderUserInfo();
    renderSocialNetworkButton();
    console.log('userId: ' + userID);
    myBerry = new BerryBase('https://koalalab-berry.firebaseio.com/', userID);
    myBerry.getContacts(refleshContacts);

    var userFullName = getUserFullName();

    $('#unlink_facebook').on('click', function() {
        $.ajax({
            url: '/de-auth/facebook',
            type: 'post',
            dataType: 'json',
            data: $('#addContactForm').serialize(),
            success: function(data) {
                if (data==='done') {
                    renderSocialNetworkButton();
                    console.log("de-auth facebook success");
                    renderSocialNetworkButton();
                }
            }
        });
    });

    $('#link_facebook').on('click', function() {
        popupWindow('/auth/facebook');
    });

    //$('.ui-input-text.ui-body-c').attr('placeholder', 'Welcome, ' + userFullName.split(' ')[0] + '!');
    $('.ui-input-text.ui-body-c').attr('placeholder', 'Search');
    $('#saveContactBtn').click( function(e) {
        e.preventDefault();
        $.ajax({
            url: '/contacts/add',
            type: 'post',
            dataType: 'json',
            data: $('#addContactForm').serialize(),
            success: function(data) {
                console.log("success");
                $( "#popupAddContact" ).popup( "close" );
            }
        });
    });

    $("#answer").on('click', function(evt) {
        answer();
    });

    $(".endBtn").on('click', function(evt) {
        var userId = getUserID();
        removeVideoChat();
        hangup(curCallID||userId);
        curCallID = null;
        curRoom = null;
        sendMessage("event", {data: {action:"endCall"}});
        stopCalltone();
    });
    setTimeout(function() {
        var userId = getUserID();
        var userFullName = getUserFullName();
        sendMessage("event", {data: {action:"syncID", id: userId, name: userFullName}});
    }, 3000);
    
    $( "#flip-audio" ).bind( "change", function(event, ui) {
      var action = "offAudio";
      if ($("#flip-audio").val() == "true") {
        action = "onAudio";
      }
      if ($(".videoChatFrame")[0]) 
        $(".videoChatFrame")[0].contentWindow.postMessage(JSON.stringify({type:"command",action:action}),"*");
    });
    $( "#flip-video" ).bind( "change", function(event, ui) {
      var action = "offVideo";
      if ($("#flip-video").val() == "true") {
        action = "onVideo";
      }
      if ($(".videoChatFrame")[0]) 
        $(".videoChatFrame")[0].contentWindow.postMessage(JSON.stringify({type:"command",action:action}),"*");
    });
  
    $(".syncBtn").on('click', function(evt) {
        var userId = getUserID();
        var userFullName = getUserFullName();
        sendMessage("event", {data: {action:"sync"}});
    });

    $("#acceptBtn").on('click', function() {
        setTimeout(answer, 600);
    });

    $("#declineBtn").on('click', function() {
        var userId = getUserID();
        if (userId)
            hangup(userId);
    });

    $("#gotoBtn").on('click', function(evt) {
        var url = $('#url');
        if (url.val() != '') {
            sendMessage("event", {
                url : url.val(),
                action : 'urlChange'
            });
            $('.urlList ul').append('<li><a class="urlListBtn">' + url.val() + '</a></li>');
            $('.urlList ul').listview('refresh');
            url.val('');
        }
    });
  
  var userId = getUserID();
  var listenRef = new Firebase('https://de-berry.firebaseio-demo.com/call/' + userId);
  listenRef.on('child_changed', function(snapshot) {
    var refCallState = snapshot.val()['state'];
    if (refCallState == "answered") {
      var roomID = snapshot.name();
      if ($('#popup:visible')[0] && !$('#chatContainer')[0])
        injectVideoChat(snapshot.name());
    }
  });
  listenRef.on('child_removed', function(snapshot) {
    $(".endBtn:visible, #declineBtn:visible").click();
  });
});

//for jQuery mobile event
$(document).on('pageinit', function(e) {
    $("#url").keydown(function(e) {
        if (e.keyCode == 13) {
            $("#gotoBtn").click();
        }
    });

    $(".urlList").on('click', function(evt) {
        console.log(evt.target.text);
        demobo.mobile.fireInputEvent('gotoUrl', evt.target.text);
    });
  
    if (isMobile()) {
		  $('body').addClass('mobile');
      preloadRingtone();
      initializeIncomingCall();
	  }
    preloadCalltone();
});

function call(callee) {
    var calleeId = callee.objectId;
    var outgoingCallRef = new Firebase('https://de-berry.firebaseio-demo.com/call/' + calleeId);
    var callerId = getUserID();
    var callerFullName = getUserFullName();
    outgoingCallRef.push({
        name : callerId,
        person : callerFullName,
        state : "calling"
    });
    outgoingCallRef.once('child_changed', function(snapshot) {
        var refCallState = snapshot.val()['state'];
        if (refCallState == "answered") {
          var roomID = snapshot.name();
          if ($('#popup:visible')[0] && !$('#chatContainer')[0])
                injectVideoChat(snapshot.name());
        }
        stopCalltone();
    });
    outgoingCallRef.once('child_removed', function(snapshot) {
        $(".endBtn:visible, #declineBtn:visible").click();
        stopCalltone();
    }); 
}

function hangup(calleeId) {
    if (!calleeId) return;
    var outgoingCallRef = new Firebase('https://de-berry.firebaseio-demo.com/call/' + calleeId);
    outgoingCallRef.remove();
}

function answer() {
    if (!curRoom) return;
    var userId = getUserID();
    var outgoingCallRef = new Firebase('https://de-berry.firebaseio-demo.com/call/' + userId);
    outgoingCallRef.child(curRoom).update({
        state : "answered"
    });
}

function injectVideoChat(roomId) {
    curRoom = roomId;
    sendMessage("event", {data: {action:"setProperty", roomId: curRoom}});
    if (!document.getElementById('chatContainer')) {
        var e = document.createElement('div');
        e.id = 'chatContainer';
        e.style.position = 'fixed';
        e.style.bottom = '-30px';
        e.style.right = '0px';
        e.style.zIndex = '999';
        document.getElementById('popup').appendChild(e);
    }
    var i = document.createElement('iframe');
    $("#flip-audio").val('true').slider("refresh");
    var video = $("#flip-video").val();
    i.src = 'https://koalabearate.appspot.com/?r=' + roomId + '&v=' + video;
    i.className = 'videoChatFrame';
    i.id = roomId;
    i.style.width = '100%';
    document.getElementById('chatContainer').appendChild(i);
}

function removeVideoChat() {
    curRoom = null;
    $('#chatContainer').remove();
    sendMessage("event", {data: {action:"setProperty", roomId: curRoom}});
}

function sendMessage(type, data) {
    if (isMobile()) return;
    if (!window.demoboBody)
        return;
    var evt = new CustomEvent("FromKoala", {
        detail : {
            type : type,
            data : data
        }
    });
    demoboBody.dispatchEvent(evt);
}

function isMobile() {
	return /mobile|android/i.test (navigator.userAgent);
}

function onExtensionMessage(e) {
    if (disableNow) return;
    console.log("onExtensionMessage: ", e.detail);
    if (e.detail.type == "urlUpdate") {
        curUrl = e.detail.data.url;
    }
    else if (e.detail.action == "incoming")	{
        console.log("incoming", e.detail);
        curRoom = e.detail.room;
        setCallerInfo({ fromPerson: e.detail.person, fromSocial: e.detail.social, answer: e.detail.answer });
    }
    else if ($(".videoChatFrame")[0]) {
        $(".videoChatFrame")[0].contentWindow.postMessage(JSON.stringify(e.detail), "*");
    }
}

function onRemoteMessage(e) {
    var cmd = JSON.parse(evt.data);
    console.log("onRemoteMessage: ", e.detail);
}

addEventListener("message", function(e) {
    disableNow = true;
    setTimeout(function(){
        disableNow = false;
    },1000);
    var evt = JSON.parse(e.data);
    if (evt.data.url && evt.data.action == "urlChange") {
        window.open(evt.data.url);
    }
    sendMessage("event", evt);
}, false);

function setCallerInfo(args) {
    console.log("setCallerInfo **** ", args.answer);
    $('.incperson').text(args.fromPerson);
    $('.incsocial').text(args.fromSocial);
    if ($('#popup:visible, #p:visible').length) return;
    if (args.answer) {
      window.location = "#popup";
      setTimeout(answer, 600);
    } else {
      window.location = "#p";
    }
}




function initializeIncomingCall() {
	if (incomingCallRef) {
		incomingCallRef.off('child_added', onAdd);
		incomingCallRef.off('child_removed', onRemove);
		incomingCallRef.off('child_changed', onRemove);
	}
	incomingCallRef = new Firebase('https://de-berry.firebaseio-demo.com/call/' + getUserID());
	incomingCallRef.on('child_added', onAdd);
	incomingCallRef.on('child_removed', onRemove);
	incomingCallRef.on('child_changed', onRemove);
}

function onAdd(snapshot) {
	curSnapshot = snapshot;
	startRingtone();
}

function onRemove(snapshot) {
	stopRingtone();
}

function preloadRingtone() {
	if (document.getElementById('ringtone'))
		return;
	var e = document.createElement('video');
	e.controls = true;
	e.id = 'ringtone';
	e.loop = true;
	e.style.display = 'none';
	e.innerHTML = '<source src="/ringtone.mp3" type="audio/mpeg">';
	document.body.appendChild(e);
}
function preloadCalltone() {
	if (document.getElementById('calltone'))
		return;
	var e = document.createElement('video');
	e.controls = true;
	e.id = 'calltone';
	e.loop = true;
	e.style.display = 'none';
	e.innerHTML = '<source src="/calltone.mp3" type="audio/mpeg">';
	document.body.appendChild(e);
}
function stopRingtone() {
	isCalling = false;
	var e = document.getElementById('ringtone');
	e && (e.pause() || (e.currentTime = 0));
};
function startRingtone() {
  console.log("startRing");
	isCalling = true;
	var e = document.getElementById('ringtone');
	e && e.play();
	setTimeout(function() {
    curRoom = curSnapshot.name();
    setCallerInfo({fromPerson: curSnapshot.val().person, fromSocial: curSnapshot.val().source, answer: false});
	}, 100);
};
function stopCalltone() {
	var e = document.getElementById('calltone');
	e && (e.pause() || (e.currentTime = 0));
};
function startCalltone() {
	var e = document.getElementById('calltone');
	e && e.play();
};