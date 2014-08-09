var app = angular.module("angularFretboard", ['Scope.safeApply']);

app.directive("fretboard", ["$rootScope",
function ($rootScope) {
  var fretboardsGeneratedCounter = 0;

  return {
    restrict: "A",
    scope: {
      config: "=fretboardConfig",
      //tuningChangeCallback : "&fretboardTuningChangeCallback"
    },
    // The controller code is run before the scopes of other directives which
    // need access to it, so create the jQuery fretboard here
    controller: ["$scope", "$element", "$attrs",
      function ($scope, $element, $attrs) {
        var ctrl = this;

        initialize($scope.config, $element, ctrl);

        $scope.$watch(function () {
          return $scope.config.noteClickingDisabled;
        }, function (newVal, oldVal) {
          if (newVal === true) {
            ctrl.jQueryFretboard.disableNoteClicking();
          } else {
            ctrl.jQueryFretboard.enableNoteClicking();
          }
        });

        $scope.$watch(function () {
          return $scope.config.tuningClickingDisabled;
        }, function (newVal, oldVal) {
          if (newVal === true) {
            ctrl.jQueryFretboard.disableTuningClicking();
          } else {
            ctrl.jQueryFretboard.enableTuningClicking();
          }
        });
						
        $scope.$watch(function () {
          return $scope.config.isChordMode;
        }, function (newVal, oldVal) {
          if (newVal === true) {
            ctrl.jQueryFretboard.setChordMode(true);
          } else {
            ctrl.jQueryFretboard.setChordMode(false);
          }
        });
      }
    ],
    // we create 2 inner directives so they can each have their own ngModel, which handles two-way data-binding
    // for only one thing 
    template: '<div fretboard-tuning ng-model="config.guitarStringNotes"></div>' +
      '<div fretboard-clicked-notes ng-model="config.clickedNotes"></div>'
  }

  function initialize(config, element, ctrl) {
    var domId = getUniqueDomIdForFretboard();
    element.attr("id", domId).fretboard(config);

    ctrl.jQueryFretboardElement = element;
    ctrl.jQueryFretboard = element.data('fretboard');
  }

  function getUniqueDomIdForFretboard() {
    fretboardsGeneratedCounter++;
    return "fretboardjs-" + fretboardsGeneratedCounter;
  }
}
]);

// Do not give these inner directives isolate scope or they will won't be able
// to access the config in the fretboard directive's isolate scope
app.directive("fretboardTuning", ["$rootScope", "$parse",
function ($rootScope, $parse) {
  var isFirst = true;

  return {
    restrict: "A",
    require: ["ngModel", "^fretboard"],
    link: function (scope, element, attrs, ctrls) {
      var ngModelCtrl = ctrls[0];
      var fretboardCtrl = ctrls[1];

      var jQueryFretboardElement = fretboardCtrl.jQueryFretboardElement;
      var jQueryFretboard = fretboardCtrl.jQueryFretboard;

      //var tuningChangeCallback = ($parse(attrs.tuningChangeCallback))(scope);

      // Updating the controller
      jQueryFretboardElement.on("tuningChanged", function () {
        $rootScope.$safeApply(function () {
          ngModelCtrl.$setViewValue(jQueryFretboard.getGuitarStringNotes());

          //if (tuningChangeCallback) {
          //  tuningChangeCallback();
          //}
        });
      });

      ngModelCtrl.$render = function () {
        //console.log("render");
        // prevent double rendering the first time
        if (isFirst) {
          //console.log("skip");
          // Put the tuning on the controller in case its config file did not 
          // define a tuning (in which case the default was used)
          ngModelCtrl.$setViewValue(jQueryFretboard.getGuitarStringNotes());
          isFirst = false;
          return;
        }

        jQueryFretboard.setTuning(ngModelCtrl.$viewValue);

        //if (tuningChangeCallback) {
        //  tuningChangeCallback();
        //}
      }
    }
  }
}
]);

app.directive("fretboardClickedNotes", ["$rootScope", "$parse",
function ($rootScope, $parse) {
  return {
    restrict: "A",
    require: ["ngModel", "^fretboard"],
    link: function (scope, element, attrs, ctrls) {
      var ngModelCtrl = ctrls[0];
      var fretboardCtrl = ctrls[1];

      var jQueryFretboardElement = fretboardCtrl.jQueryFretboardElement;
      var jQueryFretboard = fretboardCtrl.jQueryFretboard;

      //var clickedNoteCallback = ($parse(attrs.clickedNoteCallback))(scope);

      // Updating the controller
      jQueryFretboardElement.on("noteClicked", function () {
        $rootScope.$safeApply(function () {
          ngModelCtrl.$setViewValue(jQueryFretboard.getClickedNotes());

          //if (clickedNoteCallback) {
          //  clickedNoteCallback();
          //}
        });
      });

      ngModelCtrl.$render = function () {
        jQueryFretboard.clearClickedNotes(); // will trigger notesCleared event

        var newNotes = ngModelCtrl.$viewValue;

        if (!newNotes) {
          return;
        }

        for (var i = 0; i < newNotes.length; i++) {
          if (newNotes[i]) {
            jQueryFretboard.setClickedNoteByStringNoteAndFretNum(newNotes[i]);
          }
        }

        //if (clickedNoteCallback) {
        //  clickedNoteCallback();
        //}
      }
    }
  }
}
]);
