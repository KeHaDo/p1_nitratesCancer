//----------------------------
// MAP(s) DEFINITION
//----------------------------

//MAP1
//mapbox accessToken and custom style from Geog572
var accessToken = 'pk.eyJ1Ijoia2Vkb2dyYXBoeSIsImEiOiJjazJ0a2NzZ3QxYng2M2Jxb2oxMW16azZzIn0.Wm9vlKUC3USjWsbpdQQtUQ';
var map = L.map('map', {minZoom: 6, maxZoom: 13, zoomControl: false}).setView([44.75, -90.25], 6);
map.setMaxBounds(map.getBounds());
L.control.zoom({position: 'topright'}).addTo(map);

//Add custom Into the Wild Basemap from Geog572 
var baseMap = L.tileLayer(
	'https://api.mapbox.com/styles/v1/kedography/ck2tkebdw2ffw1cqzg6s850u4/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
		attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);


//MAP2 
var map2 = L.map('map2', {minZoom: 6, maxZoom: 13, zoomControl: false}).setView([44.75, -90.25], 6);
map2.setMaxBounds(map2.getBounds());
L.control.zoom({position: 'topright'}).addTo(map2);

//Add custom Into the Wild Basemap from Geog572 
var baseMap = L.tileLayer(
	'https://api.mapbox.com/styles/v1/kedography/ck2tkebdw2ffw1cqzg6s850u4/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
		attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map2);


//MAP3
var map3 = L.map('map3', {minZoom: 6, maxZoom: 13, zoomControl: false}).setView([44.75, -90.25], 6);
map3.setMaxBounds(map3.getBounds());
L.control.zoom({position: 'topright'}).addTo(map3);

//Add custom Into the Wild Basemap from Geog572 
var baseMap = L.tileLayer(
	'https://api.mapbox.com/styles/v1/kedography/ck2tkebdw2ffw1cqzg6s850u4/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
		attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map3);

//Update Layer Control Legend
var layerControl = L.control.layers(null, null, {position: 'topleft'}).addTo(map);
var layerControl2 = L.control.layers(null, null, {position: 'topleft'}).addTo(map2);
var layerControl3 = L.control.layers(null, null, {position: 'topleft'}).addTo(map3);

//----------------------------
// GLOBAL VARIABLE DEFINITION
//----------------------------


//MAP FEATURES
//Wells
var wellPoints; 
//nitrateHexbins
var nitrateHexbins;
//CensusTracts
var censusTracts;
//collected hexbins for turf 
var collected; //= L.layerGroup();

var residualLayer;

//Choropleth legends
var legend; 
var censusHexLegend;  
var residualHexLegend;

//DEFINE MAP LAYERS 
var wellsLayer = L.geoJSON(null, null);
var censusTractsLayer = L.geoJSON(null, null);; 
var hexLayer = L.geoJSON(null, null);
var collectedHexbins = L.geoJSON(null, null);
var regHexbins = L.geoJSON(null, null);

//DEFINE LEGEND CONTROLS AND LOCATION
var legendControl = L.control({position: 'bottomleft'});
var wellHexLegendControl = L.control({position: 'bottomleft'});
var censusLegendControl = L.control({position: 'bottomleft'});
var censusHexLegendControl = L.control({position: 'bottomleft'});
var residualLegendControl = L.control({position: 'bottomleft'});

//DEFINE ARRAYS FOR DATA USED IN ANALYSIS
var interpNitratesCancers = []; 
var observedNitratesCancersArray = []; 

//DEFINE GLOBAL VARIABLES FOR VARIABLES USED IN PLOTLY
var xNitr = [];
var yObCan = []; 
var yExCan = []; 

//TEST RESIDUAL STANDARD DEVIATION 
//var stdDevRes = [];

// DOM Elements
var exponentInput = document.getElementById("exponent");
var cellSizeInput = document.getElementById("cellSize");
var interpolateButton = document.getElementById("interpolate");
var loader = document.getElementById("loader");
var interpolateButton2 = document.getElementById("interpolate2");
var loader2 = document.getElementById("loader2");
var regButton = document.getElementById("regButton");
var loader3 = document.getElementById("loader3");

//loader.hidden = true;
//loader2.hidden = true;
//loader3.hidden = true; 

//IDW DISTANCE DECAY COEFFICIENT AND HEX BIN SIZE (aka user inputs) 
var exponent = 2;
var cellSize = 20;

