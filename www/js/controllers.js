angular.module('starter.controllers', [])
.controller('AppCtrl', function($scope, $ionicModal, $timeout, StorageService, DataServer) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  $scope.settings = {
    is_logged_in: false,
  };
  $scope.$on('$ionicView.enter', function(e) {
    if(StorageService.get("username") != null)
      $scope.settings.is_logged_in = true;
  });
  $scope.logout = function() {
    StorageService.removeAll();
    $scope.settings.is_logged_in = false;
  }
})
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
    },
    chart_width: 1000
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
      var devices = StorageService.get('devices');
      devices = JSON.parse(devices);
      $scope.settings.devices_data = devices;
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

  $scope.formatTime = function(d) {
    var date = new Date(d);
    return d3.time.format('%d %B %Y %H:%M')(date);
  },

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
    start_time = time.getUTCDate()+'/'+(parseInt(time.getUTCMonth(), 10)+1)+'/'+time.getUTCFullYear();
    var temp = new Date();
    if($scope.settings.selected_time == 'Today')
    {
      temp.setDate(time.getUTCDate() + 1)
      end_time = temp.getUTCDate()+'/'+(parseInt(temp.getUTCMonth(), 10)+1)+'/'+temp.getUTCFullYear();
    }
    else if($scope.settings.selected_time == 'Yesterday')
    {
      temp.setDate(time.getUTCDate() - 1)
      end_time = temp.getUTCDate()+'/'+(parseInt(temp.getUTCMonth(), 10)+1)+'/'+temp.getUTCFullYear();
      temp = start_time;
      start_time = end_time;
      end_time = temp;
    }
    else if($scope.settings.selected_time == 'Lastweek')
    {
      temp.setDate(time.getUTCDate() - 7)
      end_time = temp.getUTCDate()+'/'+(parseInt(temp.getUTCMonth(), 10)+1)+'/'+temp.getUTCFullYear();
      temp = start_time;
      start_time = end_time;
      end_time = temp;
    }
    else if($scope.settings.selected_time == 'Lastmonth')
    {
      temp.setDate(time.getUTCDate() - 30)
      end_time = temp.getUTCDate()+'/'+(parseInt(temp.getUTCMonth(), 10)+1)+'/'+temp.getUTCFullYear();
      temp = start_time;
      start_time = end_time;
      end_time = temp;
    }

    if(y == '' | y == null)
      return;
    if(start_time == null || end_time == null)
      return;
    if($scope.settings.selected_plot_type == null)
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
        title: parameter + ' ' + time
      }
    };

    if(plot_type != 'pieChart'){
      options.chart.xAxis = {
        showMaxMin: false,
        tickFormat: function(d) {
          // console.log(d);
          if($scope.settings.selected_time == 'Today' || $scope.settings.selected_time == 'Yesterday')
            return d3.time.format('%d %B %Y %H:%M')(d)
          return d3.time.format("%d %B %Y")(d)
          }
      }
      options.chart.yAxis = {
        axisLabel: parameter + ' ' + time,
        tickFormat: function(d) {
          return d3.format(',.2f')(d);
        }
      }
    }

    var chartdata = [];
    var dev_data = device_data.data.dynamic_data;
    var pieTicks = function(date){
      return d3.time.format("%d %B %Y")(date);
    }
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
          label: (plot_type == 'pieChart')?pieTicks(new Date(dev_data['time'][i])):new Date(dev_data['time'][i]),
          value: dev_data[param][i],
        }
        the_data.values.push(value)
      }
      chartdata.push(the_data);
    }
    console.log(chartdata)

    if(plot_type == 'pieChart')
    {
      chartdata = chartdata[0].values;
      $scope.settings.chart_width = 500;
    }
    else
    {
      $scope.settings.chart_width = 150*dev_data["time"].length;
    }
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
        devices = StorageService.get('devices');
        devices = JSON.parse(devices);
        $scope.settings.devices_data = devices;
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

  $scope.formatTime = function(d) {
    var date = new Date(d);
    return d3.time.format('%d %B %Y %H:%M')(date);
  },

  $scope.doRefresh = function() {
    DataServer.get_devices_list()
    .success(function(data){
      var devices = StorageService.get('devices')
      devices = JSON.parse(devices);
      $scope.settings.devices_data = devices;
    })
    .finally(function() {
       // Stop the ion-refresher from spinning
       $scope.$broadcast('scroll.refreshComplete');
     });
  }
})

