'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', ['myApp.controllers']);

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, $http) {
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
        console.log($scope._uniques)
      }).
      error(function (data, status, headers, config) {
        $scope._error = 'Error!';
      });

  });