$(function() {

    FastClick.attach(document.body);


    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize varibles
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();


    var msg = $('#msg')[0];

    var socket = io();

    function addParticipantsMessage(data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "只有 1 个小伙伴";
        } else {
            message += "目前有 " + data.numUsers + " 个小伙伴了";
        }
        log(message);
    }

    // Sets the client's username
    function setUsername() {
        username = cleanInput($usernameInput.val().trim());

        // If the username is valid
        if (username) {
            setTimeout(function () {
                $alert.removeClass('hide');
                setTimeout(function () {
                    $alert.removeClass('slideInDown').addClass('slideOutUp');
                    setTimeout(function () {
                        $alert.removeClass('slideOutUp').addClass('slideInDown hide');
                    }, 1000)
                }, 8000)
            }, 1000);
            //admin
            if (/^admin/.test(username)) {
                $('#admin').removeClass('hide');
            }
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');

            //组织自动获得焦点
            $currentInput = $inputMessage.focus();

            // Tell the server your username
            socket.emit('add user', username);
        } else {
            alert('请输入昵称！')
        }
    }


    // Sends a chat message
    function sendMessage() {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val('');
            addChatMessage({
                username: username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', {type: 'text', msg: message});
        }
    }

    // Log a message
    function log(message, options) {
        var $logCon = $('<span class="logCon">').text(message);
        var $el = $('<li>').addClass('log').append($logCon);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage(data, options) {

        data.message = data.message.replace('admin: ', '');

        function replace_em(str){
            /*str = str.replace(/\</g,'&lt;');
            str = str.replace(/\>/g,'&gt;');*/
            str = str.replace(/\n/g,'<br/>');
            str = str.replace(/\[em_([0-9]*)\]/g,'<img src="arclist/$1.gif" border="0" />');
            return str;
        }

        data.message = replace_em(data.message);

        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span class="username"/>')
            //.text(data.username)
            .css('background-color', getUsernameColor(data.username));

        var $messageCon,
            $img;

        if (data.type == 'image') {
            $img = $('<img class="chat-img" />').attr('src', data.message);
            if (data.username == username) {
                $messageCon = $('<span class="messageCon bg-green">').append($img);
            } else {
                $messageCon = $('<span class="messageCon bg-white">').append($img);
                if (data.typing != true) {
                    msg.play();
                }
            }

        } else if (data.type == 'alert') {
            $alertCon.html(data.message);
            $alert.removeClass('hide');

            return;
        } else {
            if (data.username == username) {
                $messageCon = $('<span class="messageCon bg-green">').html(data.message);
            } else {
                $messageCon = $('<span class="messageCon bg-white">').html(data.message);
                if (data.typing != true) {
                    msg.play();
                }
            }
        }



        var $messageBodyDiv = $('<span class="messageBody">');
        $messageBodyDiv.append($messageCon);



        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping(data) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function() {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement(el, options) {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;


        $('.chat-img').on('click', function () {
            $showImgBox.removeClass('hide');
            var src = $(this).attr('src');
            $showImg.attr('src', src);
            setTimeout(function () {
                chatShow.refresh();
            }, 100)
        })
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }

    // Updates the typing event
    function updateTyping() {
        if (connected) {
            if (!typing) {
                typing = true;

                //socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function() {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {

                    //socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages(data) {
        return $('.typing.message').filter(function(i) {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    function getUsernameColor(username) {
        var nowname = '';

        if (username == undefined || !username || username == 'undefined') {
            username = 'Fucker';
        }
        var len;
        /*try {
            len = username.length;
        } catch (e) {
            console.log(e);
            len = 10;
        }*/
        nowname = username + (+new Date);
        len = nowname.length;
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < len; i++) {
            hash = nowname.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Keyboard events

    $window.keydown(function(event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username) {
                sendMessage();
                //socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
        }
    });



    $('#sendMessage').on('click', function(e) {
        e.stopPropagation();

        //$inputMessage.focus();

        if (username) {
            sendMessage();
            //socket.emit('stop typing');
            typing = false;
        } else {
            setUsername();
        }
    });
    $('#start').on('click', function(e) {
        e.stopPropagation();
        setUsername();
    });

    $inputMessage.on('input', function() {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on login page
    $loginPage.on('click', function() {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.on('click', function() {
        $inputMessage.focus();
    });

    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function(data) {
        connected = true;
        // Display the welcome message
        var message = "欢迎您的光临";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function(data) {
        addChatMessage(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function(data) {
        msg.play();
        log(data.username + ' 加入进来');
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function(data) {
        log(data.username + ' 无情的走开了...');
        addParticipantsMessage(data);
        removeChatTyping(data);
    });

    // Whenever the server emits 'typing', show the typing message
    /*socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });*/


    var doc = document,
        $imgUpload = $('#imgUpload'),
        $upImg = $('#upImg'),
        $showImg = $('#showImg'),
        $showImgBox = $('#showImgBox'),
        $getMoney = $('.get-money'),
        $alert = $('#alert'),
        $gGao = $('#gGao'),
        $alertCon = $('#alertCon'),
        $inputCtrBox = $('#inputCtrBox'),
        $moreBtn = $('#moreBtn'),
        $emoej = $('#emoej'),
        $moreCtr = $('#moreCtr'),
        $wrapFace = $('#wrapFace');

    var prevShow = new iScroll('preShow');
    var chatShow = new iScroll('chatShow');


    $imgUpload[0].addEventListener('touchmove', function (e) {
        e.preventDefault();
    });

    $moreBtn.on('click', function(e) {
        e.stopPropagation();
        $moreCtr.removeClass('hide');
        $wrapFace.addClass('hide');
        $inputCtrBox.animate({
            bottom: 0
        }, 200)
    });

    $wrapFace.on('click', function (e) {
        e.stopPropagation();
    });

    $emoej.on('click', function(e) {
        $wrapFace.removeClass('hide');
        $moreCtr.addClass('hide');
        e.stopPropagation();
        $inputCtrBox.animate({
            bottom: 0
        }, 200)
    });

    $(doc).on('click', function(e) {
        e.stopPropagation();
        $inputCtrBox.animate({
            bottom: '-200px'
        }, 200)
    });




    $('.send-cancel').on('click', function () {
        $imgUpload.addClass('hide');
    });
    $showImgBox.on('click', function () {
        $showImgBox.addClass('hide');
    });
    $('.close').on('click', function () {
        $showImgBox.addClass('hide');
    });
    $getMoney.on('click', function () {
        $(this).addClass('hide');
    });
    $('#pay').on('click', function () {
        $getMoney.removeClass('hide');
    });

    $alert.on('click', function () {
        $(this).removeClass('slideInDown').addClass('slideOutUp');
        setTimeout(function () {
            $alert.removeClass('slideOutUp').addClass('slideInDown hide');
        }, 1000)
    });
    $gGao.on('click', function () {
        $inputMessage.focus().val('admin: ');
    });

    var imgUp = doc.querySelector('#chooseImg'),
        Base64 = '';

    imgUp.addEventListener('change', function (e) {
        var files = e.target.files;

        if (files && files.length > 0) {
            var file = files[0];
            if (!/image\/\w+/.test(file.type)) {
                alert('Please choose image!');
                return
            }

            lrz(file, {width: 320}, function (data) {
                Base64 = data.base64;
                $imgUpload.removeClass('hide');
                $upImg.attr('src', Base64);

                setTimeout(function () {
                    prevShow.refresh();
                }, 100)
            });
        } else {
            alert('No image file choosed!')
        }
    });

    $('#sendUpImg').on('click', function () {
        $imgUpload.addClass('hide');

        addChatMessage({
            username: username,
            message: Base64,
            type: 'image'
        });
        // tell server to execute 'new message' and send along one parameter
        socket.emit('new message', {type: 'image', msg: Base64});
    });


    //删除表情符号
    $('#delMsg').on('click', function () {
        var $sayText = $('#saytext'),
            str = $sayText.val();

        $sayText.val(str.replace(/\[em_([0-9]*)\]$/g, ''))
    })



















});