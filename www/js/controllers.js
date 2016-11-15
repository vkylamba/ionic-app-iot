angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, StorageService, DataServer) {
  $scope.settings = {
    devices_data: [],
    filtered_devices: [],
    search_term: null,
    show_device_list: false,
    picked_device: '',
    chart: {
      options: {  
        chart: {
          type: 'pieChart',
          height: 500,
          x: function(d){return d.key;},
          y: function(d){return d.y;},
          showLabels: true,
          duration: 500,
          labelThreshold: 0.01,
          labelSunbeamLayout: true,
          legend: {
            margin: {
              top: 5,
              right: 35,
              bottom: 5,
              left: 0
            }
          }
        }
      },
      data:  [  
        {
          key: "One",
          y: 5
        },
        {
          key: "Two",
          y: 2
        },
        {
          key: "Three",
          y: 9
        },
        {
          key: "Four",
          y: 7
        },
        {
          key: "Five",
          y: 4
        },
        {
          key: "Six",
          y: 3
        },
        {
          key: "Seven",
          y: .5
        }
      ]
    }
  };

  $scope.$on('$ionicView.enter', function(e) {
    var devices = StorageService.get('devices');
    if(devices == null)
      DataServer.get_devices_list()
      .success(function(data){
        $scope.settings.devices_data = data;
      })
    else
    {
      devices = JSON.parse(devices);
      $scope.settings.devices_data = devices;
    }
    if($scope.settings.search_term == null)
      $scope.settings.filtered_devices = $scope.settings.devices_data;
  });

  $scope.doRefresh = function() {
    DataServer.get_devices_list()
    .success(function(data){
      $scope.settings.devices_data = data;
    })
    .finally(function() {
       // Stop the ion-refresher from spinning
       $scope.$broadcast('scroll.refreshComplete');
     });
  }

  $scope.$watch('settings.search_term', function() {
    var search_ip = $scope.settings.search_term;
    $scope.settings.filtered_devices = $scope.settings.devices_data;
    if(search_ip != null && $scope.settings.devices_data)
    {
      $scope.settings.filtered_devices = [];
      $scope.settings.devices_data.map(function(device){
        if(device.ip_address.search(search_ip) != -1)
        { 
          $scope.settings.filtered_devices.push(device);
        }
      });
    }
  });

  $scope.select_device = function(device) {
    $scope.settings.picked_device = device;
    $scope.settings.search_term = null;
    $scope.settings.show_device_list = false;
  }
})

.controller('ChatsCtrl', function($scope, StorageService, DataServer) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //

  $scope.settings = {
    devices: [],
    devices_data: [],
  }

  $scope.$on('$ionicView.enter', function(e) {
    var devices = StorageService.get('devices')
    if(devices == null)
      DataServer.get_devices_list()
      .success(function(data){
        $scope.settings.devices_data = data;
      })
    else
    {
      devices = JSON.parse(devices);
      $scope.settings.devices_data = devices;
    }
  });

  $scope.remove = function(device) {
    // Chats.remove(chat);
  };

  $scope.doRefresh = function() {
    DataServer.get_devices_list()
    .success(function(data){
      $scope.settings.devices_data = data;
    })
    .finally(function() {
       // Stop the ion-refresher from spinning
       $scope.$broadcast('scroll.refreshComplete');
     });
  }
})

.controller('DeviceDetailCtrl', function($scope, $stateParams, StorageService, DataServer) {

  $scope.settings = {
    devices: StorageService.get('devices'),
    selected_device: null,
    device_data: null,
  }

  $scope.search_device = function(device_id){
    var the_device = null;
    if($scope.settings.devices_data)
    {
      $scope.settings.devices_data.map(function(device){
        {
          if(device.ip_address == device_id)
            the_device = device
        }
      });
    }
      return the_device;
  }

  $scope.$on('$ionicView.enter', function(e) {
    $scope.settings.selected_device = $scope.search_device($stateParams.chatId);

    if($scope.settings.selected_device != null)
    {
      var device_data = StorageService.get('device_'+$scope.settings.selected_device.ip_address)
      // alert('device_'+$scope.settings.selected_device.ip_address)
      if(device_data == null)
      {
        DataServer.get_device_data($scope.settings.selected_device.ip_address)
        .success(function(data){
          $scope.settings.device_data = data;
        })
      }
      else
      {
        $scope.settings.device_data = JSON.parse(device_data);
        console.log($scope.settings.device_data)
      }
    }
  });


  $scope.doRefresh = function() {
    $scope.settings.selected_device = $scope.search_device($stateParams.chatId);
    if($scope.settings.selected_device != null)
    {
      DataServer.get_device_data($scope.settings.selected_device.ip_address)
      .success(function(data){
        $scope.settings.device_data = data;
      })
      .finally(function() {
         // Stop the ion-refresher from spinning
         $scope.$broadcast('scroll.refreshComplete');
       });
    }
  }


})

.controller('AccountCtrl', function($http, $scope, StorageService, DataServer) {
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
    is_logged_in: false,//Check the cookie value here.
    show_login: $scope.check_login(),
    user: '',
    password: '',
    login_message: ''
  }

  $scope.login = function(){
    $scope.settings.show_login = true;
    $scope.settings.login_message = DataServer.login($scope.settings.user, $scope.settings.password).success(function(result){
      $scope.settings.show_login = false;  
    }).error(function(data){
      console.log(data)
      $scope.settings.login_message = "Invalid login";
    });
  }
});
