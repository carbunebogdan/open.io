const gameDirective = ($window, $rootScope, localStorageService, socketService,$timeout) => {
    return {
        templateUrl: 'components/game/game.html',
        restrict: 'E',
        link: (scope) => {
            var pane = $('#pane'),
                box = $('.box'),
                keysPressed = {},
                distancePerIteration = 3;


            box.width(40);
            box.height(40);

            box.css({
                backgroundColor:$rootScope.account.color
            })
            
            $rootScope.account.size=box.width();

            maxValue = pane.width() - box.width();


            var k = 0;
            var boxName = document.createElement('p');
            boxName.innerText = $rootScope.account.uname;
            boxName.id = 'name';
            box.append(boxName);
            scope.showLose = function(ev) {
                console.log("i've lost :(");
            };

            scope.status='Invincible for 3 seconds!';

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
            }

            var sortByScore=()=>{
                var aux=null;
                for(i=0;i<$rootScope.players.length-1;i++)
                    for(j=i;j<$rootScope.players.length;j++){
                    if($rootScope.players[i].size<$rootScope.players[j].size){
                        aux=scope.players[i];
                        $rootScope.players[i]=$rootScope.players[j];
                        $rootScope.players[j]=aux;
                    }
                }
                if (!scope.$$phase)
                    scope.$apply();
            }

            var calculateNewValue = (oldValue, keyCode1, keyCode2) => {
                var newValue = parseInt(oldValue, 10) -
                    (keysPressed[keyCode1] ? distancePerIteration : 0) +
                    (keysPressed[keyCode2] ? distancePerIteration : 0);
                return newValue < 0 ? 0 : newValue > maxValue ? maxValue : newValue;
            }

            var getRandomPos = (min, max) => {
                return Math.random() * (max - min) + min;
            }

            var spawnFood = (food) => {
                var div = document.createElement('div');
                div.className += 'food';
                div.id = food.id;
                document.getElementById('pane').appendChild(div);
                var id = '#' + food.id;
                $(id).css({
                    left: food.left,
                    top: food.top,
                    backgroundColor: food.color
                });
            }

            var changeFoodPos = ($food, coords = null, id = null) => {
                if (!coords) {
                    var coords = {
                        left: getRandomPos(0, maxValue),
                        top: getRandomPos(0, maxValue)
                    }

                    socketService.socketEmit('changeFoodPos', {
                        id: $food.attr('id'),
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

            var increaseSize = (size, target = null, initMode = false) => {
                
                if (!initMode) {
                    var calcSize=size/12;
                    if (target) {
                        var id = "#" + target;
                        var targetEl = $(id);
                        targetEl.width(targetEl.width() + calcSize);
                        targetEl.height(targetEl.height() + calcSize);
                    } else {
                        box.width(box.width() + calcSize);
                        box.height(box.height() + calcSize);
                        maxValue = pane.width() - box.width();
                        $rootScope.account.size+=calcSize;
                        socketService.socketEmit('updateSize',{
                            uname:$rootScope.account.uname,
                            size:$rootScope.account.size
                        })
                        for(i=0;i<$rootScope.players.length;i++){
                            if($rootScope.account.uname==$rootScope.players[i].uname){
                                $rootScope.players[i].size+=calcSize;
                            }
                        }
                        if (!scope.$$phase)
                            scope.$apply();
                        sortByScore();

                    }
                } else {
                    var id = "#" + target;
                    var targetEl = $(id);
                    targetEl.css('width', size);
                    targetEl.css('height', size);
                }


            }

            $timeout(() => {
                scope.status='The game is on!';
                socketService.socketEmit('notInvincible', $rootScope.account.uname);
                $timeout(() => {
                    scope.status='';
                }, 3000);
            }, 3000);

            box.css({
                        left: getRandomPos(0, maxValue),
                        top: getRandomPos(0, maxValue),
                    });

            socketService.socketOn('notInvincible', (from) => {
                for (var i = 0; i < $rootScope.players.length; i++) {
                    if ($rootScope.players[i].uname == from) {
                        $rootScope.players[i].invincible = false;
                        break;
                    }
                }
            })

            socketService.socketOn('increaseEnemy', (from) => {
                increaseSize(from.size, from.target);
                for(i=0;i<$rootScope.players.length;i++){
                    if($rootScope.players[i].uname==from.target){
                        $rootScope.players[i].size+=from.size/12;

                        if (!scope.$$phase)
                            scope.$apply();
                    }
                }
                sortByScore();
            })


            socketService.socketOn('playerDisconnect', (from) => {
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
                        console.log($rootScope.players[i].color);
                        document.getElementById($rootScope.players[i].uname).style.backgroundColor=$rootScope.players[i].color;
                        increaseSize($rootScope.players[i].size, $rootScope.players[i].uname, true);
                    }
                }
                for (var i = 0; i < $rootScope.food.length; i++) {
                    spawnFood($rootScope.food[i]);
                }
                sortByScore();
            })

            socketService.socketOn('playerJoin', (from) => {
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
                document.getElementById(from.uname).style.backgroundColor=from.color;
                increaseSize(from.size, from.uname, true);
                sortByScore();
            });

            socketService.socketOn('changeFoodPos', (from) => {
                changeFoodPos(null, from.coords, "#" + from.id);
            });







            $(window).keydown((event) => { keysPressed[event.which] = true; });
            $(window).keyup((event) => { keysPressed[event.which] = false; });

            // stop key scroll
            $window.addEventListener("keydown", (e)=>{
                if([37,38,39,40].indexOf(e.keyCode) > -1){
                    e.preventDefault();
                }else{
                    $rootScope.$broadcast('focusMessage');
                }

            }, false)

            setInterval(() => {
                    if (k < 50) {
                        k++;
                    } else {

                        for (i = 0; i < $rootScope.players.length; i++) {

                            if (($rootScope.players[i].uname != $rootScope.account.uname) && ($rootScope.players[i].invincible == false)) {

                                var id = '#' + $rootScope.players[i].uname;
                                var enemy = $(id);
                                if (enemy) {
                                    if (collision(box, enemy)) {
                                        if (box.outerWidth(true) > enemy.outerWidth(true)) {
                                            increaseSize(enemy.width());
                                            socketService.socketEmit('increaseEnemy', {
                                                size: enemy.width(),
                                                target: $rootScope.account.uname
                                            })

                                        } else if (box.outerWidth(true) < enemy.outerWidth(true)) {
                                            $window.location.reload(false);
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
                                socketService.socketEmit('increaseEnemy', {
                                    size: food.width(),
                                    target: $rootScope.account.uname
                                })
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

                },
                20);
            
            setInterval(()=>{
                    if($('#me').offset().top>$('#gameWrapper').height()/2){
                        document.getElementById('gameWrapper').scrollTop += 3;
                    }
                    if($('#me').offset().left>$('#gameWrapper').width()/2){
                        document.getElementById('gameWrapper').scrollLeft+=3;
                    }
                    if($('#me').offset().top<$('#gameWrapper').height()/2){
                        document.getElementById('gameWrapper').scrollTop -= 3;
                    }
                    if($('#me').offset().left<$('#gameWrapper').width()/2){
                        document.getElementById('gameWrapper').scrollLeft-=3;
                    }
                                        
                        },20)

            socketService.socketOn('moving', (from) => {
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

gameDirective.$inject = ['$window', '$rootScope', 'localStorageService', 'socketService','$timeout'];

angular.module('berger').directive('gameDirective', gameDirective);