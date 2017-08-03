const containerDirective = ($window,$rootScope,localStorageService,socketService) => {
    return {
        templateUrl: 'components/container/container.html',
        restrict: 'E',
        link: (scope) => {
            
        }
    };
};

containerDirective.$inject = ['$window','$rootScope','localStorageService','socketService'];

angular.module('berger').directive('containerDirective', containerDirective);

