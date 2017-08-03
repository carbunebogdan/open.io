const gameDirective = ($window,$rootScope,localStorageService,socketService) => {
    return {
        templateUrl: 'components/game/game.html',
        restrict: 'E',
        link: (scope) => {

        	socketService.socketOn('playerDisconnect',(from)=>{
        		for(var i=0;i<$rootScope.players.length;i++){
	                if($rootScope.players[i].uname==from.uname){
	                    var index=$rootScope.players.indexOf($rootScope.players[i]);
	                    if(index>-1){
	                        $rootScope.players.splice(index,1);
	                    }
	                }
	            }
	            scope.$apply();
        	});

            $rootScope.$on('createPlayers',()=>{
                for(var i=0;i<$rootScope.players.length;i++){
                    if($rootScope.players[i].uname!=$rootScope.account.uname){
                        console.log('one box created');
                        var div = document.createElement('div');
                        div.className+='box enemy';
                        div.
                        document.getElementById('pane').appendChild(div);
                    }
                }
            })

        	socketService.socketOn('playerJoin',(from)=>{
                $rootScope.players.push(from);
                scope.$apply();
                var div = document.createElement('div');
                div.className+='box enemy';
                document.getElementById('pane').appendChild(div);

            });

            var pane = $('#pane'),
                box = $('.box'),
                maxValue = pane.width() - box.width(),
                keysPressed = {},
                distancePerIteration = 3;

            var calculateNewValue=(oldValue, keyCode1, keyCode2)=>{
                var newValue = parseInt(oldValue, 10)
                               - (keysPressed[keyCode1] ? distancePerIteration : 0)
                               + (keysPressed[keyCode2] ? distancePerIteration : 0);
                return newValue < 0 ? 0 : newValue > maxValue ? maxValue : newValue;
            }

            $(window).keydown((event)=>{ keysPressed[event.which] = true; });
            $(window).keyup((event)=>{ keysPressed[event.which] = false; });

            setInterval(()=>{
                var coords={
                    left:null,
                    top:null
                },oldValue;
                box.css({
                    left: (index ,oldValue)=>{
                        coords.left=calculateNewValue(oldValue, 37, 39);
                        return coords.left;
                    },
                    top: (index, oldValue)=>{
                        coords.top=calculateNewValue(oldValue, 38, 40);
                        return coords.top;
                    }
                });
                
                socketService.socketEmit('moving',{
                    coords:coords,
                    uname:$rootScope.uname
                });
                
            }, 20);

            socketService.socketOn('moving',(from)=>{
                    var enemy=$('#'+from.uname);
                    enemy.css({
                        left: (index ,oldValue)=>{
                            return calculateNewValue(from.oldValue, 37, 39);
                        },
                        top: (index, oldValue)=>{
                            return calculateNewValue(from.oldValue, 38, 40);
                        }
                    });
                });
        }
    };
};

gameDirective.$inject = ['$window','$rootScope','localStorageService','socketService'];

angular.module('berger').directive('gameDirective', gameDirective);