//CALL FUNCTION FOR DATA w AJAX
addWells(); 
addCensusTracts();

//fetch well layer from geoJSON 
function addWells() {
    $.ajax("assets/data/well_nitrate.json", {
        dataType: "json",
        success: createWellsLayer
    });
};

//fetch census tract layer from geoJSON
function addCensusTracts() {
    $.ajax("assets/data/cancer_tracts_wid.json", {
        dataType: "json",
        success: createCensusTractsLayer
    });
};

//MAP 1 
//create well layer from jQuery response 
function createWellsLayer(response, status, jqXHRobject) {
    console.log("Well layer being created...");
    wellPoints = response;
    var wellsLayer = L.geoJSON(wellPoints, {
            pointToLayer: function (feature, latlng) {
                return new L.CircleMarker(latlng, {
                    radius: 2,
                    fillOpacity: 1,
                    color: 'black',
                    fillColor: getWellColor(feature.properties.nitr_ran),
                    weight: 0,
                })
            }, 
            onEachFeature: function (feature, layer) {
                layer.bindPopup('<p><b>NO₃ (ppm):</b> '+parseFloat(feature.properties.nitr_ran).toFixed(3)+'</p>');
              },
        }).addTo(map)

    wellsLayer.bringToFront(map);
    layerControl.addOverlay(wellsLayer, "Wells");
    addWellsLegend();
    interpolateButton.disabled = false;
};

//Interpolate from WellPoints to Hexes Using Turf
function createHexes(wellPoints) {
    hexLayer.clearLayers();
    var interpShape = document.querySelector('input[name="shape"]:checked').value;
    var interpUnits = document.querySelector('input[name="units"]:checked').value;
    var options = {gridType: interpShape, property: 'nitr_ran', units: interpUnits, weight: exponent};
    nitrateHexbins = turf.interpolate(wellPoints, cellSize, options);

    hexLayer = L.geoJSON(nitrateHexbins, {
        style: hexesStyle,
        onEachFeature: function(feature, layer) {
            layer.bindPopup('<p><b>NO₃ (ppm):</b> '+parseFloat(feature.properties.nitr_ran).toFixed(3)+'</p>');
        } 
    }).addTo(map);

    layerControl.addOverlay(hexLayer, "Interpolated Wells");
    loader.hidden = true;
};

//MAP 2 
//create census tract layer from jQuery response
function createCensusTractsLayer(response, status, jqXHRobject) {
    console.log("Census Tracts layer being created...")
    censusTracts = response;
    censusTractsLayer = L.geoJSON(censusTracts, {
        style: styleCensusTracts,
        onEachFeature: function(feature, layer) {
            layer.bindPopup('<p><b>Cancer Rate:</b> '+ parseFloat(feature.properties.canrate).toFixed(3) + '%</p>');
        } 
    }).addTo(map2); 

    censusTractsLayer.bringToFront(map2)
    layerControl2.addOverlay(censusTractsLayer, "Census Tracts");
    addCensusLegend();
};

//CREATE CENTROID FOR CENSUS TRACTS AND INTERPOLATE TO HEXBINS
function censusHexbins() {
    console.log("Creating Census Tract Hexbins...")
    var censusTractsCentroids = [];
    //call response for census tracts from earlier 
    turf.featureEach(censusTracts, function(currentFeature, featureIndex){
        var centroids = turf.centroid(currentFeature);
        centroids.properties = {canrate: currentFeature.properties.canrate};
        censusTractsCentroids.push(centroids);
        //console.log(censusTractsCentroidsL);
    });

    censusTractsCentroidsTurf = turf.featureCollection(censusTractsCentroids);
    //console.log("census tract centroids: ", censusTractsCentroids);
    
    var gridOptions = {gridType: 'point', property: 'canrate', units: 'kilometers', weight: exponent};

    cancerGridPointsTurf = turf.interpolate(censusTractsCentroidsTurf, cellSize, gridOptions);

    collected = turf.collect(nitrateHexbins, cancerGridPointsTurf, 'canrate', 'values'); 
    //console.log("collected", collected);
   
    for (var i in collected.features) {

        var canrateArray = collected.features[i].properties.values; 

        var canrateArraySum = 0; 

        for (var j in canrateArray) {

            if (canrateArray.length > 0) {
                canrateArraySum += parseFloat(canrateArray[j]);
            }
        }

        var canrateArrayAvg = canrateArraySum / canrateArray.length;

        if (canrateArrayAvg !== undefined) {
            collected.features[i].properties.canrate = canrateArrayAvg;
        } else {
            collected.features[i].properties.canrate = ""; 
        } 
    }

    //CONVERT COLLECTED HEXBINS TO LEAFLET GEOJSON LAYER AND ADD TO COLLECTED HEXBINS
    collectedHexbins = L.geoJSON(collected, {
        style: hexesStyle2,
        onEachFeature: function(feature, layer) {
            layer.bindPopup('<p><b>Cancer Rate:</b> '+ parseFloat(feature.properties.canrate).toFixed(3) +'%</p>');
        } 
    }).addTo(map2);
    
    collectedHexbins.bringToFront(map2);
    layerControl2.addOverlay(collectedHexbins, "Census Hexbins");
    loader2.hidden = true; 

};

