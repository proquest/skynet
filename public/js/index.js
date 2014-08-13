'use strict';

// Declare app level module which depends on filters, and services

angular.module('skynet', ['skynet.controllers']);
angular.module('skynet.controllers', []).
  controller('AppCtrl', function ($scope, $http) {
    $scope.todayOnly = true;
    $scope.now = new Date();
    $scope.filterToday = function(date){
      return function(error) {
        var day = 24 * 60 * 60 * 1000;
        return !$scope.todayOnly || error.timestamp >= (date - day);
      }
    };
    $http({
      method: 'GET',
      url: '/status'
    }).
      success(function (data, status, headers, config) {
        $scope._uniques = data;
      }).
      error(function (data, status, headers, config) {
        $scope._error = 'Error!';
      });

  });