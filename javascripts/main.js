// Generated by CoffeeScript 1.6.3
(function() {
  var activeMarkers, activePolylines, addMapLine, clearMap, createPlowTrail, createPlowsOnMap, dropMapMarker, getActivePlows, initializeGoogleMaps, map, populateMap, snowAPI;

  snowAPI = 'http://dev.stadilumi.fi/api/v1/snowplow/';

  activePolylines = [];

  activeMarkers = [];

  map = null;

  initializeGoogleMaps = function(callback, time) {
    var mapOptions, styles;
    mapOptions = {
      center: new google.maps.LatLng(60.193084, 24.940338),
      zoom: 13,
      disableDefaultUI: true
    };
    styles = [
      {
        "elementType": "labels",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      }, {
        "stylers": [
          {
            "invert_lightness": true
          }, {
            "hue": "#00bbff"
          }, {
            "weight": 0.4
          }, {
            "saturation": 80
          }
        ]
      }, {
        "featureType": "road.arterial",
        "stylers": [
          {
            "color": "#00bbff"
          }, {
            "weight": 0.1
          }
        ]
      }, {
        "featureType": "administrative.locality",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      }, {
        "featureType": "administrative.neighborhood",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      }, {
        "featureType": "administrative.land_parcel",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      }
    ];
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    map.setOptions({
      styles: styles
    });
    return callback(time);
  };

  dropMapMarker = function(plowJobColor, lat, lng) {
    var marker, snowPlowMarker;
    snowPlowMarker = {
      path: "M10 10 H 90 V 90 H 10 L 10 10",
      fillColor: plowJobColor,
      strokeColor: plowJobColor,
      strokeWeight: 7,
      strokeOpacity: 0.8,
      scale: 0.01
    };
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map: map,
      icon: snowPlowMarker
    });
    activeMarkers.push(marker);
    return marker;
  };

  addMapLine = function(plowData, plowTrailColor) {
    var polyline, polylinePath;
    polylinePath = _.reduce(plowData.history, (function(accu, x) {
      accu.push(new google.maps.LatLng(x.coords[1], x.coords[0]));
      return accu;
    }), []);
    polyline = new google.maps.Polyline({
      path: polylinePath,
      geodesic: true,
      strokeColor: plowTrailColor,
      strokeWeight: 2,
      strokeOpacity: 0.5
    });
    activePolylines.push(polyline);
    return polyline.setMap(map);
  };

  clearMap = function() {
    _.each(activePolylines, function(polyline) {
      return polyline.setMap(null);
    });
    return _.each(activeMarkers, function(marker) {
      return marker.setMap(null);
    });
  };

  getActivePlows = function(time, callback) {
    var plowPositions;
    plowPositions = Bacon.fromPromise($.getJSON("" + snowAPI + "?since=" + time));
    plowPositions.onValue(function(json) {
      return callback(time, json);
    });
    return plowPositions.onError(function(error) {
      return console.error("Failed to fetch active snowplows: " + (JSON.stringify(error)));
    });
  };

  createPlowTrail = function(time, plowId, plowTrailColor) {
    var plowPositions;
    plowPositions = Bacon.fromPromise($.getJSON("" + snowAPI + plowId + "?since=" + time + "&temporal_resolution=5"));
    plowPositions.onValue(function(json) {
      return addMapLine(json, plowTrailColor);
    });
    return plowPositions.onError(function(error) {
      return console.error("Failed to create snowplow trail for plow " + plowId + ": " + error);
    });
  };

  createPlowsOnMap = function(time, json) {
    var getPlowJobColor;
    getPlowJobColor = function(job) {
      switch (job) {
        case "kv":
          return "#84ff00";
        case "au":
          return "#f2c12e";
        case "su":
          return "#d93425";
        case "hi":
          return "#ffffff";
        default:
          return "#04bfbf";
      }
    };
    return _.each(json, function(x) {
      var plowJobColor;
      plowJobColor = getPlowJobColor(x.last_loc.events[0]);
      createPlowTrail(time, x.id, plowJobColor);
      return dropMapMarker(plowJobColor, x.last_loc.coords[1], x.last_loc.coords[0]);
    });
  };

  populateMap = function(time) {
    return getActivePlows("" + time + "hours+ago", function(time, json) {
      return createPlowsOnMap(time, json);
    });
  };

  $(document).ready(function() {
    initializeGoogleMaps(populateMap, 2);
    $("#time-filters li").click(function(e) {
      e.preventDefault();
      clearMap();
      populateMap($(this).data('time'));
      $("#time-filters li").removeClass("active");
      return $(this).addClass("active");
    });
    return $("#info-close, #info-button").click(function(e) {
      e.preventDefault();
      return $("#info").toggleClass("off");
    });
  });

  console.log("%c                                                                               \n      _________                            .__                                 \n     /   _____/ ____   ______  _  ________ |  |   ______  _  ________          \n     \\_____  \\ /    \\ /  _ \\ \\/ \\/ /\\____ \\|  |  /  _ \\ \\/ \\/ /  ___/          \n     /        \\   |  (  <_> )     / |  |_> >  |_(  <_> )     /\\___ \\           \n    /_______  /___|  /\\____/ \\/\\_/  |   __/|____/\\____/ \\/\\_//____  >          \n            \\/     \\/ .__           |__|     .__  .__             \\/   .___    \n                ___  _|__| ________ _______  |  | |__|_______ ____   __| _/    \n        Sampsa  \\  \\/ /  |/  ___/  |  \\__  \\ |  | |  \\___   // __ \\ / __ |     \n        Kuronen  \\   /|  |\\___ \\|  |  // __ \\|  |_|  |/    /\\  ___// /_/ |     \n            2014  \\_/ |__/____  >____/(____  /____/__/_____ \\\\___  >____ |     \n                              \\/           \\/              \\/    \\/     \\/     \n                  https://github.com/sampsakuronen/snowplow-visualization      \n                                                                               ", 'background: #001e29; color: #00bbff');

}).call(this);