//Map 3 
//CALCULATE OLS LINEAR REGRESSION AND RESIDUALS FROM OBSERVED AND PREDICTED CANCER RATES 
function  calculateLinearRegression() {
    
    console.log("Creating Linear Regression Datasets...")
    
    for (var i in collected.features) {
        
        var fields = collected.features[i].properties;

        var interpNitrates = fields.nitr_ran;
        var interpCancers = fields.canrate;

        var workingNitratesCancers = [parseFloat(interpNitrates), parseFloat(interpCancers)];

        interpNitratesCancers.push(workingNitratesCancers);

    }

    var regEq = ss.linearRegression(interpNitratesCancers);

    //console.log("Linear Regression: ", regEq)

    //SLOPE FOR OLS 
    var m = regEq.m;

    //Y-INTERCEPT FOR OLS 
    var b = regEq.b; 

    var regEqFormat = "y = " + parseFloat(m).toFixed(5) + "x + " + parseFloat(b).toFixed(5);
    //console.log("Regression Equation: " + regEqFormat);
    
    for (var j in collected.features) {

        var collectedProperties = collected.features[j].properties;

        var collectedHexInterpNitrates = collectedProperties.nitr_ran;
        var collectedHexbinInterpCancers = collectedProperties.canrate; 

        //CALCULATE PREDICTED CANCER RATE FOR EACH HEXBIN USING OLS LINEAR REGRESSION FORMULA
        var predictedCancerRate = m * (parseFloat(collectedHexInterpNitrates)) + b;

        //CALCULATE RESIDUAL (Predicted Cancer Rate minus Observed Cancer Rate)
        var residual = (predictedCancerRate - collectedHexbinInterpCancers)*10; 

        //collected.features[j].properties.errorLevel = Math.abs(residual);
        //stdDevRes = ss.standardDeviation(residual);

        collected.features[j].properties.predictedCancerRate = predictedCancerRate;
        collected.features[j].properties.residual = residual; 
        //collected.features[j].properties.stdDevRes = stdDevRes ; 

        var observedNitratesCancersPair = [collectedHexInterpNitrates, collectedHexbinInterpCancers];

        observedNitratesCancersArray.push(observedNitratesCancersPair);

        //PUSH SELECT VALUES TO ARRAYS FOR CREATE OLS GRAPH
        xNitr.push(collectedHexInterpNitrates);
        yObCan.push(collectedHexbinInterpCancers); 
        yExCan.push(predictedCancerRate);    

        console.log(residual);

    }
    console.log('collected: ', collected);

    //CALCULATE LINEAR REGRESSION LINE USING OLS LINEAR REGRESSION EQUATION    
    var regLine = ss.linearRegressionLine(regEq);

    var rSquared = parseFloat(ss.rSquared(observedNitratesCancersArray, regLine)).toFixed(5);
    
    console.log("r-Squared: " + rSquared);
    
    //RETURN REGRESSION HEXBINS FOR MAPPING
    regHexbins = L.geoJSON(collected, { 
        style: hexesStyle3,
        onEachFeature: function(feature, layer) {
            layer.bindPopup('<p><b>NO₃ (ppm):</b> ' +parseFloat(feature.properties.nitr_ran).toFixed(3)+'<br><b>Cancer Rate:</b> ' + parseFloat(feature.properties.canrate).toFixed(3) + '%<br><b>Residual:</b> ' + parseFloat(feature.properties.residual).toFixed(3) + '</p>');
        } 
    }).addTo(map3);
    //console.log("reg hexbin test:", regHexbins);
    regHexbins.bringToFront(map3);
    layerControl3.addOverlay(regHexbins, "Regression Residuals");
    loader3.hidden = true; 

    //CREATE PLOTLY CHART
    //Observed nitrates and cancer rates by hexbins 
    var trace1 = {
        x: xNitr,
        y: yObCan,
        mode: 'markers',
        marker: {
            color: '#000000'
          },
        name: "Observed Values",
        type: 'scatter'
      };
      
      //OLS Regression Line
      var trace2 = {
        x: xNitr,
        y: yExCan,
        name: "Regression Line",
        type: 'lines',
        line: {
            color: '#d73027'
        },
      };

      var data = [trace1, trace2];
      
      var layout = {
        title: {
          text:'OLS Linear Regression',
        },
        
        xaxis: {
          title: {
            text: 'Nitrates (ppm)',
          },
        },
        
        yaxis: {
          title: {
            text: 'Cancer Rates (percentage)',
            }
          }
        }

      Plotly.newPlot('myPlot', data, layout);
    
    
}

