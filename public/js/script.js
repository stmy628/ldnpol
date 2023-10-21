var directionsDisplay = new google.maps.DirectionsRenderer(),
    directionsService = new google.maps.DirectionsService(),
    polys = new Array(),
    map = null,
    zoom = 10;

// Function to draw a GeoJSON polygon
function drawGeoJSONPolygon(geoJSONFeature) {
    console.log('drawGeoJSONPolygon...');

    var options = {
        paths: geoJSONFeature.geometry.coordinates[0].map(coord => ({
            lat: coord[1],
            lng: coord[0]
        })),
        strokeColor: '#AA2143',
        strokeOpacity: 0,
        strokeWeight: 0,
        fillColor: "#FF6600",
        fillOpacity: 0.0,
        polyTitle: geoJSONFeature.properties.LSOA11NM
    };

    var newPoly = new google.maps.Polygon(options);
    newPoly.set("risk",geoJSONFeature.properties.Risk);
    newPoly.setMap(map);
    polys.push(newPoly);
    console.log('polys length: ' + polys.length);
}

// Function to read GeoJSON and draw polygons
function sendGeoJSONForDrawing(geoJSONData) {
    console.log('sendGeoJSONForDrawing...');

    geoJSONData.features.forEach(function (feature) {
        drawGeoJSONPolygon(feature);
    });
}

// Fetch GeoJSON data from a file
function fetchGeoJSONFile(filePath) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            sendGeoJSONForDrawing(data);
        })
        .catch(error => console.error('Error fetching GeoJSON:', error));
}

// Initialize the map and draw GeoJSON polygons
function initializeMap() {
    // Basic map options
    var cartodbMapOptions = {
        zoom: zoom,
        center: new google.maps.LatLng(51.465872, -0.065918),
        disableDefaultUI: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    // Initialize the map
    map = new google.maps.Map(document.getElementById("map"), cartodbMapOptions);


    // Fetch and draw GeoJSON polygons
    fetchGeoJSONFile("../data/final_lsoa.geojson");
    new AutocompleteDirectionsHandler(map);
}

class AutocompleteDirectionsHandler {
    map;
    originPlaceId;
    destinationPlaceId;
    travelMode;
    directionsService;
    directionsRenderer;
    constructor(map) {
      this.map = map;
      this.originPlaceId = "";
      this.destinationPlaceId = "";
      this.travelMode = google.maps.TravelMode.WALKING;
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(map);
  
      const originInput = document.getElementById("origin-input");
      const destinationInput = document.getElementById("destination-input");
      // Specify just the place data fields that you need.
      const originAutocomplete = new google.maps.places.Autocomplete(
        originInput,
        { fields: ["place_id"] },
      );
      // Specify just the place data fields that you need.
      const destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput,
        { fields: ["place_id"] },
      );
  
      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
      this.setupPlaceChangedListener(destinationAutocomplete, "DEST");
      this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
      this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(
        destinationInput,
      );
    }
    // Sets a listener on a radio button to change the filter type on Places
    // Autocomplete.
    setupPlaceChangedListener(autocomplete, mode) {
      autocomplete.bindTo("bounds", this.map);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
  
        if (!place.place_id) {
          window.alert("Please select an option from the dropdown list.");
          return;
        }
  
        if (mode === "ORIG") {
          this.originPlaceId = place.place_id;
        } else {
          this.destinationPlaceId = place.place_id;
        }
  
        this.route();
      });
    }
    route() {
      if (!this.originPlaceId || !this.destinationPlaceId) {
        return;
      }
  
      const me = this;
  
      this.directionsService.route(
        {
          origin: { placeId: this.originPlaceId },
          destination: { placeId: this.destinationPlaceId },
          travelMode: this.travelMode,
        },
        (response, status) => {
          if (status === "OK") {
            me.directionsRenderer.setDirections(response);
            console.log(response);
            
            var routCoordinates = fncRouteZoneIntersection(response);//this function populates the routCoordinates with the JSON data of the route.
            var exist = new Array();
            
            for (var i = 0; i < polys.length; i++) {//polys holds all polygons objects.
                for (var j = 0; j < routCoordinates.length; j++){
                    // console.log(routCoordinates[j]);
//                    if (google.maps.geometry.poly.containsLocation(new google.maps.LatLng(routCoordinates[j].k, routCoordinates[j].A), polys[i]) == true){
                    var polyi = polys[i];
                    var risk = polys[i].get("risk");
                    if (google.maps.geometry.poly.containsLocation(routCoordinates[j], polyi) == true &&(risk =="Very dangerous")){
                        exist.push(polys[i].polyTitle);
                        var marker = new google.maps.Marker({
                            map: map,
                            label: "!",
                //            position: myRoute.steps[i].start_point
                            position: routCoordinates[j]
                        })
                        break;
                        /*this breaks the loop checking when a point is found inside a polygon 
                    and go check the next one, because knowing that one point of the route is 
                    inside a polygon is enough*/
                    }
                }
            }
            
            console.log(exist);
            //alert(exist);
            
          } else {
            window.alert("Directions request failed due to " + status);
          }
        },
      );
    }
  }


function fncRouteZoneIntersection(response) {
    console.log('fncRouteZoneIntersection...');
    
//    var myRoute = response.routes[0].legs[1];
    var myRoute = response.routes[0].overview_path;
    var lngLatCordinates = new Array();
//    for (var i = 0; i < myRoute.steps.length; i++) {
    for (var i = 0; i < myRoute.length; i++) {
        /*
        var marker = new google.maps.Marker({
            map: map,
//            position: myRoute.steps[i].start_point
            position: myRoute[i]
        });
        */
//        lngLatCordinates.push(myRoute.steps[i].start_point);
        lngLatCordinates.push(myRoute[i]);
    }
    // console.log(lngLatCordinates);
    return lngLatCordinates;
}

$(function() {
    //Basic
    var cartodbMapOptions = {
        zoom: zoom,
        center: new google.maps.LatLng(51.465872, -0.065918),
        disableDefaultUI: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    // Init the map
    map = new google.maps.Map(document.getElementById("map"),cartodbMapOptions);
    // Call the initialization function
    initializeMap();
    //sendGeoJSONForDrawing();
    //calcRoute();

    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: false,
        polygonOptions: {
            fillColor: '#0099FF',
            fillOpacity: 0.7,
            strokeColor: '#AA2143',
            strokeWeight: 2,
            clickable: true,
            zIndex: 1,
            editable: true
        }
    });
});
