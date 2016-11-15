angular.module('starter.services', [])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'img/ben.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'img/max.png'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'img/adam.jpg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'img/perry.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'img/mike.png'
  }];

  return {
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
})

.factory('DataServer', function($http, StorageService) {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var server_uri = "http://iotforeverything.herokuapp.com";
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

