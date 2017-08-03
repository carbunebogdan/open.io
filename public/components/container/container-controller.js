class containerController {
    constructor($state, socketService, $location, localStorageService, $rootScope, $timeout) {
        $rootScope.players=[];
        if(!$rootScope.account){
            $location.path('/login');
        }
        

        // Register socket
        socketService.registerSocket();


        socketService.socketOn('game',(from)=>{
                $rootScope.players=from.players;
                $rootScope.food=from.food;
                $timeout(() => { $rootScope.$broadcast('createGame'); }, 500);
            });


    }



}

containerController.$inject = ['$state', 'socketService', '$location', 'localStorageService', '$rootScope','$timeout'];

angular.module('berger').controller('containerController', containerController);