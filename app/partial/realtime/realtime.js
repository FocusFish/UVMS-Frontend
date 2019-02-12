/*
Developed with the contribution of the European Commission - Directorate General for Maritime Affairs and Fisheries
© European Union, 2015-2016.

This file is part of the Integrated Fisheries Data Management (IFDM) Suite. The IFDM Suite is free software: you can
redistribute it and/or modify it under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or any later version. The IFDM Suite is distributed in
the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details. You should have received a
copy of the GNU General Public License along with the IFDM Suite. If not, see <http://www.gnu.org/licenses/>.

 */
angular.module('unionvmsWeb').controller('RealtimeCtrl', function(
    $rootScope,
    $scope,
    loadingStatus,
    $window,
    $interval,
    genericMapService,
    realtimeMapService,
    defaultMapConfigs,
    projectionService,
    $log,
    $mdSidenav,
    $localStorage,
    microMovementRestService,
    movementRestService,
    vesselRestService,
    dateTimeService,
    microMovementServerSideEventsService,
    mapService,
    PopupModal,
    ZoomModal,
    zoomService
    ) {

    var MAX_MOVEMENTS_IN_CACHE = 20000;
    var MAX_TIME_FOR_MOVEMENT_IN_CACHE_MS = 18000000;   // 5 hours
    var CHECK_TIME_FOR_MOVEMENT_IN_CACHE_INTERVAL_MS = 900000;  // 15 min
    var HIT_TOLERANCE = 10;

    var vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        renderBuffer: 200
    });

    var infoSource = new ol.source.Vector();
    var infoLayer = new ol.layer.Vector({
        source: infoSource,
        renderBuffer: 200
    });

    let hoveredTrack = null;

    var init = function() {
        angular.extend($scope, {
            center: {
                lat: 0,
                lng: 0,
                zoom: 8
            }
        });

        // hide the top bar
        $(document.getElementsByClassName("headercontainer")).hide();

        $($window).resize($scope.updateContainerSize);


        angular.element(document).ready(function () {
            // TODO: Look into controllers loading twice on refresh in app.js ui-router
            // ugly hack to prevent double loading on refresh.
            if ($rootScope.realtimeLoaded) {
                return;
            }
            else {
                $rootScope.realtimeLoaded = true;
            }

            document.addEventListener('keyup', function(e) {

                var zoomIndex = parseInt(e.key) ;
                if (zoomIndex !== undefined && zoomIndex >= 0 && zoomIndex <= 5) {
                    zoomService.saveZoomLevel(zoomIndex - 1);
                }
            });


            loadingStatus.isLoading('Realtime', true, 0);
            genericMapService.setMapBasicConfigs();
            projectionService.getProjections();

            $($window).resize($scope.updateContainerSize);

            $scope.updateContainerSize();

            initLocalCaches();

            $scope.initInterval = $interval(function () {
                if (!_.isEqual(genericMapService.mapBasicConfigs, {})) {
                    $scope.stopInitInterval();
                    realtimeMapService.setMap();

                    initMap();
                    // get the positions

/*
                    $scope.getPositions().then((positionsByAsset) => {
                        let i = 0;
                        // Todo: change to for loop to make faster
                        Object.values(positionsByAsset).forEach(positions => {
                            if (positions.map !== undefined) {
                                //console.log('drawing vessel (positions):', i);
                                drawVesselWithSegments(positions[0].asset, positions, true);
                            }

                            i++;
                        });

                    }).catch(error => {
                        console.error('Failed to get positions:', error);
                    });

                    // draw cached realtime positions

                    drawCachedRealtimeFeatures();
*/
                    // initialize server side event
                    if (!microMovementServerSideEventsService.hasSubscribed()) {
                        microMovementServerSideEventsService.subscribe();
                    }


                    // load all zoom levels stored in cache
                    zoomService.loadAllZoomLevels();
                }
            }, 10);
        });


        let clearRealTimeMapDataCache = $interval(function () {
            clearCacheRealTimeFeatures();
        }, CHECK_TIME_FOR_MOVEMENT_IN_CACHE_INTERVAL_MS);



    };



    // Listen to the changes of micromovement changes
    var micromovementEvent = $rootScope.$on('event:micromovement', (e, data) => {
        let microMovement = JSON.parse(data);
        //processRealtimeData(microMovement.asset, microMovement.guid, microMovement);

        drawVesselWithSegments(microMovement.asset, [microMovement], false, true);
    });


    var trackEvent = $rootScope.$on('event:micromovement:track', (e, result) => {
        //drawVesselWithSegments(microMovement.asset, [microMovement], true, false);
        let color = '#' + intToRGB(hashCode(result.data.position.asset));
        drawTrack(result, color);
    });


    var removeTrackEvent = $rootScope.$on('event:track:remove', (e, result) => {
        removeFeature('trackId_' + result);
        removeFeature('futurePos_0_' + result);
        removeFeature('futurePos_1_' + result);
    });

    $scope.$on('$destroy', function () {
        micromovementEvent();
        trackEvent();
        removeTrackEvent();
    });

    $scope.processRealtimeData = function(assetGuid, movementGuid, movementData) {
        let posExists = false;
        let assetExists = $scope.doesAssetExistInRealtimeDataCache(assetGuid);

        if (assetExists) {
            let values = $localStorage['realtimeMapData'][assetGuid];
            posExists = $scope.doesPositionExistInCache(values, movementGuid);
        }

        if (!assetExists ) {
            $localStorage['realtimeMapData'][assetGuid] = [];
        }
        if (!posExists) {
            $localStorage['realtimeMapData'][assetGuid].push(movementData);
        }
    };

    $scope.doesAssetExistInRealtimeDataCache = function (assetGuid) {
        let exists = false;
        for (let key in $localStorage['realtimeMapData']) {
            if (key === assetGuid){
                exists = true;
                break;
            }
        }
        return exists;
    };

    $scope.doesPositionExistInCache = function (values, microMovementGuid) {
        let exists = false;
        Object.values(values).forEach(v => {
            if (v.guid === microMovementGuid) {
                exists = true;
                return;
            }
        });
        return exists;
    };


    // todo: move to own class
    var deg2rad = function(degrees) {
        return Math.sin(degrees * Math.PI / 180);
    };

    function radToDeg(rad) {
        return (180.0 * (rad / Math.PI));
    }


    // todo: move to own class
    var createStyle = function(styleType, fillColor, strokeColor) {
        let style = null;

        switch (styleType) {
            case 'circle':
                style = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({color: fillColor}),
                        stroke: new ol.style.Stroke({
                            color: strokeColor, width: 2
                        }),
                        radius: 2,
                    })
                });
            break;
            case 'line':
                style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: fillColor,
                        width: 1
                    })
                });
            break;
            case 'triangle':
                style = new ol.style.Style({
                    image: new ol.style.RegularShape({
                        fill: new ol.style.Fill({
                            color: fillColor
                        }),
                        stroke: new ol.style.Stroke({
                            color: strokeColor,
                            width: 1
                        }),
                        points: 3,
                        radius: 10,
                        rotation: 0,
                        angle: 0
                    })
                });
            break;
            case 'track1':
                style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: strokeColor,
                        width: 2,
                        lineDash: [4,8],
                        lineDashOffset: 6

                    })
                });
            break;
            case 'track2':
                style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: strokeColor,
                        width: 2,
                        lineDash: [4,8],

                    })
                });
                break;
            case 'highlightTrack':
                style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: strokeColor,
                        width: 8,
                        lineDash: [2,4],

                    })
                });
                break;
            case 'arrow':
                style = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: './assets/images/arrow.png',
                        anchor: [0.5, 0.5],
                        rotateWithView: true,
                        color: fillColor
                    })
                });
            break;
        }
        if (style == null) {
            $log.error('Style type ' + style + '  not supported.');
        }
        return style;
    };

    $scope.updateContainerSize = function (evt) {
        setTimeout(function () {

            var w = angular.element(window);
            if (evt && (angular.element('#realtime.fullscreen').length > 0 ||
                (angular.element('#realtime.fullscreen').length === 0 && evt.type.toUpperCase().indexOf("FULLSCREENCHANGE") !== -1))) {

                $('#realtime').css('height', w.height() - 1 + 'px');
                $('#realtimeMap').css('height', w.height() - 1 + 'px');
                realtimeMapService.updateMapSize();
                return;
            }

            var minHeight = 400;
            var headerHeight = angular.element('header')[0].offsetHeight;
            var newHeight = w.height() - headerHeight;

            if (newHeight < minHeight) {
                newHeight = minHeight;
            }


            $('#realtime').css('height', newHeight - 1 + 'px');
            $('#realtimeMap').css('height', newHeight - 1 + 'px');
            realtimeMapService.updateMapSize();
        }, 100);

    };

    $scope.stopInitInterval = function () {
        $interval.cancel($scope.initInterval);
        $scope.initInterval = undefined;
        loadingStatus.isLoading('Realtime', false);
    };


    var initMap = function() {

        $scope.styles = {
            iconStyle: new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: './assets/images/close.png'
                }),
                text: new ol.style.Text({
                    font: '12px Calibri,sans-serif',
                    fill: new ol.style.Fill({color: '#000'}),
                    stroke: new ol.style.Stroke({
                        color: '#fff', width: 2
                    }),
                    text: 'Some text'
                }),
            }),
            square: new ol.style.Style({
                image: new ol.style.RegularShape({
                    fill: new ol.style.Fill({color: '#000'}),
                    stroke: new ol.style.Stroke({
                        color: '#fff', width: 2
                    }),
                    points: 4,
                    radius: 10,
                    angle: Math.PI / 4
                })
            }),
            circle: new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({color: '#000'}),
                    stroke: new ol.style.Stroke({
                        color: '#fff', width: 2
                    }),
                    radius: 5,
                })
            }),
            triangle: new ol.style.Style({
                image: new ol.style.RegularShape({
                    fill: new ol.style.Fill({
                        color: 'red'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'black',
                        width: 2
                    }),
                    points: 3,
                    radius: 10,
                    rotation: 0,
                    angle: 0
                })
            }),
            line: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                })
            }),
            arrow: new ol.style.Style({
                image: new ol.style.Icon({
                    src: './assets/images/arrow.png',
                    anchor: [0.75, 0.5],
                    rotateWithView: true
                })
            })
        };

        $scope.getMap().on('singleclick', function(e){
            var map = $scope.getMap();
            // Attempt to find a feature in one of the visible vector layers
            var features = [];
            map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
                if (layer === vectorLayer) {
                    features.push(feature);
                }
            }, {
                hitTolerance: HIT_TOLERANCE
            }, function(layer) {
                return layer === vectorLayer;
            });

            if (features.length > 0) {
                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];
                    if (feature) {
                        $scope.onMarkerClick(feature);
                        break;
                    }
                }

            }

        });
        $scope.getMap().on('pointermove', function(e) {
            var map = $scope.getMap();
            // Attempt to find a feature in one of the visible vector layers
            var features = [];
            map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
                if (layer === vectorLayer) {
                    features.push(feature);
                }
            }, {
                hitTolerance: HIT_TOLERANCE
            }, function(layer) {
                return layer === vectorLayer;
            });

            if (features.length > 0) {
                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];
                    // check for tracks
                    if (feature && feature.getId().indexOf('track' > - 1)) {
                        $scope.onTrackHover(feature);
                        break;
                    }
                }

            }
        });


        $scope.getMap().getView().on('change:resolution', function (e) {

            if ($scope.getMap().getView().getZoom() > 10) {
                infoLayer.setVisible(true);
            }
            else {
                infoLayer.setVisible(false);
            }
        });


        $scope.getMap().addLayer(vectorLayer);
        // Add flag and vessel info layer
        $scope.getMap().addLayer(infoLayer);
        infoLayer.setVisible(false);
    };



    var drawVesselWithSegments = function(asset, positions, shouldDrawSegment, checkCache) {
        let pos = positions[positions.length - 1];
        // draw segments from positions of the boat
        let color = '#' + intToRGB(hashCode(pos.asset));
        if (shouldDrawSegment) {
            drawSegment(positions, color);
        }

        // draw vessel on top of segments (segments on a seperate layer)        

        addMarker(pos, deg2rad(pos.heading), color, checkCache);
    };

    // Draws a polyline based on positions, takes an array of positions [lat, long]
    var drawSegment = function(positions, c) {
        var prevFeature;
        var feature;
        var positionData = [];
        try {

            var count = 0;
            positions.map(p => {
                feature = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat( [ p.location.longitude, p.location.latitude])));

                var style = createStyle('circle', c, 'white');
                feature.setStyle(style);
                //vectorSource.addFeature(feature);

                if (!angular.isDefined(positionData[p.asset])) {
                    positionData[p.asset] = [];
                }
                positionData[p.asset].push([p.location.longitude, p.location.latitude]);
                prevFeature = feature;
                count++;
            });


            // Add lines
        Object.entries(positionData).forEach(p => {

            var geom = new ol.geom.MultiLineString([p[1]]);
            geom.transform('EPSG:4326', 'EPSG:3857');
            console.log(geom);
            var featureLine = new ol.Feature({
                geometry: geom
            });
            var style = createStyle('line', c, c);

            featureLine.setStyle(style);
            vectorSource.addFeature(featureLine);

        });
        } catch (error) {
            console.log(error);
            console.log('prevFeature:', prevFeature);
            console.log('feature:', feature);
        }
    };

    $scope.toFixed = function(number, decimals) {
        return parseFloat(number.toFixed(decimals));
    };

    $scope.getTextStyle = function(text, colorFill, colorStroke, strokeWidth, offsetX, offsetY) {
        return new ol.style.Text({
            font: '12px Calibri,sans-serif',
            fill: new ol.style.Fill({color: colorFill}),
            stroke: new ol.style.Stroke({
                color: colorStroke, width: strokeWidth
            }),
            offsetX: offsetX,
            offsetY: offsetY,
            text: text
        });
    };

    var addMarker = function(pos, angle, c, checkCache) {

        // use asset id instead of position id for no caching of asset, update if exists instead of adding a new feature to the map.
        let posArray = [pos.location.latitude, pos.location.longitude];
        let feature = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat( [ posArray[1], posArray[0]])));

        let cachedFeature = vectorSource.getFeatureById(pos.asset);

        if (cachedFeature !== null && cachedFeature !== undefined) {
            cachedFeature['pos'] = pos;

            cachedFeature.setGeometry(feature.getGeometry());
            cachedFeature.getStyle().getImage().setRotation(angle);
        }
        else {

            // Add text to style
            // Don't add text for now. takes too much space
            //style.setText(getTextStyle(pos.asset, 'black', 'white', 2, 0, -24));
            let style = createStyle('triangle', c, 'white');
            feature['pos'] = pos;
            feature.setStyle(style);
            feature.getStyle().getImage().setOpacity(1);
            feature.getStyle().getImage().setRotation(angle);
            feature.setId(pos.asset);
            vectorSource.addFeature(feature);
        }

        vectorLayer.getSource().changed();
        vectorLayer.getSource().refresh();

        if (pos.flagstate !== 'UNK') {
            let flagFeature = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat( [ posArray[1], posArray[0]])));
            let cachedFlagFeature = infoSource.getFeatureById('flag_' + pos.asset);

            if (cachedFlagFeature !== null && cachedFeature !== undefined) {
                cachedFlagFeature.setGeometry(flagFeature.getGeometry());
            }
            else {
                // add flag info
                let flagState = getFlagStateImageName(pos.flagstate);
                let flagStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: './assets/flags/mini/' + flagState + '.png',
                        anchor: [0.5, 2.4],
                        rotateWithView: true
                    })
                });
                let markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: './assets/flags/mini/icon.png',
                        anchor: [0.5, 1.1],
                        rotateWithView: true,
                        color: c,
                        opacity: 0.75
                    })
                });


                flagFeature.setStyle([markerStyle, flagStyle]);
                flagFeature.setId('flag_' + pos.asset);
                infoSource.addFeature(flagFeature);
            }
            infoLayer.getSource().refresh();
        }
    };

    var getFlagStateImageName = function(flagState) {
        if (flagState === 'SWE') {
            return 'sv';
        }
        if (flagState === 'DNK') {
            return 'dk';
        }
        if (flagState === 'NOR') {
            return 'no';
        }
        if (flagState === 'FIN') {
            return 'fi';
        }
        if (flagState === 'UNK') {
            return 'eu';
        }
    };

    var doesAssetExistinCache = function (assetId) {
        for (let i = 0; i < $localStorage['realtimeDataAssets'].length; i++) {
            if ($localStorage['realtimeDataAssets'][i] === assetId) {
                return true;
            }
        }
        return false;
    };

    var setCachedFatureProperties = function(assetId, ignoreId) {
        for (let i = 0; i < $localStorage['realtimeMapDataFeatures'].length; i++) {
            let id = $localStorage['realtimeMapDataFeatures'][i].guid;
            if (id !== ignoreId) {
                let feature = vectorSource.getFeatureById(id);
                if (feature !== null && feature !== undefined && feature['assetId'] === assetId) {
                    feature.getStyle().getImage().setOpacity(0.25);
                    feature.getStyle().setText(null);
                }
            }
        }
    };


    var drawCachedRealtimeFeatures = function() {

        for (let i = 0; i < $localStorage['realtimeMapDataFeatures'].length; i++) {
            let pos = $localStorage['realtimeMapDataFeatures'][i];
            if (pos !== null) {
                drawVesselWithSegments(pos.asset, [pos], false, true);
            }
        }
    };

    var clearCacheRealTimeFeatures = function() {
        let cacheThresholdTime = Date.now() - MAX_TIME_FOR_MOVEMENT_IN_CACHE_MS;
        let arrayLength = $localStorage['realtimeMapDataFeatures'].length;
        if (arrayLength >= MAX_MOVEMENTS_IN_CACHE) {
            $localStorage['realtimeMapDataFeatures'].slice(arrayLength - MAX_MOVEMENTS_IN_CACHE);
        }

        for (let i = $localStorage['realtimeMapDataFeatures'].length - 1; i >= 0; i--) {
            let pos = $localStorage['realtimeMapDataFeatures'][i];
            if (pos !== null) {
                let time = new Date(pos.timestamp);
                if (cacheThresholdTime >= time) {
                    console.log('removing item from cache:', $localStorage['realtimeMapDataFeatures'][i]);
                    $localStorage['realtimeMapDataFeatures'].splice(i, 1);
                }
            }
        }
    };

    var doesPositionExistInFeatureCache = function(guid) {
        for (let i = 0; i < $localStorage['realtimeMapDataFeatures'].length; i++) {RotateNorthControl
            if ($localStorage['realtimeMapDataFeatures'][i].guid === guid) {
                return true;
            }
        }
        return false;
    };

    $scope.getMap = function() {
        return realtimeMapService.map;
    };


    $scope.onMarkerClick = function(feature) {
        let assetId = feature.getId() ? feature.getId() : feature['assetId'] ;
        if (assetId !== undefined) {
            $scope.getAssetInfo(assetId).then((assetInfo) => {
                var data = {
                    asset : assetInfo,
                    position : feature['pos']
                };
                PopupModal.show(data);

            });
        }
    };

    $scope.onTrackHover = function(feature) {
        if (feature.getId().indexOf('trackId') > -1) {
            $scope.highlightTrack(feature.getId());
        }
    };


    $scope.highlightTrack = function(trackId) {
        let cachedFeature = vectorSource.getFeatureById(trackId);
        let highlightTrack = createStyle('highlightTrack', 'black', 'yellow');

        // deselect previously selected track
        if (hoveredTrack != null && hoveredTrack.getStyle().length > 1) {
            hoveredTrack.getStyle().shift();
            vectorLayer.getSource().refresh();
        }
        else {
            hoveredTrack  = cachedFeature;

            hoveredTrack.getStyle().unshift(highlightTrack);
            vectorLayer.getSource().refresh();
        }

        /*
        if (cachedFeature !== undefined) {
            let highlightTrack = createStyle('highlightTrack', 'black', 'yellow');
            let track2 = cachedFeature.getStyle()[1];
            cachedFeature.setStyle([highlightTrack, track2])
            vectorLayer.getSource().refresh();
        }
        */
    };

    $scope.getPositions = function() {
        let promise = new Promise(function (resolve, reject) {
            let date = new Date(Date.now() - 86400000).getTime();    // get the positions of the last 30 minutes
            let dateString = dateTimeService.formatUTCDateWithTimezone(dateTimeService.toUTC(date));


            //let hasItems = angular.isDefined($localStorage['realtimeMapDataHistory']) && Object.keys($localStorage['realtimeMapDataHistory']).length > 0;
            //if (angular.isDefined($localStorage['realtimeMapDataHistory']) && hasItems) {
            //    resolve($localStorage['realtimeMapDataHistory']);
            //}
            //else {
                microMovementRestService.getMovementList(dateString).then((positions) => {

                    Object.entries(positions).forEach(p => {

                        let assetGuid = p[0];
                        if (assetGuid !== '$promise' && assetGuid !== '$resolved') {

                            Object.values(p[1]).forEach(pos => {
                                $scope.processRealtimeData(assetGuid, pos.guid, pos);
                            });
                        }

                    });

                    resolve($localStorage['realtimeMapData']);
                }).catch(error => {
                    reject(error);
                });
            //}


        });

        return promise;

    };

    /**
     * Gets the movement based on the position guid
     */
    $scope.getPosition = function(positionGuid) {
        let promise = new Promise(function (resolve, reject) {
            let movementInfo = null;
            if (angular.isDefined($localStorage['realtimeDataMovementsInfo'] && $localStorage['realtimeDataMovementsInfo'].length > 0)) {
                $localStorage['realtimeDataMovementsInfo'].filter(movement => {
                    if (movement[0] === positionGuid) {
                        movementInfo = movement[1];
                        resolve(movementInfo);
                    }
                });
                if (movementInfo == null) {
                    movementRestService.getMovement(positionGuid).then(
                        function (movement) {
                            movementInfo = movement;
                            $localStorage['realtimeDataMovementsInfo'].push([positionGuid, movementInfo]);
                            resolve(movementInfo);
                        },
                        function (error) {
                            $log.error(error);
                            reject(error);
                        }
                    );
                }
            }
        });
        return promise;
    };


    $scope.getAssetInfo = function(assetId) {
        let promise = new Promise(function (resolve, reject) {

            let assetInfo = null;

            if ($localStorage['realtimeDataAssets'].length > 0) {
                $localStorage['realtimeDataAssets'].filter(asset => {
                    if (asset[0] === assetId) {
                        assetInfo = asset[1];
                        resolve(assetInfo);
                    }
                });
            }
            if (assetInfo == null) {
                vesselRestService.getVessel(assetId).then(
                    function (vessel) {
                        assetInfo = vessel;
                        $localStorage['realtimeDataAssets'].push([assetId, assetInfo]);
                        resolve(assetInfo);
                    },
                    function (error) {
                        $log.error(error);
                        reject(error);
                    }
                );
            }
        });
        return promise;
    };

    $scope.getSegmentByMovementGuid = function(guid) {
        let promise = new Promise(function (resolve, reject) {
            let segmentInfo = null;
            if (angular.isDefined($localStorage['realtimeDataSegmentInfo'] && $localStorage['realtimeDataSegmentInfo'].length > 0)) {
                $localStorage['realtimeDataSegmentInfo'].filter(segment => {
                    if (segment[0] === guid) {
                        segmentInfo = segment[1];
                        resolve(segmentInfo);
                    }
                });
                if (segmentInfo == null) {
                    microMovementRestService.getSegmentByMovementGuid(guid).then(
                        function (segment) {
                            segmentInfo = segment;
                            $localStorage['realtimeDataSegmentInfo'].push([guid, segmentInfo]);
                            resolve(segmentInfo);
                        },
                        function (error) {
                            $log.error(error);
                            reject(error);
                        }
                    );
                }
            }
        });
        return promise;
    };

    $scope.getTrackByMovementId = function(guid) {
        let promise = new Promise(function (resolve, reject) {
            let trackInfo = null;
            if (angular.isDefined($localStorage['realtimeDataTrackInfo'] && $localStorage['realtimeDataTrackInfo'].length > 0)) {
                $localStorage['realtimeDataTrackInfo'].filter(track => {
                    if (track[0] === guid) {
                        trackInfo = track[1];
                        resolve(trackInfo);
                    }
                });
                if (trackInfo == null) {
                    microMovementRestService.getTrackByMovementId(guid).then(
                        function (track) {
                            trackInfo = track;
                            $localStorage['realtimeDataTrackInfo'].push([guid, trackInfo]);
                            resolve(trackInfo);
                        },
                        function (error) {
                            $log.error(error);
                            reject(error);
                        }
                    );
                }
            }
        });
        return promise;
    };

    // TODO: Move to utils class
    function hashCode(str) { // java String#hashCode
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    function intToRGB(i) {
        var c = (i & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return "00000".substring(0, 6 - c.length) + c;
    }

    function initLocalCaches() {
        if (!angular.isDefined($localStorage['realtimeDataAssets'])) {
            $localStorage['realtimeDataAssets'] = [];
        }
        if (!angular.isDefined($localStorage['realtimeDataMovementsInfo'])) {
            $localStorage['realtimeDataMovementsInfo'] = [];
        }
        if (!angular.isDefined($localStorage['realtimeDataSegmentInfo'])) {
            $localStorage['realtimeDataSegmentInfo'] = [];
        }
        if (!angular.isDefined($localStorage['realtimeDataTrackInfo'])) {
            $localStorage['realtimeDataTrackInfo'] = [];
        }

        if (!angular.isDefined($localStorage['realtimeMapData'])) {
            $localStorage['realtimeMapData'] = new Map();
        }
        if (!angular.isDefined($localStorage['realtimeMapDataFeatures'])) {
            $localStorage['realtimeMapDataFeatures'] = [];
        }

    }

    function onRealTimeMapDataUpdated(values) {
        console.log('value updated:', values);
    }

    function refreshRealTimeMapDataFeatures() {
        if (angular.isUndefined($localStorage['realtimeMapDataFeatures'])) {
            return;
        }
        for (let i = 0; i < $localStorage['realtimeMapDataFeatures'].length; i++) {
            let feature = $localStorage['realtimeMapDataFeatures'];

        }
    }

    var drawFuturePosition = function(data) {
        let speed = data.speed * 1.852; // km
        let futureFeatures = [{}, {}];

        for (let i = 0; i < 2; i++) {

            let futurePosition = realtimeMapService.destinationPoint(data.lat, data.lon, speed * ((i+1) * 500), data.bearing);
            let futureFeature = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat( [futurePosition[1], futurePosition[0] ])));

            var futureStyle = createStyle('arrow', data.color, 'white');
            futureFeature.setStyle(futureStyle);
            futureFeature.setId('futurePos_' + i + '_' + data.assetId);
            futureFeatures[i] = futureFeature;
            vectorSource.addFeature(futureFeatures[i]);

        }

        // draw an arrow in the direction
        // get the angle between current position and future position
        let length = data.currentFeature.getGeometry().getCoordinates().length;

        var dx = futureFeatures[1].getGeometry().getCoordinates()[1] - futureFeatures[0].getGeometry().getCoordinates()[1];
        var dy = futureFeatures[1].getGeometry().getCoordinates()[0] - futureFeatures[0].getGeometry().getCoordinates()[0];
        var rot = Math.atan2(dy, dx);
        futureFeatures[0].getStyle().getImage().setRotation(rot);
        futureFeatures[1].getStyle().getImage().setRotation(rot);

        vectorLayer.getSource().refresh();


    };

    var drawTrack = function(data, color) {
        let id = 'trackId_' + data.data.position.asset;
        let cachedFeature = vectorSource.getFeatureById(id);
        if (cachedFeature == null) {
            removeFeature(id);
        }
        var wktStr = data.wkt;

        var wkt = new ol.format.WKT();

        var feature  = wkt.readFeature(wktStr, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        feature.setId(id);
        let track1 = createStyle('track1', 'black', color);
        feature.setStyle([track1]);
        vectorSource.addFeature(feature);

        vectorLayer.getSource().refresh();


        let speed = data.data.position.speed;
        let bearing = data.data.position.heading;

        drawFuturePosition({
            lat : data.data.position.location.latitude,
            lon: data.data.position.location.longitude,
            speed: speed,
            bearing: bearing,
            assetId: data.data.position.asset,
            currentFeature: feature,
            color: color
        });

    };

    var removeFeature = function(trackId) {
        let cachedFeature = vectorSource.getFeatureById(trackId);
        if (cachedFeature != null && cachedFeature !== undefined) {
            vectorSource.removeFeature(cachedFeature);
            vectorLayer.getSource().refresh();
        }
    };
    init();
});
