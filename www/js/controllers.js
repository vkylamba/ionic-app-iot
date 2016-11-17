angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, StorageService, DataServer) {
  $scope.settings = {
    devices_data: [],
    filtered_devices: [],
    search_term: null,
    show_device_list: false,
    picked_device: '',
    device_parameters: [],
    selected_parameter: null,
    device_reports: ['Today', 'Yesterday', 'Lastweek', 'Lastmonth'],
    device_plot_types: [
      {
        key: 'Table',
        chart_type: 'table',
      },
      {
        key: 'Pie',
        chart_type: 'pieChart',
      },
      {
        key: 'Column',
        chart_type: 'discreteBarChart',
      },
      {
        key: 'Line',
        chart_type: 'lineChart',
      },
      {
        key: 'Column Horizontal',
        chart_type: 'multiBarHorizontalChart',
      }
    ],
    chart: {
      options: null,
      data: null,
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

    $scope.device_parameters = [];
    if($scope.settings.picked_device != null)
    {
      var device_data = StorageService.get('device_'+$scope.settings.picked_device.ip_address)
      if(device_data == null)
      {
        DataServer.get_device_data($scope.settings.picked_device.ip_address)
        .success(function(data){
          $scope.settings.device_data = data;
        })
      }
      else
      {
        device_data = JSON.parse(device_data);
        console.log(device_data)
      }
      $scope.settings.device_parameters = device_data.data_parameters;
      console.log($scope.settings.device_parameters);
    }
  }

  $scope.selected_parameter_changed = function()
  {
    // alert($scope.settings.selected_parameter)
    $scope.get_new_data();
  }
  $scope.selected_time_changed = function()
  {
    // alert($scope.settings.selected_time)
    $scope.get_new_data();
  }
  $scope.selected_plot_type_changed = function()
  {
    // alert($scope.settings.selected_plot_type)
    $scope.get_new_data();
  }

  $scope.get_new_data = function()
  {
    var y = $scope.settings.selected_parameter;

    var x = 'time';
    var start_time = null;
    var end_time = null;
    var time = new Date();
    start_time = time.getUTCDate()+'/'+time.getUTCMonth()+'/'+time.getUTCFullYear();
    var temp = new Date();
    if($scope.settings.selected_time == 'Today')
    {
      temp.setDate(time.getUTCDate() + 1)
      end_time = temp.getUTCDate()+'/'+temp.getUTCMonth()+'/'+temp.getUTCFullYear();
    }
    else if($scope.settings.selected_time == 'Yesterday')
    {
      temp.setDate(time.getUTCDate() + 1)
      end_time = temp.getUTCDate()+'/'+temp.getUTCMonth()+'/'+temp.getUTCFullYear();
      temp = start_time;
      start_time = end_time;
      end_time = temp;
    }
    else if($scope.settings.selected_time == 'Lastweek')
    {
      temp.setDate(time.getUTCDate() + 7)
      end_time = temp.getUTCDate()+'/'+temp.getUTCMonth()+'/'+temp.getUTCFullYear();
      temp = start_time;
      start_time = end_time;
      end_time = temp;
    }
    else if($scope.settings.selected_time == 'Lastmonth')
    {
      temp.setDate(time.getUTCDate() + 30)
      end_time = temp.getUTCDate()+'/'+temp.getUTCMonth()+'/'+temp.getUTCFullYear();
      temp = start_time;
      start_time = end_time;
      end_time = temp;
    }

    if(y == '' | y == null)
      return;
    if(start_time == null || end_time == null)
      return;

    DataServer.get_device_dynamic_data($scope.settings.picked_device.ip_address, x, y, start_time, end_time).then(function(data) {
      $scope.update_plot(data);
    });
  }

  $scope.update_plot = function(device_data) {
    // alert("Hello")
    var parameter = $scope.settings.selected_parameter;
    var time = $scope.settings.selected_time;
    var plot_type = null;
    for(var k in $scope.settings.device_plot_types)
    {
      var p_type = $scope.settings.device_plot_types[k];
      if(p_type.key == $scope.settings.selected_plot_type)
      {
        plot_type = p_type.chart_type;
        break;
      }
    }
    var options = {  
      chart: {
        type: plot_type,
        height: 450,
        x: function(d){return d.label;},
        y: function(d){return d.value;},
        showControls: false,
        showValues: true,
        showLabels: true,
        duration: 500,
        stacked: true,
        title: "Demo chart"
      }
    };

    if(plot_type != 'pieChart'){
      options.chart.xAxis = {
        showMaxMin: false
      }
      options.chart.yAxis = {
        axisLabel: 'GitHub Stars',
        tickFormat: function(d) {
          return d3.format(',.2f')(d);
        }
      }
    }

    var stars = {  
      "Angular" : [18567 , 44913],
      "Backbone" : [16651 , 23633],
      "Ember" : [9023 , 15249],
      "Flight" : [4655 , 6380],
      "Knockout" : [4487 , 6990],
      "Marionette" : [4261 , 6629],
      "React" : [3691 , 32656]
    };

    var chartdata = [];
    var dev_data = device_data.data.dynamic_data;
    for(var param in dev_data)
    {
      if(param == "time")
        continue
      var the_data = {
        "key": param,
        "values": []
      }

      for(var i=0;i<dev_data[param].length;i++){
        var value = {
          label: dev_data['time'][i],
          value: dev_data[param][i],
        }
        the_data.values.push(value)
      }
      chartdata.push(the_data);
    }
    console.log(chartdata)

    $scope.settings.chart.options = options;
    $scope.settings.chart.data = chartdata;
    // $scope.api.refresh();
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
