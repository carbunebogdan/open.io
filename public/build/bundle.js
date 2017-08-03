(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const chatDirective = ($rootScope, socketService, $window, localStorageService) => {
    return {
        templateUrl: 'components/chat/chat.html',
        restrict: 'E',
        link: scope => {
            scope.messages = [{
                sender: 'open.io',
                message: 'welcome'
            }];
            scope.message = {
                sender: $rootScope.account.uname,
                message: ''
            };
            var scrollChat = () => {
                var chat = document.getElementById('chat');
                $('#chat').animate({
                    scrollTop: chat.scrollHeight
                }, 300);
            };
            socketService.socketOn('playerJoin', from => {
                if (from.uname != $rootScope.account.uname) {
                    scope.messages.push({
                        sender: 'open.io',
                        message: from.uname + ' joined!'
                    });
                    scope.$apply();
                    scrollChat();
                }
            });

            socketService.socketOn('playerDisconnect', from => {
                if (from.uname != $rootScope.account.uname) {
                    scope.messages.push({
                        sender: 'open.io',
                        message: from.uname + ' left..'
                    });
                    scope.$apply();
                    scrollChat();
                }
            });

            scope.send = () => {
                if (scope.message.message != '') {
                    scope.messages.push(scope.message);
                    scrollChat();
                    socketService.socketEmit('newMessage', scope.message);

                    scope.message = {
                        sender: $rootScope.account.uname,
                        message: ''
                    };
                }
            };

            // Watch for socket incoming data
            socketService.socketOn('newMessage', rsp => {
                if (rsp.source.sender != $rootScope.account.uname) {
                    scope.messages.push(rsp.source);
                    scope.$apply();
                    scrollChat();
                }
            });
        }
    };
};

chatDirective.$inject = ['$rootScope', 'socketService', '$window', 'localStorageService'];

angular.module('berger').directive('chatDirective', chatDirective);

},{}],2:[function(require,module,exports){
class containerController {
    constructor($state, socketService, $location, localStorageService, $rootScope, $timeout) {
        $rootScope.players = [];
        if (!$rootScope.account) {
            $location.path('/login');
        }

        // Register socket
        socketService.registerSocket();

        socketService.socketOn('game', from => {
            $rootScope.players = from.players;
            $rootScope.food = from.food;
            $timeout(() => {
                $rootScope.$broadcast('createGame');
            }, 500);
        });
    }

}

containerController.$inject = ['$state', 'socketService', '$location', 'localStorageService', '$rootScope', '$timeout'];

angular.module('berger').controller('containerController', containerController);

},{}],3:[function(require,module,exports){
const containerDirective = ($window, $rootScope, localStorageService, socketService) => {
    return {
        templateUrl: 'components/container/container.html',
        restrict: 'E',
        link: scope => {}
    };
};

containerDirective.$inject = ['$window', '$rootScope', 'localStorageService', 'socketService'];

angular.module('berger').directive('containerDirective', containerDirective);

},{}],4:[function(require,module,exports){
const gameDirective = ($window, $rootScope, localStorageService, socketService) => {
    return {
        templateUrl: 'components/game/game.html',
        restrict: 'E',
        link: scope => {
            var pane = $('#pane'),
                box = $('.box'),
                maxValue = pane.width() - box.width(),
                keysPressed = {},
                distancePerIteration = 3;
            var k = 0;
            var boxName = document.createElement('p');
            boxName.innerText = $rootScope.account.uname;
            boxName.id = 'name';
            box.append(boxName);
            scope.showLose = function (ev) {
                console.log("i've lost :(");
            };

            var collision = ($div1, $div2) => {
                if ($div2.offset()) {
                    var x1 = $div1.offset().left;
                    var y1 = $div1.offset().top;
                    var h1 = $div1.outerHeight(true);
                    var w1 = $div1.outerWidth(true);
                    var b1 = y1 + h1;
                    var r1 = x1 + w1;
                    var x2 = $div2.offset().left;
                    var y2 = $div2.offset().top;
                    var h2 = $div2.outerHeight(true);
                    var w2 = $div2.outerWidth(true);
                    var b2 = y2 + h2;
                    var r2 = x2 + w2;
                    if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
                    return true;
                } else {
                    return false;
                }
            };

            var calculateNewValue = (oldValue, keyCode1, keyCode2) => {
                var newValue = parseInt(oldValue, 10) - (keysPressed[keyCode1] ? distancePerIteration : 0) + (keysPressed[keyCode2] ? distancePerIteration : 0);
                return newValue < 0 ? 0 : newValue > maxValue ? maxValue : newValue;
            };

            var getRandomPos = (min, max) => {
                return Math.random() * (max - min) + min;
            };

            var spawnFood = food => {
                var div = document.createElement('div');
                div.className += 'food';
                div.id = food.id;
                document.getElementById('pane').appendChild(div);
                var id = '#' + food.id;
                $(id).css({
                    left: food.left,
                    top: food.top
                });
            };

            var changeFoodPos = ($food, coords = null, id = null) => {
                if (!coords) {
                    var coords = {
                        left: getRandomPos(0, maxValue),
                        top: getRandomPos(0, maxValue)
                    };

                    socketService.socketEmit('changeFoodPos', {
                        id: "#" + $food.attr('id'),
                        coords: coords
                    });
                }
                if (!$food) {
                    $food = $(id);
                }

                $food.css({
                    left: coords.left,
                    top: coords.top
                });
            };

            var increaseSize = (size, target = null) => {
                if (target) {
                    var id = "#" + target;
                    var targetEl = $(id);
                    targetEl.width(targetEl.width() + size / 2);
                    targetEl.height(targetEl.height() + size / 2);
                } else {
                    box.width(box.width() + size / 2);
                    box.height(box.height() + size / 2);
                }
            };

            socketService.socketOn('increaseEnemy', from => {
                increaseSize(from.size, from.target);
            });

            socketService.socketOn('playerDisconnect', from => {
                for (var i = 0; i < $rootScope.players.length; i++) {
                    if ($rootScope.players[i].uname == from.uname) {
                        var index = $rootScope.players.indexOf($rootScope.players[i]);
                        if (index > -1) {
                            $rootScope.players.splice(index, 1);
                        }

                        var leftEnemy = document.getElementById(from.uname);
                        document.getElementById('pane').removeChild(leftEnemy);
                    }
                }
                scope.$apply();
            });

            $rootScope.$on('createGame', () => {
                for (var i = 0; i < $rootScope.players.length; i++) {
                    if ($rootScope.players[i].uname != $rootScope.account.uname) {
                        var div = document.createElement('div');
                        div.className += 'box enemy';
                        div.id = $rootScope.players[i].uname;
                        document.getElementById('pane').appendChild(div);
                        var enemyName = document.createElement('p');
                        enemyName.innerText = $rootScope.players[i].uname;
                        enemyName.id = 'name';
                        document.getElementById($rootScope.players[i].uname).appendChild(enemyName);
                    }
                }
                for (var i = 0; i < $rootScope.food.length; i++) {
                    spawnFood($rootScope.food[i]);
                }
            });

            socketService.socketOn('playerJoin', from => {
                $rootScope.players.push(from);
                scope.$apply();
                var div = document.createElement('div');
                div.className += 'box enemy';
                div.id = from.uname;
                document.getElementById('pane').appendChild(div);
                var enemyName = document.createElement('p');
                enemyName.innerText = from.uname;
                enemyName.id = 'name';
                document.getElementById(from.uname).appendChild(enemyName);
            });

            socketService.socketOn('changeFoodPos', from => {
                changeFoodPos(null, from.coords, from.id);
            });

            $(window).keydown(event => {
                keysPressed[event.which] = true;
            });
            $(window).keyup(event => {
                keysPressed[event.which] = false;
            });

            setInterval(() => {
                if (k < 200) {
                    k++;
                } else {
                    for (i = 0; i < $rootScope.players.length; i++) {

                        if ($rootScope.players[i].uname != $rootScope.account.uname) {
                            var id = '#' + $rootScope.players[i].uname;
                            var enemy = $(id);
                            if (enemy) {
                                if (collision(box, enemy)) {
                                    if (box.outerWidth(true) > enemy.outerWidth(true)) {
                                        increaseSize(food.width());
                                        socketService.socketEmit('increaseEnemy', {
                                            size: food.width(),
                                            target: $rootScope.account.uname
                                        });
                                    } else if (box.outerWidth(true) < enemy.outerWidth(true)) {
                                        scope.showLose();
                                    } else if (box.outerWidth(true) == enemy.outerWidth(true)) {
                                        console.log('same dudes');
                                    }
                                }
                            }
                        }
                    }
                    for (i = 0; i < $rootScope.food.length; i++) {
                        var foodId = '#' + $rootScope.food[i].id;
                        var food = $(foodId);
                        if (collision(box, food)) {
                            changeFoodPos(food);
                            increaseSize(food.width());
                            console.log(box.attr('id'));
                            socketService.socketEmit('increaseEnemy', {
                                size: food.width(),
                                target: $rootScope.account.uname
                            });
                        }
                    }
                }

                var coords = {
                    left: null,
                    top: null
                },
                    oldValue;
                box.css({
                    left: (index, oldValue) => {
                        coords.left = calculateNewValue(oldValue, 37, 39);
                        return coords.left;
                    },
                    top: (index, oldValue) => {
                        coords.top = calculateNewValue(oldValue, 38, 40);
                        return coords.top;
                    }
                });

                socketService.socketEmit('moving', {
                    coords: coords,
                    uname: $rootScope.account.uname
                });
            }, 20);

            socketService.socketOn('moving', from => {
                var id = '#' + from.uname;
                var enemy = $(id);

                enemy.css({
                    left: (index, oldValue) => {
                        return from.coords.left;
                    },
                    top: (index, oldValue) => {
                        return from.coords.top;
                    }
                });
            });
        }
    };
};

gameDirective.$inject = ['$window', '$rootScope', 'localStorageService', 'socketService'];

angular.module('berger').directive('gameDirective', gameDirective);

},{}],5:[function(require,module,exports){
const loginDirective = ($rootScope, $location, localStorageService, $mdDialog, socketService, $window) => {
    return {
        templateUrl: 'components/login/login.html',
        restrict: 'E',
        link: scope => {

            scope.proceed = username => {
                socketService.socketEmit('tryConnect', username);
                scope.username = username;
            };

            socketService.socketOn('confirmMessage', from => {
                if (from == 1) {
                    $rootScope.account = {
                        uname: scope.username
                    };
                    $window.location.href = '/#!/room';
                } else {
                    scope.showWarn();
                }
            });

            scope.showWarn = function (ev) {
                $mdDialog.show($mdDialog.alert().clickOutsideToClose(true).title('Username already exists!').textContent('Please choose another one.').ok('ok').targetEvent(ev));
            };
        }
    };
};

loginDirective.$inject = ['$rootScope', '$location', 'localStorageService', '$mdDialog', 'socketService', '$window'];

angular.module('berger').directive('loginDirective', loginDirective);

},{}],6:[function(require,module,exports){
const messageBox = () => {
	return {
		restrict: 'A',
		templateUrl: 'components/message_box/message-box.html',
		scope: true,
		link: scope => {

			// Initialize the default properties
			scope.messages = [];
			scope.text = 'init value';
			scope.type = 'danger';

			// Populates the message list
			scope.addMessage = () => {
				if (scope.text && scope.type) {
					const msg = {
						text: scope.text,
						type: scope.type
					};
					scope.messages.push(msg);
					scope.text = '';
					scope.type = '';
				}
			};

			// Removes a message by index
			scope.removeMessage = index => {
				scope.messages.splice(index, 1);
			};
		}
	};
};

angular.module('berger').directive('messageBox', messageBox);

},{}],7:[function(require,module,exports){
const tableComponent = () => {
    return {
        templateUrl: 'components/table/table-component.html',
        restrict: 'E',
        scope: {
            tableTitle: '@',
            tableHeaders: '=',
            tableKeys: '=',
            tableBody: '='
        },
        link: scope => {}
    };
};

tableComponent.$inject = [];

angular.module('berger').directive('tableComponent', tableComponent);

},{}],8:[function(require,module,exports){
angular.module('berger').service('socketService', function () {

	this._socket = null;
	var obj = {
		registerSocket() {
			// this._socket = io('http://localhost:3000');
			this._socket = io.connect();
		},

		unregisterSocket() {
			if (this._socket) {
				this._socket.disconnect();
				this._socket = null;
			}
		},

		socketOn(eventName, cb) {
			if (!eventName) {
				throw new Error('Must provide an event to emit for');
			}

			if (!cb || typeof cb !== 'function') {
				throw new Error('Must provide a callback for the socket event listener');
			}
			this._socket.on(eventName, cb);
		},

		socketEmit(eventName, data) {
			if (!eventName) {
				throw new Error('Must provide an event to emit for');
			}
			this._socket.emit(eventName, data);
		}
	};
	return obj;
});

},{}]},{},[1,2,3,4,5,6,7,8]);
