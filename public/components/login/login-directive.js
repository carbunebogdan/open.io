const loginDirective = ($rootScope,$location,localStorageService,$mdDialog,socketService,$window) => {
    return {
        templateUrl: 'components/login/login.html',
        restrict: 'E',
        link: (scope) => {


            scope.proceed=(username)=>{
                    socketService.socketEmit('tryConnect',username);
                    scope.username=username;
            }

            socketService.socketOn('confirmMessage',(from)=>{
                                    if(from==1){
                                        $rootScope.account={
                                            uname:scope.username
                                        }
                                        $window.location.href='/#!/room';
                                    }else{
                                        scope.showWarn();
                                    }
                                })

            scope.showWarn = function(ev) {
                $mdDialog.show(
                  $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Username already exists!')
                    .textContent('Please choose another one.')
                    .ok('ok')
                    .targetEvent(ev)
            );
          };





        	
        }
    };
};

loginDirective.$inject = ['$rootScope','$location','localStorageService','$mdDialog','socketService','$window'];

angular.module('berger').directive('loginDirective', loginDirective);

