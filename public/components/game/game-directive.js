const gameDirective = ($window,$rootScope,localStorageService,socketService) => {
    return {
        templateUrl: 'components/game/game.html',
        restrict: 'E',
        link: (scope) => {
            var pane = $('#pane'),
                box = $('.box'),
                maxValue = pane.width() - box.width(),
                keysPressed = {},
                distancePerIteration = 3;
            var k=0;
            var foodCount=0;
            var boxName=document.createElement('p');
            boxName.innerText=$rootScope.account.uname;
            boxName.id='name';
            box.append(boxName);
            var collision=($div1, $div2)=>{
              
              if($div2.offset()){
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
              }else{
                return false;
              }  
            }

            var calculateNewValue=(oldValue, keyCode1, keyCode2)=>{
                var newValue = parseInt(oldValue, 10)
                               - (keysPressed[keyCode1] ? distancePerIteration : 0)
                               + (keysPressed[keyCode2] ? distancePerIteration : 0);
                return newValue < 0 ? 0 : newValue > maxValue ? maxValue : newValue;
            }

            var getRandomArbitrary=(min, max)=>{
                return Math.random() * (max - min) + min;
            }

            var spawnFood=()=>{
                var div = document.createElement('div');
                div.className+='food';
                div.id=foodCount++;
                document.getElementById('pane').appendChild(div);
                var id='#'+foodCount;
                $(id)
            }

        	socketService.socketOn('playerDisconnect',(from)=>{
        		for(var i=0;i<$rootScope.players.length;i++){
	                if($rootScope.players[i].uname==from.uname){
	                    var index=$rootScope.players.indexOf($rootScope.players[i]);
	                    if(index>-1){
	                        $rootScope.players.splice(index,1);
	                    }

                        var leftEnemy=document.getElementById(from.uname);
                        document.getElementById('pane').removeChild(leftEnemy);
	                }
	            }
	            scope.$apply();
        	});

            $rootScope.$on('createPlayers',()=>{
                for(var i=0;i<$rootScope.players.length;i++){
                    if($rootScope.players[i].uname!=$rootScope.account.uname){
                        var div = document.createElement('div');
                        div.className+='box enemy';
                        div.id=$rootScope.players[i].uname;
                        document.getElementById('pane').appendChild(div);
                        var enemyName=document.createElement('p');
                        enemyName.innerText=$rootScope.players[i].uname;
                        enemyName.id='name';
                        document.getElementById($rootScope.players[i].uname).appendChild(enemyName);
                    }
                }
            })

        	socketService.socketOn('playerJoin',(from)=>{
                $rootScope.players.push(from);
                scope.$apply();
                var div = document.createElement('div');
                div.className+='box enemy';
                div.id=from.uname;
                document.getElementById('pane').appendChild(div);
                var enemyName=document.createElement('p');
                enemyName.innerText=from.uname;
                enemyName.id='name';
                document.getElementById(from.uname).appendChild(enemyName);

            });



            

            $(window).keydown((event)=>{ keysPressed[event.which] = true; });
            $(window).keyup((event)=>{ keysPressed[event.which] = false; });

            setInterval(()=>{
                if(k<200){
                    k++
                }else{
                    for(i=0;i<$rootScope.players.length;i++){

                    if($rootScope.players[i].uname!=$rootScope.account.uname){
                        var id='#'+$rootScope.players[i].uname;
                        var enemy=$(id);
                        var food=$('.food');
                        if(enemy){

                            if(collision(box,enemy)){
                                    if(box.outerWidth(true)>enemy.outerWidth(true)){
                                        console.log("i've won")

                                    }else if(box.outerWidth(true)<enemy.outerWidth(true)){
                                        console.log("i've lost")
                                    }else if(box.outerWidth(true)==enemy.outerWidth(true)){
                                        console.log('same dudes');
                                    }
                                }else if(collision(box,food)){
                                    console.log('neamyy');
                                    console.log(food);
                                }
                        
                            }
                        }
                    }
                }

                
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
                    uname:$rootScope.account.uname
                });
                
            }, 20);

            socketService.socketOn('moving',(from)=>{
                    var id='#'+from.uname;
                    var enemy=$(id);
                    
                    enemy.css({
                        left: (index ,oldValue)=>{
                            return from.coords.left;
                        },
                        top: (index, oldValue)=>{
                            return from.coords.top;
                        }
                    });
                });
        }
    };
};

gameDirective.$inject = ['$window','$rootScope','localStorageService','socketService'];

angular.module('berger').directive('gameDirective', gameDirective);

