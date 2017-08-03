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

        	socketService.socketOn('playerJoin',(from)=>{
                $rootScope.players.push(from);
                scope.$apply();
            });

            
        }
    };
};

gameDirective.$inject = ['$window','$rootScope','localStorageService','socketService'];

angular.module('berger').directive('gameDirective', gameDirective);

