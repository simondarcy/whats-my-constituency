/**
 * Whats My Constituency JS
 */


//Defaults
var constituencies = [];
var map, marker, geocoder;
var initialPosition = {lat: 53.3478, lng: -6.2597};

//using address
function geocodeAddress(geocoder, resultsMap) {
    //Get user inputted address
    var address = document.getElementById('address').value;

    //use Google GeoCode
    geocoder.geocode({'address': address, 'componentRestrictions':{'country':'IE'}}, function(results, status) {

        //If results returned from GEO
        if (status === google.maps.GeocoderStatus.OK) {

            if (results.length > 1){
                //list out all results found
                alert('Too many results, try narrow search by entering town, county');

                //list options for user
                $.each(results, function(key, result){
                    console.log(result.formatted_address);
                });

                return;
            }

            //update mapp to new position
            resultsMap.setCenter(results[0].geometry.location);
            marker.setOptions({position:results[0].geometry.location});

            searchConstituencies(results[0].geometry.location);

        } else {
            //no results found
            alert('Could not find address. Reason: ' + status);
        }


    });
}


function searchConstituencies(location){
    //loop through constituencies and check if address is within constituency boundaries
    $.each( constituencies, function( key, constituency ) {

        if ( google.maps.geometry.poly.containsLocation(location, constituency) ){
            //update UI
            $('#result').html('Your constituency is:<br/> '+ constituency.title).fadeIn( 1000, function() {});
            //show boundary
            constituency.setOptions({visible:true});
            $('#map').css('opacity', '100');
        }
    })
}

//reset UI
function resetMap(){
    $('#result').hide();
    $('#map').css('opacity', '0');
    //hide polygon layers
    $.each( constituencies, function( key, constituency ) {
        constituency.setOptions({visible:false});
    });

}

//function to convert topo arc array to googlemaps oy Array
function createPolyArray(arr){
    poly = [];
    $.each(arr, function(key, latLng){
        obj = {};
        obj.lat = latLng[1];
        obj.lng = latLng[0];
        poly.push(obj);

    });
    return poly;
}

//function to add constituency to map
function createConstituency (polyPath, name){
    var opts = {paths: polyPath,strokeColor: '#27D683',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#27D683',
        fillOpacity: 0.3,
        visible:false};
    polygon = new google.maps.Polygon(opts);
    polygon.title = name;
    polygon.setMap(map);
    constituencies.push(polygon);
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
            var loc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            searchConstituencies(loc);
        });
    } else {
        alert("Could not retrieve location, please use search");
    }
}


//init map, called from googlemaps callback
function initMap() {
    //create map
    map = new google.maps.Map(document.getElementById('map'), {
        center: initialPosition,
        zoom: 8});

    //add initial marker
    marker = new google.maps.Marker({
        map: map,
        position: initialPosition
    });

    //get Jimmy's JSON
    $.getJSON( "topo.json", function( data ) {

        //convert JSON to topo feature
        geoJsonObject = topojson.feature(data, data.objects.census2011_constituencies_2013);

        //loop through each feature
        $.each( geoJsonObject.features, function( key, constituency ) {

            //create map poly overlays using createPolyArray();
            if(constituency.geometry.type == "MultiPolygon"){
                //create multiple polygons
                $.each(constituency.geometry.coordinates, function(key, arr) {
                    polyPath = createPolyArray(arr[0]);
                    createConstituency(polyPath, constituency.properties.name);
                });

            }else{
                //only single poly required
                polyPath = createPolyArray(constituency.geometry.coordinates[0]);
                createConstituency(polyPath, constituency.properties.name);
            }

        });//end map creation

    });//end json call

    //init geocoder
    geocoder = new google.maps.Geocoder();

}//end init map




$( document ).ready(function() {

    //UI elements
    document.getElementById('submit').addEventListener('click', function() {
        resetMap();
        geocodeAddress(geocoder, map);
    });

    document.getElementById('submitbyloc').addEventListener('click', function() {
        getLocation();
    });

    document.getElementById('address').addEventListener('keypress', function(e) {
        if (e.which == 13) {
            resetMap();
            geocodeAddress(geocoder, map);
            return false;
        }
    });
});
