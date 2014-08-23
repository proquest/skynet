'use strict';

// Declare app level module which depends on filters, and services

angular.module('skynet', ['skynet.controllers']);
angular.module('skynet.controllers', []).
  controller('AppCtrl', function ($scope, $http) {
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