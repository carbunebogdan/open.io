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
    constructor($state, socketService, $location, localStorageService, $rootScope) {
        $rootScope.players = [];
        if (!$rootScope.account) {
            $location.path('/login');
        }

        // Register socket
        socketService.registerSocket();

        socketService.socketOn('players', from => {
            $rootScope.players = from;
            $rootScope.$broadcast('createPlayers');
        });
    }

}

containerController.$inject = ['$state', 'socketService', '$location', 'localStorageService', '$rootScope'];

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

            socketService.socketOn('playerDisconnect', from => {
                for (var i = 0; i < $rootScope.players.length; i++) {
                    if ($rootScope.players[i].uname == from.uname) {
                        var index = $rootScope.players.indexOf($rootScope.players[i]);
                        if (index > -1) {
                            $rootScope.players.splice(index, 1);
                        }
                    }
                }
                scope.$apply();
            });

            $rootScope.$on('createPlayers', () => {
                for (var i = 0; i < $rootScope.players.length; i++) {
                    if ($rootScope.players[i].uname != $rootScope.account.uname) {
                        console.log('one box created');
                        var div = document.createElement('div');
                        div.className += 'box enemy';
                        div.document.getElementById('pane').appendChild(div);
                    }
                }
            });

            socketService.socketOn('playerJoin', from => {
                $rootScope.players.push(from);
                scope.$apply();
                var div = document.createElement('div');
                div.className += 'box enemy';
                document.getElementById('pane').appendChild(div);
            });

            var pane = $('#pane'),
                box = $('.box'),
                maxValue = pane.width() - box.width(),
                keysPressed = {},
                distancePerIteration = 3;

            var calculateNewValue = (oldValue, keyCode1, keyCode2) => {
                var newValue = parseInt(oldValue, 10) - (keysPressed[keyCode1] ? distancePerIteration : 0) + (keysPressed[keyCode2] ? distancePerIteration : 0);
                return newValue < 0 ? 0 : newValue > maxValue ? maxValue : newValue;
            };

            $(window).keydown(event => {
                keysPressed[event.which] = true;
            });
            $(window).keyup(event => {
                keysPressed[event.which] = false;
            });

            setInterval(() => {
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
                    uname: $rootScope.uname
                });
            }, 20);

            socketService.socketOn('moving', from => {
                var enemy = $('#' + from.uname);
                enemy.css({
                    left: (index, oldValue) => {
                        return calculateNewValue(from.oldValue, 37, 39);
                    },
                    top: (index, oldValue) => {
                        return calculateNewValue(from.oldValue, 38, 40);
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
