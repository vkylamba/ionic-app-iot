angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats, StorageService, $http) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //

  $scope.settings = {
    devices: [],
    devices_data: [],
    filtered_devices: [],
    server_uri: "http://iotforeverything.herokuapp.com",
  }
  $scope.get_devices_list = function(){
    $http({
      method: 'GET',
      url: $scope.settings.server_uri + '/api/devices',
      headers: {
          "Authorization": 'Token ' + StorageService.get('token'),
          'Access-Control-Request-Headers': 'Authorization',
      }
    }).success(function(data, status, headers, config) {
      // this callback will be called asynchronously
      // when the response is available
      console.log("data: " + JSON.stringify(data));
      if( data.error == "success")
      {
          $scope.settings.devices = [];
          $scope.settings.devices_data = data.devices[0];

          for(var i=0; i < data.devices[0].length; i++)
              $scope.settings.devices.push(data.devices[0][i]["ip_address"]);

          $scope.settings.filtered_devices = $scope.settings.devices_data;
          StorageService.add('devices', $scope.settings.devices_data);
      }
    })
  }

  $scope.$on('$ionicView.enter', function(e) {
    var devices = StorageService.get('devices')
    if(devices == null)
      $scope.get_devices_list();
    else
      $scope.settings.devices_data = devices;
  });

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('DeviceDetailCtrl', function($scope, $stateParams, StorageService) {

  $scope.settings = {
    devices: StorageService.get('devices'),
    selected_device: null,
    server_uri: "http://iotforeverything.herokuapp.com",
  }

  $scope.search_device = function(device_id){
    var the_device = null;
    $scope.settings.devices.map(function(device){
      {
        if(device.ip_address == device_id)
          the_device = device
      }
    });
    // alert(the_device.face);
    return the_device;
  }
  $scope.settings.selected_device = $scope.search_device($stateParams.chatId);
})

.controller('AccountCtrl', function($http, $scope, StorageService) {
  // StorageService.removeAll();
  $scope.check_login = function(){
    var username = StorageService.get('username')
    var token = StorageService.get('token')
    if(username != null)
    {
      if(token != null)
      {
        $scope.user = username;
        return false;
      }
    }
    return true;
  }

  $scope.settings = {
    enableFriends: true,
    is_logged_in: false,//Check the cookie value here.
    show_login: $scope.check_login(),
    server_uri: "http://iotforeverything.herokuapp.com",
    request_header: {
      'Access-Control-Allow-Origin': '*'
    },
    user: '',
    password: '',
    login_message: ''
  }

  $scope.login = function(){
      $scope.settings.show_login = true;
      if($scope.settings.user != '' && $scope.settings.password != '')
      {
          // alert($scope.settings.user);
          var parameter = JSON.stringify({ "username": "dev", "password": "deviot"});
          var url = $scope.settings.server_uri + '/api/api-token-auth/';
          
          $http({
            method: 'POST',
            url: $scope.settings.server_uri + '/api/api-token-auth/',
            data: {
                "username": $scope.settings.user, "password": $scope.settings.password
            }
          }).success(function(data){
            // $cookieStore.put("user_token", data.token);
            // alert("logged in " + data.token);
            // alert("logged in " + $cookieStore.get("user_token"));
            StorageService.add('token', data.token);
            StorageService.add('username', $scope.settings.user);
            $scope.settings.user_name = $scope.settings.user;
            $scope.settings.show_login = false;
            $scope.settings.user = '';
            $scope.settings.password = '';
          }).error(function(data, status, headers, config) {
            $scope.settings.login_message = "System error";
          })
      }                     
    };

});
