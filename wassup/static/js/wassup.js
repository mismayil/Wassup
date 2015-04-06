'use strict'

var PROTOCOL_VERSION = '1.3';
var CREATE_USER = 'create_user';
var USER_EXISTS = 'user_exists';
var ADD_FRIEND = 'add_friend_if_exists';
var REMOVE_FRIEND = 'remove_friend';
var GET_FRIENDS = 'get_friends';
var SEND_SUP = 'send_sup';
var REMOVE_SUP = 'remove_sup';
var CLEAR_SUPS = 'clear_sups';
var GET_SUPS = 'get_sups';
var LOCAL_HOST = 'http://localhost:8080';
var PUBLIC_HOST = 'http://104.197.3.113:80';
var CANVAS_COLOR = 'wheat';
var LOCAL_INTERVAL = 10000;
var PUBLIC_INTERVAL = 180000;
var MAX_COLOR = 16777215;

var message_id = 0;
var cur_user_id = '';
var cur_user_name = '';
var cur_host = LOCAL_HOST;
var sups = [];
var cur_sup_index = 0;
var interval_id;

window.addEventListener('load', function() {

    cur_user_id = document.cookie.toString().split('=')[1];

    var add_friend_btn = document.getElementById('add_friend_btn');
    var remove_friend_btn = document.getElementById('remove_friend_btn');
    var send_sup_btn = document.getElementById('send_sup_btn');
    var remove_sup_btn = document.getElementById('remove_sup_btn');
    var prev_sup_btn = document.getElementById('prev_sup_btn');
    var next_sup_btn = document.getElementById('next_sup_btn');
    var priv_btn = document.getElementById('priv_btn');
    var pub_btn = document.getElementById('pub_btn');
    var sup_bin = document.getElementById('sup_bin');
    var clear_sup_btn = document.getElementById('clear_sup_btn');
    var refresh_btn = document.getElementById('refresh_btn');

    user_exists(cur_user_id);

    setup_canvas();
    get_friends();
    get_sups();

    interval_id = setInterval(get_sups, LOCAL_INTERVAL);

    add_friend_btn.addEventListener('click', function() {
        var friend_id = document.getElementById('friend_id').value;

        if (friend_id == cur_user_id) {
            var c = confirm('Do you really want to SUP yourself?');
            if (!c) return;
        }

        showMessage('adding friend...');
        add_friend(friend_id);

    });

    remove_friend_btn.addEventListener('click', function() {

        var friends = [];
        var friend_list = document.getElementById('friend_list');

        var confirmed = confirm("Are you sure?");

        if (confirmed) {
            for(var i=0; i<friend_list.options.length; i++) {
                if (friend_list.options[i].selected) friends.push(friend_list.options[i].value);
            }

            showMessage('removing friend...');
            remove_friend(friends);
        }
    });

    send_sup_btn.addEventListener('click', function() {
        var friends = [];
        var friend_list = document.getElementById('friend_list');

        for(var i=0; i<friend_list.options.length; i++) {
            if (friend_list.options[i].selected) friends.push(friend_list.options[i].value);
        }

        showMessage('sending sup...');
        send_sup(friends);
    });

    prev_sup_btn.addEventListener('click', function() {
        if (cur_sup_index-1 >= 0) {
            cur_sup_index -= 1;
            show_sup(cur_sup_index);
        }
    });

    next_sup_btn.addEventListener('click', function() {
        if (cur_sup_index+1 < sups.length) {
            cur_sup_index += 1;
            show_sup(cur_sup_index);
        }
    });

    prev_sup_btn.addEventListener('mouseover', function() {
        prev_sup_btn.src = 'static/prev-hover.png';
    });

    prev_sup_btn.addEventListener('mouseout', function() {
        prev_sup_btn.src = 'static/prev.png';
    });

    next_sup_btn.addEventListener('mouseover', function() {
        next_sup_btn.src = 'static/next-hover.png';
    });

    next_sup_btn.addEventListener('mouseout', function() {
        next_sup_btn.src = 'static/next.png';
    });


    sup_bin.addEventListener('click', function() {
        if (sups.length != 0) {
            showMessage('deleting a sup...');
            remove_sup(sups[cur_sup_index].sup_id);
        }
        else showMessage("You don't have any SUP to remove!");
    });

    clear_sup_btn.addEventListener('click', function() {
        showMessage('deleting all sups...');
        clear_sups();
    });

    refresh_btn.addEventListener('click', function() {
        get_sups();
    });

    priv_btn.addEventListener('click', function() {
        priv_btn.className = 'active';
        pub_btn.className = 'inactive';
        cur_host = LOCAL_HOST;
        sups = [];
        clearInterval(interval_id);
        interval_id = setInterval(get_sups, LOCAL_INTERVAL);
        showMessage('switching to private server...');
        setup_canvas();
        get_friends();
        get_sups();
    });

    pub_btn.addEventListener('click', function() {
        priv_btn.className = 'inactive';
        pub_btn.className = 'active';
        cur_host = PUBLIC_HOST;
        sups = [];
        clearInterval(interval_id);
        interval_id = setInterval(get_sups, PUBLIC_INTERVAL);
        showMessage('switching to public server...');
        setup_canvas();
        get_friends();
        get_sups();
    });
});

