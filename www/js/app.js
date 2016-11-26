// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngStorage', 'starter.controllers', 'starter.services', 'nvd3'])

.run(function($ionicPlatform, DataServer, StorageService) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    var push = PushNotification.init({
        android: {
            senderID: "753349360846"
        },
        browser: {
            pushServiceURL: 'http://push.api.phonegap.com/v1/push'
        },
        ios: {
            alert: "true",
            badge: true,
            sound: 'false'
        },
        windows: {}
    });

    PushNotification.hasPermission(function(data) {
        if (data.isEnabled) {
            console.log('push notifications isEnabled');
        }
    });

    push.on('registration', function(data) {
        // data.registrationId
        StorageService.add('gcm_token', data.registrationId);
        var token = StorageService.get('token')
        if(token != null)
          DataServer.send_gcm_token(data.registrationId);
        console.log("Push registration id: " + data.registrationId)
        // persist the token in the Ionic Platform
        push.saveToken(token);
    });

    push.on('notification', function(data) {
        // data.messag
        e,
        // data.title,
        // data.count,
        // data.sound,
        // data.image,
        // data.additionalData
        alert("Got pushed: " + data.message);
    });

    push.on('error', function(e) {
        // e.message
        alert("Push error: " + e.message);
    });
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'AppCtrl'
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'DeviceDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/dash');

})
.factory ('StorageService', function ($localStorage) {
$localStorage = $localStorage.$default({
    things: []
  });
var _getAll = function () {
  return $localStorage.things;
};
var _add = function (key, val) {
  var obj = {
    'key': key,
    'val': val
  }
  $localStorage.things.push(obj);
}
var _remove = function (thing_key) {
  $localStorage.things.map(function(each_thing){
    if(each_thing != null && each_thing.key == thing_key)
      delete each_thing;
  });
}
var _removeAll = function () {
  console.log($localStorage.things);
  $localStorage.things = [];
}
var _get = function(thing_key) {
  var the_thing = null;
  $localStorage.things.map(function(each_thing){
    if(each_thing != null && each_thing.key == thing_key)
      the_thing = each_thing;
  });
  if(the_thing != null)
    return the_thing.val;
  else
    return the_thing;
}
return {
    get: _get,
    getAll: _getAll,
    add: _add,
    remove: _remove,
    removeAll: _removeAll
  };
});
