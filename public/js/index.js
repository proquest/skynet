'use strict';

// Declare app level module which depends on filters, and services

angular.module('skynet', ['skynet.controllers']);
angular.module('skynet.controllers', []).
  controller('AppCtrl', function ($scope, $http) {
    $scope.todayOnly = true;
    $scope.now = new Date();
    $scope.filterToday = function(date){
      console.log(date);
      return function(error) {
        console.log(error);
        var day = 24 * 60 * 60 * 1000;
        return !$scope.todayOnly || error.timestamp >= (date - day);
      }
    };
    $scope.handleDates = function(dates){
      var newDates = {}
      for(var i = 0; i < dates.length; i++){
        console.log(dates[i].getDate());
        var dateString = dates[i].toDateString();
        if(newDates[dateString])
          newDates[dateString]++;
        else
          newDates[dateString] = 1;
      }
      var output = [];
      for(var date in newDates)
        output.push({date:date,count:newDates[date]})
      return output;
    };
    $http({
      method: 'GET',
      url: '/status'
    }).
      success(function (data, status, headers, config) {
        var indexes = {}
        $scope._uniques = [];
        angular.forEach(data, function (value, key) {
          value.count = 1;
          var date = new Date(value.timestamp);
          if(value.file) {
            if (indexes[value.file + value.lineNumber] >= 0) {
              $scope._uniques[indexes[value.file + value.lineNumber]].count++;
              $scope._uniques[indexes[value.file + value.lineNumber]].timestamp.push(new Date(value.timestamp));
            }
            else {
              indexes[value.file + value.lineNumber] = $scope._uniques.length;
              value.timestamp = [new Date(value.timestamp)];
              $scope._uniques.push(value);
            }
          }
          else if(value.func) {
            if(indexes[value.func] >= 0) {
              $scope._uniques[indexes[value.func]].count++;
              $scope._uniques[indexes[value.func]].timestamp.push(new Date(value.timestamp));
            }
            else{
              indexes[value.func] = $scope._uniques.length;
              value.timestamp = [new Date(value.timestamp)];
              $scope._uniques.push(value);
            }
          }
        });
        $scope._uniques.sort(function(a,b){return a.count > b.count});
        //group timestamp into days
      }).
      error(function (data, status, headers, config) {
        $scope._error = 'Error!';
      });

  });