function logout() {
    document.logout_form.submit();
}

function setup_canvas() {
    var canvas = document.getElementById('sup_canvas');
    canvas.width = 600;
    canvas.height = 300;
    reset_canvas(canvas);
    if (sups.length == 0) show_sup(-1);
}

function createObjectToSend(protocol_version, message_id, command, command_data) {
    return {
        protocol_version: protocol_version,
        user_id: cur_user_id,
        message_id: message_id,
        command: command,
        command_data: command_data
    };
}

function create_user(user_id, full_name) {
    var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, CREATE_USER, {user_id: user_id, full_name: full_name});
    handleAjaxRequest(objectToSend);
}

function user_exists(user_id) {
    var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, USER_EXISTS, {user_id: user_id});
    handleAjaxRequest(objectToSend);
}

function get_friends() {
    var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, GET_FRIENDS, {user_id: cur_user_id});
    handleAjaxRequest(objectToSend);
}

function add_friend(friend_id) {
    var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, ADD_FRIEND, {user_id: friend_id});
    handleAjaxRequest(objectToSend);
}

function remove_friend(friends) {

    for(var i=0; i<friends.length; i++) {
        var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, REMOVE_FRIEND, {user_id: friends[i]});
        handleAjaxRequest(objectToSend);
    }
}

function send_sup(friends) {

    for(var i=0; i<friends.length; i++) {
            var cmd_data = {
                            user_id: friends[i],
                            sup_id: generateUUID(),
                            date: new Date()
                            };
            var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, SEND_SUP, cmd_data);
            handleAjaxRequest(objectToSend);
    }
}

function remove_sup(sup_id) {
    var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, REMOVE_SUP, {sup_id: sup_id});
    handleAjaxRequest(objectToSend);
}

function clear_sups() {
    var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, CLEAR_SUPS, {user_id: cur_user_id});
    handleAjaxRequest(objectToSend);
}

function get_sups() {
    var objectToSend = createObjectToSend(PROTOCOL_VERSION, message_id++, GET_SUPS, {});
    handleAjaxRequest(objectToSend);
}

function show_sup(index) {

    var canvas = document.getElementById('sup_canvas');
    var context = canvas.getContext('2d');

    reset_canvas(canvas);

    if (index < 0) {
        context.fillStyle = '#' + pad(random(0, MAX_COLOR).toString(16));
        context.fillText('NO SUP MESSAGES!', canvas.width/2-50, canvas.height/2);
        return;
    }

    context.save();
    context.beginPath();
    context.translate(canvas.width/2, canvas.height/2);
    context.rotate(random(-45, 45) * Math.PI / 180);
    context.scale(2+random(2, 6), 2+random(2, 6));
    context.fillStyle = '#' + pad(random(0, MAX_COLOR).toString(16));
    context.fillText('SUP!', 0, 0);
    context.closePath();
    context.restore();

    var cur_sup = sups[index];

    context.fillStyle = '#' + pad(random(0, MAX_COLOR).toString(16));
    context.save();
    context.beginPath();
    context.translate(canvas.width-200, canvas.height-50);
    context.scale(2, 2);
    context.fillText('FROM '+cur_sup.sender_id, 0, 0);
    context.closePath();
    context.restore();

    context.save();
    context.beginPath();
    context.translate(canvas.width-200, canvas.height-30);
    context.scale(2, 2);
    var date = new Date(cur_sup.date);
    var day = (date.getDate() < 10 ? '0' : "") + date.getDate();
    var month = (date.getMonth() < 10 ? '0' : '') + date.getMonth();
    var year = date.getFullYear();
    var hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
    var minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    context.fillText(day+'.'+month+'.'+year+' '+hour+':'+minute, 0, 0);
    context.closePath();
    context.restore();
}

