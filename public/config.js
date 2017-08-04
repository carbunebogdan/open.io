// Setting up routes
angular.module('berger')
    .config(['$stateProvider', '$urlRouterProvider', ($stateProvider, $urlRouterProvider) => {

        // States for my app
        $stateProvider
            .state('login',{
                url: '/login',
                controller: 'containerController',
                controllerAs: 'contCtrl',
                template: '<login-directive></login-directive>'
            })
            .state('room', {
                url: '/room',
                controller: 'containerController',
                template: '<container-directive></container-directive>'
            });

        // For unmatched routes:
        $urlRouterProvider.otherwise('/login');
    }])
    .config(function($mdThemingProvider) {

      $mdThemingProvider.definePalette('openIoColors', {
        '50': 'ffebee',
        '100': 'ffcdd2',
        '200': 'ef9a9a',
        '300': 'e57373',
        '400': 'ef5350',
        '500': 'ccab6e',
        '600': 'e53935',
        '700': 'd32f2f',
        '800': 'c62828',
        '900': 'b71c1c',
        'A100': 'ff8a80',
        'A200': 'ff5252',
        'A400': 'ff1744',
        'A700': 'd50000',
        'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
                                            // on this palette should be dark or light

        'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
         '200', '300', '400', 'A100'],
        'contrastLightColors': undefined    // could also specify this if default was 'dark'
      });

      $mdThemingProvider.theme('default')
        .primaryPalette('openIoColors') 

});

//Setting HTML5 Location Mode
angular.module('berger')
    .config(['$locationProvider',
        function($locationProvider){
            $locationProvider.hashPrefix('!');
        }
    ]);