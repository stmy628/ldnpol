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
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: "#FF6600",
        fillOpacity: 0.7,
        polyTitle: geoJSONFeature.properties.LSOA11NM
    };

    var newPoly = new google.maps.Polygon(options);
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
}


  
//Route
function calcRoute() {
    console.log('calcRoute...');
    
    var start = "Croydon";
    var end = "Cheshunt";
    var waypts = [];
    var waysArray = ["London"];
    
    for (var i = 0; i < waysArray.length; i++) {
        waypts.push({
            location: waysArray[i],
            stopover:true
        });
    }
    console.log('waypoints:');
    console.log(waypts);
    
    var request = {
        origin: start,
        destination: end,
        waypoints: waypts,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            console.log(response);
            
            var routCoordinates = fncRouteZoneIntersection(response);//this function populates the routCoordinates with the JSON data of the route.
            var exist = new Array();
            
            for (var i = 0; i < polys.length; i++) {//polys holds all polygons objects.
                for (var j = 0; j < routCoordinates.length; j++){
                    // console.log(routCoordinates[j]);
//                    if (google.maps.geometry.poly.containsLocation(new google.maps.LatLng(routCoordinates[j].k, routCoordinates[j].A), polys[i]) == true){
                    if (google.maps.geometry.poly.containsLocation(routCoordinates[j], polys[i]) == true){
                        console.log('inside!');
                        exist.push(polys[i].polyTitle);
                        break;
                        /*this breaks the loop checking when a point is found inside a polygon 
                    and go check the next one, because knowing that one point of the route is 
                    inside a polygon is enough*/
                    }
                }
            }
            
            console.log(exist);
            //alert(exist);
        }
    });

    directionsDisplay.setMap(map); 
}

function fncRouteZoneIntersection(response) {
    console.log('fncRouteZoneIntersection...');
    
//    var myRoute = response.routes[0].legs[1];
    var myRoute = response.routes[0].overview_path;
    var lngLatCordinates = new Array();
//    for (var i = 0; i < myRoute.steps.length; i++) {
    for (var i = 0; i < myRoute.length; i++) {
        var marker = new google.maps.Marker({
            map: map,
//            position: myRoute.steps[i].start_point
            position: myRoute[i]
        });
        
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
    calcRoute();

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