//STYLING 
//Style the nitrate rate hexes function in Map 1
function hexesStyle(feature) {
    return {
        fillColor: getHexesColor(feature.properties.nitr_ran),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.75
    };

}

//style census tracts function for Map 2
function styleCensusTracts(feature) {
    return {
        fillColor: getCensusTractsColor(feature.properties.canrate),
        weight: 1,
        opacity: 1,
        color: '#white',
        fillOpacity: 0.75
    };
};

//style census tracts hexes function in Map 2 
function hexesStyle2(feature) {
    return {
        fillColor: getHexesColor2(feature.properties.canrate),
        weight: 1,
        opacity: 1,
        color: 'white',
        //dashArray: '3',
        fillOpacity: 0.75
    };
}

//style residual hexes function in Map 3 
function hexesStyle3(feature) {
    return {
        fillColor: getHexesColor3(feature.properties.residual),
        weight: 1,
        opacity: 1,
        color: 'white',
        //dashArray: '3',
        fillOpacity: 0.75
    };
}

//get well colors for nitr_ran values
function getWellColor(d) {
    return d > 10 ? '#252525' :
        d > 8 ? '#525252' : 
            d > 6 ? '#737373' :
                d > 4 ? '#969696' :
                    d > 2 ? '#bdbdbd' :
                        d > 0 ? '#d9d9d9' :
                            '#f7f7f7';
}

//get census tract colors for canrate values
function getCensusTractsColor(d) {
    return d > .6 ? '#252525' :
        d > .5 ? '#525252' : 
            d > .4 ? '#737373' :
                d > .3 ? '#969696' :
                    d > .2 ? '#bdbdbd' :
                        d > .1 ? '#d9d9d9' :
                            '#f7f7f7';
}

//get well colors values for nitr_ran for hexes 
function getHexesColor(d) {
    return d > 10 ? '#084594': 
    d > 8 ? '#2171b5' :
        d > 6 ? '#4292c6' :
            d > 4 ? '#6baed6' :
                d > 2 ? '#9ecae1' :
                    d > 0 ? '#c6dbef' :
                        '#eff3ff';
}

//get census tracts values for canrate for hexes
function getHexesColor2(d) {
    return d > .6 ? '#99000d': 
    d > 0.5 ? '#cb181d' :
        d > 0.4 ? '#ef3b2c' :
            d > 0.3 ? '#fb6a4a' :
                d > 0.2 ? '#fc9272' :
                    d > 0.1 ? '#fcbba1' :
                        '#fee5d9';
}

//get collected hexbin colors for residuals
function getHexesColor3(d) {
    return d > 1 ? '#d53e4f' :
        d > .75 ? '#f46d43' :
            d > .5 ? '#fdae61' :
                d > .25 ? '#fee08b' :
                    d > -.25 ? '#ffffbf' :
                        d > -0.5 ? '#e6f598' :
                            d > -0.75 ? '#abdda4' :
                                d > -1 ? '#66c2a5' :
                                    '#3288bd';
}


//ADD ALL BUTTONS AND INPUTS
//get exponent or distance decay coefficient
exponentInput.addEventListener("change", function () {
    exponent = Number(exponentInput.value);
});

//get cell size or hexagon size 
cellSizeInput.addEventListener("change", function () {
    cellSize = Number(cellSizeInput.value);
});

//interpolate button for Map 1
interpolateButton.addEventListener("click", function () {
    loader.hidden = false;
    $.ajax({
        success: function () {
            createHexes(wellPoints);
            hexLayer.addTo(map);
            //addCensusLegend(); 
            addInterpolateLegend();
            loader.hidden = true;
            //calculateButton.disabled = false;
            map2button.disabled = false; 
        }
    });
});

