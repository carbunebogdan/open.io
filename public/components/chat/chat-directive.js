const chatDirective = ($rootScope, socketService, $window,localStorageService) => {
    return {
        templateUrl: 'components/chat/chat.html',
        restrict: 'E',
        link: (scope) => {
            scope.messages=[{
                sender:'open.io',
                message:'welcome'
            }]
            scope.message = {
                sender: $rootScope.account.uname,
                message: ''
            };
            var scrollChat = () => {
                var chat = document.getElementById('chat');
                $('#chat').animate({
                    scrollTop: chat.scrollHeight
                }, 300);
            }
            socketService.socketOn('playerJoin',(from)=>{
                if(from.uname!=$rootScope.account.uname){
                    scope.messages.push({
                        sender:'open.io',
                        message:from.uname+' joined!'
                    });
                    scope.$apply();
                    scrollChat(); 
                }
            });

            socketService.socketOn('playerDisconnect',(from)=>{
                if(from.uname!=$rootScope.account.uname){
                    scope.messages.push({
                        sender:'open.io',
                        message:from.uname+' left..'
                    });
                    scope.$apply();
                    scrollChat(); 
                }
            });

            scope.send = () => {
                if (scope.message.message != '') {
                    scope.messages.push(scope.message);
                    scrollChat();
                    socketService.socketEmit('newMessage', scope.message);

                    scope.message = {
                        sender: $rootScope.account.uname,
                        message: ''
                    };
                }
            }

            // Watch for socket incoming data
            socketService.socketOn('newMessage', (rsp) => {
                if(rsp.source.sender!=$rootScope.account.uname){
                    scope.messages.push(rsp.source);
                    scope.$apply();
                    scrollChat(); 
                }

            });
        }
    };
};

chatDirective.$inject = ['$rootScope', 'socketService', '$window','localStorageService'];

angular.module('berger').directive('chatDirective', chatDirective);
