class containerController {
    constructor($state, socketService, $location, localStorageService, $rootScope) {
        $rootScope.players=[];
        if(!$rootScope.account){
            $location.path('/login');
        }
        

        // Register socket
        socketService.registerSocket();


        socketService.socketOn('players',(from)=>{
                $rootScope.players=from;
                $rootScope.$broadcast('createPlayers');
            });


    }



}

containerController.$inject = ['$state', 'socketService', '$location', 'localStorageService', '$rootScope'];

angular.module('berger').controller('containerController', containerController);