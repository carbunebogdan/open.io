class containerController {
    constructor($state, socketService, $location, localStorageService, $rootScope, $timeout) {
        $rootScope.players=[];
        if(!$rootScope.account){
            $location.path('/login');
        }
        

        // Register socket
        socketService.registerSocket();


        socketService.socketOn('players',(from)=>{
                $rootScope.players=from;
                console.log(from);
                
                $timeout(() => { $rootScope.$broadcast('createPlayers'); }, 500);
            });


    }



}

containerController.$inject = ['$state', 'socketService', '$location', 'localStorageService', '$rootScope','$timeout'];

angular.module('berger').controller('containerController', containerController);