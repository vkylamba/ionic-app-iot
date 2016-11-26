angular.module('starter.services', [])

.factory('DataServer', function($http, StorageService) {
  // Might use a resource here that returns a JSON array

  // var server_uri = "http://iotforeverything.herokuapp.com";
  var server_uri = "http://remotemonitoring.herokuapp.com";
  // var server_uri = "http://localhost:2201";
  var settings = {
    server_uri: server_uri
  }
  return {
    login: function(username, password){
      if(username != '' && password != '')
      {   
          return $http({
            method: 'POST',
            url: settings.server_uri + '/api/api-token-auth/',
            data: {
                "username": username, "password": password
            }
          }).success(function(data){
            StorageService.add('token', data.token);
            StorageService.add('username', username);
            return true;
          }).error(function(data, status, headers, config) {
            console.log(data)
            return false;
          })
      }           
    },

    get_devices_list: function(){
      return $http({
        method: 'GET',
        url: settings.server_uri + '/api/devices',
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
            var devices_data = data.devices[0];
            StorageService.add('devices', JSON.stringify(devices_data));
            return devices_data;
        }
      })
    },

    get_device_data: function(device_id) {

      return $http({
        method: 'GET',
        url: settings.server_uri + '/api/device/staticdata/'+device_id,
        headers: {
            "Authorization": 'Token ' + StorageService.get('token'),
            'Access-Control-Request-Headers': 'Authorization',
        }
      }).success(function(data, status, headers, config) {
        // this callback will be called asynchronously
        // when the response is available
        // console.log("data: " + JSON.stringify(data));
        if( data.ip_address == device_id)
        {
            console.log(data);
            var device_data = data;
            StorageService.add('device_'+device_id, JSON.stringify(data));
            return device_data;
        }
      })
    },

    get_device_dynamic_data: function(device_id, x, y, start_time, end_time) {

      return $http({
        method: 'GET',
        url: settings.server_uri + '/api/device/dynamicdata/'+device_id
          +'?x_params='+x+'&'
          +'y_params='+y+'&'
          +'start_time='+start_time+'&'
          +'end_time='+end_time,
        headers: {
            "Authorization": 'Token ' + StorageService.get('token'),
            'Access-Control-Request-Headers': 'Authorization',
        }
      }).success(function(data, status, headers, config) {
        // this callback will be called asynchronously
        // when the response is available
        // console.log("data: " + JSON.stringify(data));
        if(data.error == 'success')
        {
          return data.dynamic_data;
        }
      })
    },

    send_command: function(device_id, command, command_val, method){
      return $http({
        method: 'POST',
        url: settings.server_uri + '/api/device/sendcommand/'+device_id,
        data: {
            "command": command, "command_param": command_val, "method": method
        },
        headers: {
            "Authorization": 'Token ' + StorageService.get('token'),
            'Access-Control-Request-Headers': 'Authorization',
        }
      }).success(function(data){
        return data.error;
      }).error(function(data, status, headers, config) {
        console.log(data)
        return false;
      })
    },

    get_events_data: function(device_id, start_time, end_time) {

      return $http({
        method: 'GET',
        url: settings.server_uri + '/api/events/past'+ (device_id != null? ('/' + device_id):'')
          +'?start_time='+start_time+'&'
          +'end_time='+end_time,
        headers: {
            "Authorization": 'Token ' + StorageService.get('token'),
            'Access-Control-Request-Headers': 'Authorization',
        }
      }).success(function(data, status, headers, config) {
        // this callback will be called asynchronously
        // when the response is available
        // console.log("data: " + JSON.stringify(data));
        StorageService.add('events', JSON.stringify(data));
        return data;
      })
    },

    send_gcm_token: function(gcm_token) {

      return $http({
        method: 'GET',
        url: settings.server_uri + '/api/user/gcm/'+gcm_token,
        headers: {
            "Authorization": 'Token ' + StorageService.get('token'),
            'Access-Control-Request-Headers': 'Authorization',
        }
      }).success(function(data, status, headers, config) {
        console.log(data);
      }).error(function(data, status, headers, config) {
        console.log(data);
      })
    },

    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});

