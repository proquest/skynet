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
        var indexes = {}
        $scope._uniques = [];
        var nowString = $scope.now.toDateString();
        angular.forEach(data, function (value, key) {
          if (value.timestamp)
            value.timestamp = new Date(value.timestamp);
          value.todayCount = value.timestamp && nowString == value.timestamp.toDateString() ? 1 : 0;
          value.count = 1;
          var key = value.file ? value.file + value.lineNumber : value.func;
          if (indexes[key] >= 0) {
            $scope._uniques[indexes[key]].count++;
            $scope._uniques[indexes[key]].todayCount += value.todayCount;
          }
          else {
            indexes[key] = $scope._uniques.length;
            $scope._uniques.push(value);
          }
        });
        $scope._uniques = $scope._uniques.sort(function(a,b){return a.count == b.count ? 0 : a.count > b.count ? -1 : 1});
      }).
      error(function (data, status, headers, config) {
        $scope._error = 'Error!';
      });

  });