//interpolate button for Map 2 
interpolateButton2.addEventListener("click", function () {
    loader2.hidden = false; 
    $.ajax({
        success: function () {
            censusHexbins(censusTracts);
            collectedHexbins.addTo(map2);
            addInterpolateLegend2(); 
        }
    });
});

//regression button for Map 3 
regButton.addEventListener("click", function () {
    loader3.hidden = false; 
    $.ajax({
        success: function () {
            calculateLinearRegression(collected);
            regHexbins.addTo(map3);
            addRegressionLegend();

        }
    });
});

//LEGEND FUNCTIONS 
//create wells legend for Map 1 
function addWellsLegend() {
    legendControl.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 2, 4, 6, 8, 10],
            labels = ['<label><b>NO₃ (ppm)</b></label>'];
        div.innerHTML += labels;
        div.innerHTML += '<br>';

        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<span style="background:' + getWellColor(grades[i] + .1) + '"></span> ';
        }

        // a line break
        div.innerHTML += '<br>';

        // second loop for text
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<label>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+') + '</label>';
        }
        return div;
    };

        legendControl.addTo(map);
        legend = document.getElementsByClassName('legend')[0];
        console.log('legend testing:', legend);
    };

//create wells hexbin legend for Map 1
function addInterpolateLegend() {
    wellHexLegendControl.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'well hex legend'),
            grades = [0, 2, 4, 6, 8, 10],
            labels = ['<label><b>NO₃ (ppm)</b></label>'];
        div.innerHTML += labels;
        div.innerHTML += '<br>';
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<span style="background:' + getHexesColor(grades[i] + .1) + '"></span> ';
        }

        // a line break
        div.innerHTML += '<br>';

        // second loop for text
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<label>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+') + '</label>';
        }
        return div;
        
    };
        wellHexLegendControl.addTo(map);
        wellHexLegend = document.getElementsByClassName('legend')[1];
        console.log("well hex legend: ", legend);
    };
    
//create census tracts legend for Map 2
function addCensusLegend() {
    censusLegendControl.onAdd = function (map2) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [.1, .2, .3, .4, .5, .6],
            labels = ['<label><b>Cancer(%)</b></label>'];
        div.innerHTML += labels;
        div.innerHTML += '<br>';

        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<span style="background:' + getCensusTractsColor(grades[i] + .1) + '"></span> ';
        }

        // a line break
        div.innerHTML += '<br>';

        // second loop for text
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<label>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+') + '</label>';
                //(parseFloat(x).toFixed(2)+"%")
        }
        return div;
    };

    censusLegendControl.addTo(map2);
    legend = document.getElementsByClassName('legend')[0];
    console.log("legend two: ", legend)
};

//create census tracts hexbins legend for Map 2 
function addInterpolateLegend2() {
    censusHexLegendControl.onAdd = function (map2) {

        var div = L.DomUtil.create('div', 'census hex legend'),
            grades = [.1, .2, .3, .4, .5, .6],
            labels = ['<label><b>Cancer(%)</b></label>'];
        div.innerHTML += labels;
        div.innerHTML += '<br>';
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<span style="background:' + getHexesColor2(grades[i] + .1) + '"></span> ';
        }

        // a line break
        div.innerHTML += '<br>';

        // second loop for text
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<label>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+') + '</label>';
        }
        return div;
        
    };
        censusHexLegendControl.addTo(map2);
        censusHexLegend = document.getElementsByClassName('legend')[1];
        console.log("legend 2:", legend);
};

//create collected hexbin residual legend for Map 3
function addRegressionLegend() {
    residualLegendControl.onAdd = function (map3) {

        var div = L.DomUtil.create('div', 'residual legend'),
            grades = [-1, -0.75, -0.5, -0.25, 0.25, 0.5, 0.75, 1],
            labels = ['<label><b>Cancer(%)</b></label>'];
        div.innerHTML += labels;
        div.innerHTML += '<br>';
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<span style="background:' + getHexesColor3(grades[i] + .1) + '"></span> ';
        }

        // a line break
        div.innerHTML += '<br>';

        // second loop for text
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<label>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+') + '</label>';
        }
        return div;
        
    };
        residualLegendControl.addTo(map3);
        residualHexLegend = document.getElementsByClassName('legend')[1];
        //console.log("legend 3:", legend);
    };