// Example derived from: https://developer.mozilla.org/en-US/docs/AJAX/Getting_Started
function handleAjaxRequest(objectToSend) {

    // Create the request object
    var httpRequest = new XMLHttpRequest();

    // Set the function to call when the state changes
    httpRequest.addEventListener('readystatechange', function() {

        var progress_bar = document.getElementById('progress_bar');

        progress_bar.style.width = httpRequest.readyState * 25 + '%';

        // These readyState 4 means the call is complete, and status
        // 200 means we got an OK response from the server
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            // Parse the response text as a JSON object
            var responseObj = JSON.parse(httpRequest.responseText);
            handle_response(responseObj);
        }
    });

    // This opens a POST connection with the server at the given URL
    httpRequest.open('POST', cur_host+'/post');

    // Set the data type being sent as JSON
    httpRequest.setRequestHeader('Content-Type', 'application/json');

    // Send the JSON object, serialized as a string
    httpRequest.send(JSON.stringify(objectToSend));
}

function handle_response(responseObj) {

    var error = responseObj.error;
    var reply_data = responseObj.reply_data;
    var option;
    var action_info = document.getElementById('action_info');

    if (error != '') {
        showMessage(error);
        return;
    }

    switch (responseObj.command) {
        case CREATE_USER:
            showMessage('User created on public server!');
            break;
        case USER_EXISTS:
            var app_user_id = document.getElementById('app_user_id');
            cur_user_name = reply_data.full_name;
            app_user_id.innerText = cur_user_name;
            break;
        case ADD_FRIEND:
            document.getElementById('friend_id').value = '';
            get_friends();
            if (reply_data.exists) showMessage("You just added a new friend! Now go SUP him/her");
            else showMessage("This user doesn't exist!");
            break;
        case REMOVE_FRIEND:
            get_friends();
            showMessage("OK, you just removed your friend :( Get new friends then!");
            break;
        case GET_FRIENDS:
            var friend_list = reply_data;
            var friend_list_menu = document.getElementById('friend_list');
            friend_list_menu.innerHTML = '';
            for(var i=0; i<friend_list.length; i++) {
                var friend = friend_list[i];
                option = document.createElement('option');
                option.innerHTML = friend.user_id;
                friend_list_menu.appendChild(option);
            }

            break;
        case SEND_SUP:
            showMessage("You just SUPPED your friends!");
            break;
        case REMOVE_SUP:
            showMessage('You just removed a SUP!');
            get_sups();
            if (sups.length == 0) show_sup(-1);
            break;
        case CLEAR_SUPS:
            showMessage('cleared all sups!');
            get_sups();
            show_sup(-1);
            break;
        case GET_SUPS:
            var sup_count = document.getElementById('sup_count');
            sup_count.innerHTML = reply_data.length;

            if (sups.length != reply_data.length) {

                sups = reply_data;
                cur_sup_index = sups.length-1;
                var prev_sup_btn = document.getElementById('prev_sup_btn');
                var next_sup_btn = document.getElementById('next_sup_btn');

                show_sup(cur_sup_index);
            }

            break;

        default: break;
    }

    // clear progress bar

    setTimeout(function() {
        var progress_bar = document.getElementById('progress_bar');
        progress_bar.style.width = '0';}, 1000);
}

function reset_canvas(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CANVAS_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function random(start, end) {
    return (start + Math.floor((Math.random() * end)+1)) % end;
}

function showMessage(msg) {
    var action_info = document.getElementById('action_info');
    action_info.innerText = msg;
    action_info.style.display = 'inline';
    setTimeout(function() {action_info.style.display = 'none'}, 5000);
}

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function pad(x) {
    for(var i=0; i< 6-x.length; i++) {
        x = '0'+x;
    }
    return x;
}