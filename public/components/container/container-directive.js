const containerDirective = ($window,$rootScope,localStorageService,socketService) => {
    return {
        templateUrl: 'components/container/container.html',
        restrict: 'E',
        link: (scope) => {
            scope.askForTeam=(id)=>{
            	
            	socketService.socketEmit('askForTeam',{
            		other:$rootScope.account.id,
            		player:id
            	})
            }
        }
    };
};

containerDirective.$inject = ['$window','$rootScope','localStorageService','socketService'];

angular.module('berger').directive('containerDirective', containerDirective);

