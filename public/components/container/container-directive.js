const containerDirective = ($window,$rootScope,localStorageService,socketService) => {
    return {
        templateUrl: 'components/container/container.html',
        restrict: 'E',
        link: (scope) => {
            scope.askForTeam=(id)=>{
            	scope.asking=true;
            	socketService.socketEmit('askForTeam',{
            		other:{
            				id:$rootScope.account.id,
            				uname:$rootScope.account.uname
            			},
            		player:id
            	});

            }

            scope.confirmTeam=(id,uname)=>{
            	$rootScope.account.team=$rootScope.account.uname+uname;
            		socketService.socketEmit('confirmTeam',{
            			team:$rootScope.account.team,
            			player:id
            		})
            }
            socketService.socketOn('askForTeam',(from)=>{
            	if(scope.teamMode){
            		scope.handshake=from.uname;
            		
            	}else{
            		console.log("i won't receive");
            	}
            });
            socketService.socketOn('confirmTeam',(from)=>{
            	console.log(from);
            });
        }
    };
};

containerDirective.$inject = ['$window','$rootScope','localStorageService','socketService'];

angular.module('berger').directive('containerDirective', containerDirective);