.controller('DeviceDetailCtrl', function($scope, $stateParams, StorageService, DataServer, $state) {

  $scope.settings = {
    devices: JSON.parse(StorageService.get('devices')),
    selected_device: null,
    device_data: null,
    show_device_controls: false,
    selected_command: null,
    selected_command_val: null,
    device_command_vals: null,
    command_via_sms: false,

    all_devices_events: null,

    device_events:{
      events_list: null,
    }
  }

  $scope.search_device = function(device_id){
    var the_device = null;
    console.log($scope.settings.devices)
    if($scope.settings.devices)
    {
      $scope.settings.devices.map(function(device){
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
          device_data = StorageService.get('device_'+$scope.settings.selected_device.ip_address)
          $scope.settings.device_data = JSON.parse(device_data);
        })
      }
      else
      {
        $scope.settings.device_data = JSON.parse(device_data);
        console.log($scope.settings.device_data)
      }

      var all_devices_events = StorageService.get('user_events_list');
      if(all_devices_events == null)
      {
        DataServer.get_events_list(null).success(function(data) {
          all_devices_events = StorageService.get('user_events_list');
          $scope.settings.all_devices_events = JSON.parse(all_devices_events);
        });
      }
      else
      {
        $scope.settings.all_devices_events = JSON.parse(all_devices_events);
      }

      console.log("All user events: ");
      console.log($scope.settings.all_devices_events);

      var this_device_events = [];

      for(event in $scope.settings.all_devices_events){
        var this_event = $scope.settings.all_devices_events[event];
        if(this_event.device == $scope.settings.selected_device.ip_address){
          this_device_events.push(this_event);
      }}

      $scope.settings.device_events.events_list = this_device_events;
      console.log("This device events: ");
      console.log($scope.settings.device_events.events_list);
    }

  });

  $scope.selected_command_changed = function() {

  }

  $scope.send_command = function() {
    var device = $scope.settings.selected_device.ip_address;
    if(device)
    {
      var command = $scope.settings.selected_command;
      var command_val = $scope.settings.selected_command_val;
      var method = '0';
      if($scope.settings.command_via_sms)
        method = '1';

      DataServer.send_command(device, command, command_val, method).success(function(data) {
        if(data.error == "success")
          alert("Command sent.")
        else
          alert("Error: " + data.error)
        console.log(data)
      });
    }
  }

  $scope.formatTime = function(d) {
    var date = new Date(d);
    return d3.time.format('%d %B %Y %H:%M')(date);
  },

  $scope.edit_event = function(event_id, device) {
    // $state.go('tab.event');
    if(event_id == 'new')
      $state.go('tab.event', {'event_id': device});
    else
      $state.go('tab.event', {'event_id': event_id});
  }

  $scope.doRefresh = function() {
    $scope.settings.selected_device = $scope.search_device($stateParams.chatId);
    if($scope.settings.selected_device != null)
    {
      DataServer.get_device_data($scope.settings.selected_device.ip_address)
      .success(function(data){
        var device_data = StorageService.get('device_'+$scope.settings.selected_device.ip_address)
        $scope.settings.device_data = JSON.parse(device_data);
      })
      .finally(function() {
         // Stop the ion-refresher from spinning
         $scope.$broadcast('scroll.refreshComplete');
       });
    }
    $scope.$broadcast('scroll.refreshComplete');
  }


})

.controller('AccountCtrl', function($http, $scope, StorageService, DataServer, $ionicSideMenuDelegate) {
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
    is_logged_in: $scope.check_login(),//Check the cookie value here.
    show_login: false,
    user: '',
    password: '',
    login_message: '',
    events_list: null,
  }

  $scope.login = function(){
    $scope.settings.show_login = true;
    $scope.settings.login_message = DataServer.login($scope.settings.user, $scope.settings.password).success(function(result){
      $scope.settings.show_login = false;
      $scope.settings.is_logged_in = false; 

      //Send the GCM token to server if login successful
      DataServer.send_gcm_token(StorageService.get('gcm_token'));
    }).error(function(data){
      console.log(data)
      $scope.settings.login_message = "Invalid login";
    });
  }

  $scope.formatTime = function(d) {
    var date = new Date(d);
    return d3.time.format('%d %B %Y %H:%M')(date);
  }

  $scope.fetch_past_events = function(use_cache){
    if(use_cache == undefined)
      use_cache = true
    var events_data = StorageService.get('events');
    if(events_data == null || use_cache == false)
    {
      var time = new Date();
      start_time = time.getUTCDate()+'/'+(parseInt(time.getUTCMonth(), 10)+1)+'/'+time.getUTCFullYear();
      var temp = new Date()
      temp.setDate(time.getUTCDate() - 7)
      end_time = temp.getUTCDate()+'/'+(parseInt(temp.getUTCMonth(), 10)+1)+'/'+temp.getUTCFullYear();
      temp = start_time;
      start_time = end_time;
      end_time = temp;

      DataServer.get_events_data(null, start_time, end_time)
      .success(function(data){
        events_data = StorageService.get('events')
        $scope.settings.events_list = JSON.parse(events_data);
        console.log($scope.settings.events_list)
      })
    }
    else
    {
      $scope.settings.events_list = JSON.parse(events_data);
      console.log($scope.settings.events_list);
    }
  }
  $scope.$on('$ionicView.enter', function(e) {
    // alert(events_data);
    $scope.fetch_past_events();
  });

  $scope.doRefresh = function() {
    $scope.fetch_past_events(use_cache=false);
    $scope.$broadcast('scroll.refreshComplete');
  }


  $scope.toggleLeftSideMenu = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

})
.controller('EventCtrl', function($scope, $ionicModal, $timeout, StorageService, DataServer, $stateParams) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  $scope.settings = {
    event_id: null,
    event_data: null,
  };
  $scope.$on('$ionicView.enter', function(e) {
    // console.log($stateParams.event_id);

    if($stateParams.event_id.indexOf('.') == -1)
    {
      $scope.settings.event_id = $stateParams.event_id;
      var event_details = DataServer.get_event($stateParams.event_id).success(function(data) {
        console.log(data);
        $scope.settings.event_data = data;
        $scope.settings.selected_event = data.event_type;
      });
    }
    else
    {
      DataServer.get_all_event_types().success(function(data) {
        $scope.settings.event_data = {
          'device': $stateParams.event_id,
          'available_event_types': data,
        }
      });
      console.log($scope.settings.event_data)
    }
  });


  $scope.create_event = function()
  {
    DataServer.create_event($scope.settings.event_id, $scope.settings.event_data).success(function() {
      alert("Event created.")
    })
  }
})
