mapboxgl.accessToken = 'pk.eyJ1IjoiYm5ociIsImEiOiJjazg2MXpuaTUwZDkzM2VycTJ3Nzd1aWJhIn0.m5u8w_MFie9bNVm_sIS4nw'

$(document).ready(function() {

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [121.8733, 13.5221],
        zoom: 5,
    });

    const num_colors = ['#fdd49e', '#fdbb84', '#fc8d59', '#e34a33', '#b30000']
    const num_colorScale = d3.scaleOrdinal()
      .domain(['low', 'moderate', 'high', 'very high', 'critical'])
      .range(num_colors)

    map.addControl(
      new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl
      }),
      'bottom-right'
    );

    // Add geolocate control to the map.
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
            enableHighAccuracy: true
        },
            trackUserLocation: true
        })
    );

    //
    // map.addControl(
    //     new MapboxDirections({
    //         accessToken: mapboxgl.accessToken
    //     }),
    //     'top-right'
    // );

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
        map.addSource('municitiesDOH_point', {
            'type': 'geojson',
            // 'data': 'https://services5.arcgis.com/mnYJ21GiFTR97WFg/ArcGIS/rest/services/conf_fac_tracking/FeatureServer/0/query?where=count_%3E0&outFields=*&f=pgeojson',
            'data': 'https://services5.arcgis.com/mnYJ21GiFTR97WFg/ArcGIS/rest/services/municitycent/FeatureServer/0/query?where=count_>0&outFields=*&f=pgeojson',
            // 'data': facilities,
        });

        map.addSource('municities', {
            'type': 'geojson',
            // 'data': 'https://services5.arcgis.com/mnYJ21GiFTR97WFg/ArcGIS/rest/services/conf_fac_tracking/FeatureServer/0/query?where=count_%3E0&outFields=*&f=pgeojson',
            'data': 'data/municity_doh.geojson',
            // 'data': facilities,
        });

        map.addLayer({
            'id': 'municity',
            'type': 'fill',
            'source': 'municities',
            'layout': {
                'visibility': 'none'
            },
            'paint': {
                'fill-color': [
                    'step',
                    ['get', 'count_'],
                    num_colorScale('low'),
                    10, num_colorScale('moderate'),
                    50, num_colorScale('high'),
                    100, num_colorScale('very high'),
                    99999999999, num_colorScale('critical'),
                ],
                'fill-outline-color': [
                    'step',
                    ['get', 'count_'],
                    num_colorScale('low'),
                    10, num_colorScale('moderate'),
                    50, num_colorScale('high'),
                    100, num_colorScale('very high'),
                    99999999999, num_colorScale('critical'),
                ],
            }
        });

        map.addLayer({
            'id': 'municityDOH-heatmap',
            'type': 'heatmap',
            'source': 'municitiesDOH_point',
            'layout': {
                'visibility': 'visible',
            },
            'paint': {
                'heatmap-opacity': 0.7,
                'heatmap-radius': 15,
                'heatmap-weight': [
                    'step',
                    ['get', 'count_'],
                    1,
                    10, 4,
                    20, 6,
                    30, 8,
                    99999999999, 10,
                ],
                'heatmap-color': ["interpolate",["linear"],["heatmap-density"],0,'rgba(0,0,0,0)',0.2,num_colorScale('low'),0.4,num_colorScale('moderate'),0.6,num_colorScale('high'),0.8,num_colorScale('very high'),1.0,num_colorScale('critical')]
            }
        });

        map.addLayer({
            'id': 'municityDOH-points',
            'type': 'circle',
            'source': 'municitiesDOH_point',
            'layout': {
                'visibility': 'none'
            },
            'paint': {
                'circle-color': [
                    'step',
                    ['get', 'count_'],
                    num_colorScale('low'),
                    10, num_colorScale('moderate'),
                    50, num_colorScale('high'),
                    100, num_colorScale('very high'),
                    99999999999, num_colorScale('critical'),
                ],
                'circle-stroke-color': [
                    'step',
                    ['get', 'count_'],
                    num_colorScale('low'),
                    10, num_colorScale('moderate'),
                    50, num_colorScale('high'),
                    100, num_colorScale('very high'),
                    99999999999, num_colorScale('critical'),
                ],
                'circle-radius': 6,
                // 'circle-radius': [
                //     'step',
                //     ['get', 'count_'],
                //     5,
                //     30, 10,
                //     75, 15,
                //     100, 20,
                //     99999999999, 30,
                // ],
                'circle-opacity': 0.75,
                'circle-stroke-opacity': 0.90,
            }
        });

        map.on('click', 'municity', function(e) {
            // showPopup(e.features[0])
            var popUps = document.getElementsByClassName('mapboxgl-popup');
            /** Check if there is already a popup on the map and if so, remove it */
            if (popUps[0]) popUps[0].remove();

            var coordinates = e.lngLat;
            var municity = e.features[0].properties.ADM3_EN;
            var province = e.features[0].properties.ADM2_EN;
            var region = e.features[0].properties.ADM1_EN.toUpperCase();
            var covid_cases = e.features[0].properties.count_;

            var popup = `<h6 class='pt-2 pb-1' style='border-bottom: 0.5px solid #00853e; color: #00853e'>${municity}, ${province}<br>${region}</h6><p>Confirmed Cases: ${covid_cases}</p>`

            new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popup)
            .addTo(map);
        });

        map.on('click', 'municityDOH-points', function(e) {
            showPopup(e.features[0])
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'municity', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'municity', function() {
            map.getCanvas().style.cursor = '';
        });

    buildLGUList();

    })

    map.resize();

    function showPopup(feature){
        var popUps = document.getElementsByClassName('mapboxgl-popup');
        /** Check if there is already a popup on the map and if so, remove it */
        if (popUps[0]) popUps[0].remove();
        var coordinates = feature.geometry.coordinates.slice();
        var municity = feature.properties.ADM3_EN;
        var province = feature.properties.ADM2_EN;
        var region = feature.properties.ADM1_EN.toUpperCase();
        var covid_cases = feature.properties.count_;

        var popup = `<h6 class='pt-2 pb-1' style='border-bottom: 0.5px solid #00853e; color: #00853e'>${municity}, ${province}<br>${region}</h6><p>Confirmed Cases: ${covid_cases}</p>`

        new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popup)
        .addTo(map);
    }

    function buildLGUList() {
        $.getJSON('https://services5.arcgis.com/mnYJ21GiFTR97WFg/ArcGIS/rest/services/municitycent/FeatureServer/0/query?where=count_>0&orderByFields=count_+DESC&outFields=*&f=pgeojson', function(municities) {
            var count = 0;
            municities.features.forEach(function(municity, i){
                var prop = municity.properties;
                count = count + parseInt(prop.count_)

                /* Add a new listing section to the sidebar. */
                var listings = document.getElementById('listings');
                var listing = listings.appendChild(document.createElement('div'));
                /* Assign a unique `id` to the listing. */
                listing.id = 'listing-' + prop.FID;
                /* Assign the `item` class to each listing for styling. */
                listing.className = 'item';

                /* Add the link to the individual listing created above. */
                var link = listing.appendChild(document.createElement('a'));
                link.href = '#';
                link.className = 'title';
                link.id = 'link-' + prop.FID;
                link.innerHTML = `${prop.ADM3_EN}, ${prop.ADM2_EN}, ${prop.ADM1_EN.toUpperCase()}`;
                //
                link.addEventListener('click', function(e) {
                    // console.log(this.id)
                    for (var i = 0; i < municities.features.length; i++) {
                      if (this.id === 'link-' + municities.features[i].properties.FID) {
                        var clickedListing = municities.features[i];
                        flyToFacility(clickedListing);
                        showPopup(clickedListing);
                      }
                    }
                        var activeItem = document.getElementsByClassName('active');
                        if (activeItem[0]) {
                        activeItem[0].classList.remove('active');
                        }
                    this.parentNode.classList.add('active');
                });

                /* Add details to the individual listing. */
                var details = listing.appendChild(document.createElement('div'));
                details.innerHTML = `Cases: ${prop.count_}`;
            });
            var withLocation = document.getElementById('forVal');
            withLocation.innerHTML = count;
        });
    }

    function flyToFacility(currentFeature) {
        map.flyTo({
            center: currentFeature.geometry.coordinates,
            zoom: 15
        });
    }

    function getComp(e) {
        if (['==', '<', '>', '<=', '>='].includes(e)) {
            return e;
        } else {
            return '<=';
        }
    };

    var filterBtn = document.getElementById('filter-btn');
    var resetMapBtn = document.getElementById('resetMap');
    var pointsBtn = document.getElementById('pointsBtn');
    var heatmapBtn = document.getElementById('heatmapBtn');
    var clearBtn = document.getElementById('clear-btn');

    filterBtn.onclick = function() {
        var num = Number(document.getElementById('num-text').value);
        var comp = getComp(document.getElementById('comp-text').value);
        if (num && comp){
            map.setFilter('municity', ['all', [comp, 'count_', num]]);
            map.setFilter('municityDOH-points', ['all', [comp, 'count_', num]]);
            map.setFilter('municityDOH-heatmap', ['all', [comp, 'count_', num]]);
            // map.setFilter('facility_cluster', ['all', [comp, ['get', 'point_count'], num], ['has', 'point_count']]);
            // map.setFilter('facility_cluster_count', ['all', [comp, ['get', 'point_count'], num], ['has', 'point_count']]);
        } else {
            map.setFilter('municity', null);
            map.setFilter('municityDOH-points', null);
            map.setFilter('municityDOH-heatmap', null);
            // map.setFilter('facility_cluster', ['has', 'point_count']);
            // map.setFilter('facility_cluster_count', ['has', 'point_count']);
        }
    };

    clearBtn.onclick = function() {
        document.getElementById('num-text').value = '';
        document.getElementById('comp-text').value = '';

        map.setFilter('municity', null);
        map.setFilter('municityDOH-points', null);
        map.setFilter('municityDOH-heatmap', null);
        // map.setFilter('facility_cluster', ['has', 'point_count']);
        // map.setFilter('facility_cluster_count', ['has', 'point_count']);
    };

    resetMapBtn.onclick = function() {
        map.flyTo({
            center: [121.8733, 13.5221],
            zoom: 5,
        });
    }

    pointsBtn.onclick = function() {
        var pointsVisibility = map.getLayoutProperty('municityDOH-points', 'visibility')
        var heatmapVisibility = map.getLayoutProperty('municityDOH-heatmap', 'visibility')
        if (pointsVisibility === 'visible') {
            map.setLayoutProperty('municityDOH-points', 'visibility', 'none');
            if (heatmapVisibility === 'none') {
                map.setLayoutProperty('municityDOH-heatmap', 'visibility', 'visible');
            }
            $('#pointsBtn').removeClass('bg-success');
            $('#heatmapBtn').addClass('bg-success');
        } else {
            $('#pointsBtn').addClass('bg-success');
            $('#heatmapBtn').removeClass('bg-success');
            map.setLayoutProperty('municityDOH-points', 'visibility', 'visible');
            if (heatmapVisibility === 'visible') {
                map.setLayoutProperty('municityDOH-heatmap', 'visibility', 'none');
            }
        }
    }

    heatmapBtn.onclick = function() {
        var pointsVisibility = map.getLayoutProperty('municityDOH-points', 'visibility')
        var heatmapVisibility = map.getLayoutProperty('municityDOH-heatmap', 'visibility')
        if (pointsVisibility === 'visible') {
            map.setLayoutProperty('municityDOH-points', 'visibility', 'none');
            if (heatmapVisibility === 'none') {
                map.setLayoutProperty('municityDOH-heatmap', 'visibility', 'visible');
            }
            $('#pointsBtn').removeClass('bg-success');
            $('#heatmapBtn').addClass('bg-success');
        } else {
            $('#pointsBtn').addClass('bg-success');
            $('#heatmapBtn').removeClass('bg-success');
            map.setLayoutProperty('municityDOH-points', 'visibility', 'visible');
            if (heatmapVisibility === 'visible') {
                map.setLayoutProperty('municityDOH-heatmap', 'visibility', 'none');
            }
        }
    }


});
