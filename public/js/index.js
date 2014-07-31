'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', ['myApp.controllers']);

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, $http) {
    $scope.todayOnly = true;
    $scope.filterToday = function(item){
      var now = new Date(), day = 24 * 60 * 60 * 1000;
      if(item >= (now - day))
        return true;
    };
    $http({
      method: 'GET',
      url: '/status'
    }).
      success(function (data, status, headers, config) {
        $scope._all = data;
        $scope._uniques = {};
        $scope._last24 = {};
        angular.forEach(data, function (value, key) {
          value.count = 1;
          var date = new Date(value.timestamp);
          if(value.file) {
            if ($scope._uniques[value.file + value.lineNumber]) {
              $scope._uniques[value.file + value.lineNumber].count++;

            }
            else {
              $scope._uniques[value.file + value.lineNumber] = value;
            }
          }
          else if(value.func) {
            if($scope._uniques[value.func])
              $scope._uniques[value.func].count++;
            else
              $scope._uniques[value.func] = value;
          }
        });
      }).
      error(function (data, status, headers, config) {
        $scope._error = 'Error!';
      });

  });