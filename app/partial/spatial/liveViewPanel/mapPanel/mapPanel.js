angular.module('unionvmsWeb').controller('MapCtrl',function($log, $scope, locale, $timeout, $document, $templateRequest, mapService, spatialHelperService, reportService, mapFishPrintRestService, MapFish){
    $scope.activeControl = '';
    $scope.showMeasureConfigWin = false;
    $scope.showPrintConfigWin = false;
    $scope.showMapFishConfigWin = false;
    $scope.measureConfigs = spatialHelperService.measure;
    $scope.print = spatialHelperService.print;
    $scope.mapFish = MapFish;
    $scope.tbControl = spatialHelperService.tbControl;
    $scope.refresh = reportService.refresh;
    $scope.newObject = {}; // TODO change name
    $scope.popupSegments = mapService.popupSegRecContainer;
    
    //Close identify popup
    $scope.closePopup = function(){
        mapService.closePopup();
    };
    
    //Change displayed record on popup - vms segments only
    $scope.changeDisplayedRecord = function(direction){        
        if (direction === 'next' && $scope.popupSegments.currentIdx < $scope.popupSegments.records.length - 1){
            $scope.popupSegments.currentIdx += 1;
            $scope.updatePopup();
        } else if (direction === 'previous' && $scope.popupSegments.currentIdx > 0){
            $scope.popupSegments.currentIdx -= 1;
            $scope.updatePopup();
        }
    };
    
    $scope.updatePopup = function(){
        var record = mapService.popupSegRecContainer.records[mapService.popupSegRecContainer.currentIdx];
        var data = mapService.setSegmentsObjPopup(record.data);
        mapService.requestPopupTemplate(data, record.coord, record.fromCluster, true);
    };
    
    //Comboboxes
    $scope.measuringUnits = [];
    $scope.measuringUnits.push({"text": locale.getString('spatial.map_measuring_units_meters'), "code": "m"});
    $scope.measuringUnits.push({"text": locale.getString('spatial.map_measuring_units_nautical_miles'), "code": "nm"});
    $scope.measuringUnits.push({"text": locale.getString('spatial.map_measuring_units_miles'), "code": "mi"});

    $scope.exportFormats = [];
    $scope.exportFormats.push({"text": 'PNG', "code": "png"});
    $scope.exportFormats.push({"text": 'JPEG', "code": "jpeg"});
    $scope.exportFormats.push({"text": 'PDF', "code": "pdf"});

    $scope.printLayouts = [];
    $scope.printLayouts.push({"text": locale.getString('spatial.map_export_layout_portrait'), "code": "portrait"});
    $scope.printLayouts.push({"text": locale.getString('spatial.map_export_layout_landscape'), "code": "landscape"});

    (function () {
        $log.debug("Init MapCtrl");
        MapFish.reset();
        mapFishPrintRestService.ping().then(
            function (data) {
                $log.debug(data);
                MapFish.isDeployed = true;
                $scope.getTemplates();
                $scope.getCapabilities('default');
            }, function(error) {
                $log.error(error);
                MapFish.isDeployed = false;
            }
        );
    })();

    $scope.getTemplates = function(){
        $log.debug("Fetching mapfish templates from server");
        MapFish.reset();
        mapFishPrintRestService.getTemplates().then(
            function (data) {
                $log.debug(data);
                MapFish.initTemplateCmbx(data);
            }, function(error) {
                $log.error(error);
            }
        );
    };

    $scope.getCapabilities = function(appId){
        $log.debug("Getting capabilities of " + appId);
        MapFish.reset();
        mapFishPrintRestService.getCapabilities(appId).then(
            function (data) {
                $log.debug(data);
                MapFish.initFormatsCmbx(data);
                MapFish.initLayoutCmbx(data);
                MapFish.initLayoutAttributes(data, MapFish.layouts[0].text);
            }, function(error) {
                $log.error(error);
            }
        );
    };

    $scope.toggleLayout = function(selectedLayout) {
        $log.debug("Layout changed to " + selectedLayout);
        MapFish.initLayoutAttributes(MapFish.capabilitiesData, selectedLayout);
    };


    //Handle toggle on top toolbar
    $scope.toggleToolbarBtn = function(tool){
        var fn;
        var previousControl = $scope.activeControl;

        if (tool !== previousControl && previousControl !== ''){
            fn = previousControl + 'Disable';
            $scope.activeControl = tool;
            $scope[fn]();
        } else if (tool === previousControl){
            fn = previousControl + 'Disable';
            $scope.activeControl = '';
            $scope[fn]();
        } else {
            $scope.activeControl = tool;
        }

        if ($scope.activeControl !== ''){
            fn = $scope.activeControl + 'Enable';
            $scope[fn]();
        }
    };

    //Setup draggable windows
    $scope.setWinDraggable = function(win, buttonPosition){
        if (win.draggable('instance') === undefined){
            win.draggable({
                handle: 'span',
                containment: '.map-container',
                scroll: false
            });
        }
        var mapEl = mapService.map.getTargetElement();
        var mapRect = mapEl.getBoundingClientRect();
        win[0].style.marginTop = '8px';
        win[0].style.top = 'auto';
        win[0].style.left = buttonPosition.left + 'px';
    };

    //Measure control
    $scope.measureEnable = function(){
        $scope.openMeasureConfigWin();
        mapService.startMeasureControl();
    };

    $scope.openMeasureConfigWin = function(){
        $scope.showMeasureConfigWin = true;
        var win = angular.element('#measure-config');
        var btnPos = angular.element('#measure-config-btn').offset();
        $scope.setWinDraggable(win, btnPos);
    };

    $scope.mapFishPrintDisable = function(){
        $scope.showMapFishConfigWin = false;
    };

    $scope.measureDisable = function(){
        $scope.showMeasureConfigWin = false;
        mapService.clearMeasureControl();
        $scope.measureConfigs.units = 'm';
        $scope.measureConfigs.speed = undefined;
        $scope.measureConfigs.startDate = undefined;
    };

    //Print control
    $scope.printEnable = function(){
        $scope.openPrintConfigWin();
    };

    $scope.mapFishPrintEnable = function(){
        $scope.openMapFishConfigWin();
    };

    $scope.openPrintConfigWin = function(){
        $scope.showPrintConfigWin = true;
        var win = angular.element('#print-config');
        var btnPos = angular.element('#export-map').offset();
        $scope.setWinDraggable(win, btnPos);
    };

    $scope.openMapFishConfigWin = function(){
        $scope.showMapFishConfigWin = true;
        var win = angular.element('#map-fish-print-config');
        var btnPos = angular.element('#map-fish-print-config-btn').offset();
        $scope.setWinDraggable(win, btnPos);
    };

    $scope.cancelPrint = function (ref){
        if (ref === undefined) {
            return;
        }
        mapFishPrintRestService.cancelPrintJob(ref).then(
            function(data){
                $log.debug(data);
            },function(error){
                $log.error(error);
            }
        );
    };

    $scope.printMapWithMapFish = function() {
        $log.debug("Requesting print job");

        var payload = new MapFish.Payload($scope.newObject, MapFish.selected_layout);
        payload.addLegend(new MapFish.Legend('legendus'));

        var map = new MapFish.Map();
        map.center = [-655898, 5795404]; //TODO get from map
        map.dpi = MapFish.selected_dpi;
        map.addLayer(new MapFish.GridLayer()); //TODO get from map
        var layer = new MapFish.WmsLayer('http://localhost:8080/geoserver/wms','uvms:eez');
        layer.addLayer('uvms:countries');
        map.addLayer(layer);
        map.addLayer(new MapFish.WmsLayer('http://localhost:8080/geoserver/wms','uvms:rfmo'));
        payload.addMap(map);

        mapFishPrintRestService.createPrintJob(MapFish.selected_template, MapFish.selected_format, payload).then(
            function(data) {
                $log.debug(data);
                MapFish.printJobData = data;

                var poller = function() {
                    if(MapFish.printJobData !== undefined){
                        mapFishPrintRestService.getPrintJobStatus(MapFish.printJobData.ref).then(
                            function(data){
                                $log.debug(data);
                                MapFish.jobStatusData = data;
                                if (MapFish.jobStatusData.status === 'running'){
                                    $timeout(poller, 500);
                                }
                                else if(MapFish.jobStatusData.status === 'finished'){
                                   $scope.download("http://localhost:8080/" + MapFish.jobStatusData.downloadURL);
                                }
                            },function (error) {
                                $log.error(error);
                            }
                        );
                    }
                };
                poller();
            },function (error) {
                $log.error(error);
            }
        );
    };

    $scope.download = function(downloadURL){
        var downloadLink = angular.element('<a></a>');
        downloadLink.attr('target', '_blank');
        downloadLink.attr('href', downloadURL);
        $document.find('body').append(downloadLink);
        downloadLink[0].click();
        downloadLink.remove();
    };

    $scope.changeTemplate = function (selected_template) {
        $log.debug("Changing template to " + selected_template);
        $scope.getCapabilities(selected_template);
    };

    $scope.printMap = function () {
        var exportType;
        var fileName = locale.getString('spatial.map_export_filename');
        switch ($scope.print.exportFormat) {
            case 'png':
                fileName += '.png';
                exportType = 'image/png';
                break;
            case 'jpeg':
                fileName += '.jpeg';
                exportType = 'image/jpeg';
                break;
            case 'pdf':
                fileName += '.pdf';
                exportType = 'image/jpeg';
                break;
            default:
                break;
        }

        var downloadLink = angular.element('<a></a>');
        downloadLink.attr('download', fileName);
        downloadLink.attr('target', '_blank');

        mapService.map.once('postcompose', function (evt) {
            var canvas = evt.context.canvas;
            if ($scope.print.exportFormat === 'pdf') {
                var img = canvas.toDataURL(exportType);
                var imgSize = {
                    width: canvas.width,
                    height: canvas.height
                };
                var doc = new jsPDF($scope.print.layout, 'mm', 'a4');
                if ($scope.print.layout === 'portrait') {
                    $scope.setPortraitPdf(doc, img, imgSize);
                } else {
                    $scope.setLandscapePdf(doc, img, imgSize);
                }
                downloadLink.attr('href', doc.output('datauristring'));
            } else {
                downloadLink.attr('href', canvas.toDataURL(exportType));
            }

            $document.find('body').append(downloadLink);
            $timeout(function () {
                downloadLink[0].click();
                downloadLink.remove();
            }, null);
        });

        mapService.map.renderSync();
    };

    //Scale the map image to fit PDF page while keeping the aspect ratio
    $scope.getFinalMapSize = function (originalSize, targetSize) {
        var scaleWidth = originalSize.width / targetSize.maxWidth;
        var scaleHeight = originalSize.height / targetSize.maxHeight;

        var size = {};
        if (scaleWidth > scaleHeight) {
            size.width = originalSize.width / scaleWidth;
            size.height = originalSize.height / scaleWidth;
        } else {
            size.width = originalSize.width / scaleHeight;
            size.height = originalSize.height / scaleHeight;
        }

        return size;
    };

    //Build portrait PDF layout
    $scope.setPortraitPdf = function (doc, map, mapSize) {
        if (angular.isDefined($scope.print.title)) {
            doc.setTextColor(41, 128, 185);
            doc.setFontSize(18);
            $scope.centerText(doc, $scope.print.title, $scope.print.portrait.title.top);
        }

        //Add map image
        var size = $scope.getFinalMapSize(mapSize, $scope.print.portrait.mapSize);
        var marginLeft = 10;
        if (size.width < doc.internal.pageSize.width) {
            marginLeft = (doc.internal.pageSize.width - size.width) / 2;
        }
        doc.addImage(map, 'jpeg', marginLeft, 25, size.width, size.height);

        //Add footer
        $scope.writeFooter(doc, 'portrait');
    };

    //Build landscape PDF layout
    $scope.setLandscapePdf = function (doc, map, mapSize) {
        if (angular.isDefined($scope.print.title)) {
            doc.setTextColor(41, 128, 185);
            doc.setFontSize(18);
            $scope.centerText(doc, $scope.print.title, $scope.print.landscape.title.top);
        }

        //Add map image
        var size = $scope.getFinalMapSize(mapSize, $scope.print.landscape.mapSize);
        var marginLeft = 10;
        if (size.width < doc.internal.pageSize.width) {
            marginLeft = (doc.internal.pageSize.width - size.width) / 2;
        }
        doc.addImage(map, 'jpeg', marginLeft, 25, size.width, size.height);

        //Add footer
        $scope.writeFooter(doc, 'landscape');
    };

    //Add PDF footer with date and UnionVMS copyright
    $scope.writeFooter = function (doc, layout) {
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text($scope.print[layout].footer.left, $scope.print[layout].footer.bottom, moment().utc().format('YYYY-MM-DD HH:mm Z') + ' UTC');
        doc.text($scope.print[layout].footer.right, $scope.print[layout].footer.bottom, locale.getString('spatial.map_export_copyright') + ' unionVMS');
    };

    //Center text in PDF doc
    $scope.centerText = function (doc, text, offsetY) {
        var textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        var textOffset = (doc.internal.pageSize.width - textWidth) / 2;
        doc.text(textOffset, offsetY, text);
    };

    $scope.printDisable = function () {
        $scope.showPrintConfigWin = false;
        $scope.print.exportFormat = 'png';
        $scope.print.layout = 'portrait';
        $scope.print.title = undefined;
    };

    //Refresh report control
    $scope.refreshReport = function () {
        reportService.refreshReport();
    };

    //Clear highlight features control
    $scope.clearMapHighlights = function () {
        var layer = mapService.getLayerByType('highlight');
        if (angular.isDefined(layer)) {
            layer.getSource().clear(true);
        }
    };

    //Untoggle any toolbar btn when tab is changed
    $scope.$on('untoggleToolbarBtns', function (evt) {
        if ($scope.activeControl !== '') {
            $scope.toggleToolbarBtn($scope.activeControl);
        }
    });

    $scope.resizeMap = function (evt) {

        var w = angular.element(window);

        if (evt && (angular.element('.mapPanelContainer.fullscreen').length > 0 ||
            (angular.element('.mapPanelContainer.fullscreen').length === 0 && evt.type.toUpperCase().indexOf("FULLSCREENCHANGE") !== -1))) {

            setTimeout(function () {
                $('.map-container').css('height', w.height() - parseInt($('.map-bottom').css('height')) + 'px');
                $('.layer-panel').css('height', w.height() - parseInt($('#map-toolbar').css('height')) + 'px');
                $('#map').css('height', w.height() - parseInt($('#map-toolbar').css('height')) - parseInt($('.map-bottom').css('height')) + 'px');
                mapService.updateMapSize();
            }, 100);
            return;
        }

        setTimeout(function () {
            var offset = 120;
            var minHeight = 340;
            var footerHeight = angular.element('footer')[0].offsetHeight;
            var headerHeight = angular.element('header')[0].offsetHeight;
            var newHeight = w.height() - headerHeight - footerHeight - offset;

            if (newHeight < minHeight) {
                newHeight = minHeight;
            }

            $('.map-container').css('height', newHeight);
            $('.layer-panel').css('height', newHeight);

            var mapToolbarHeight = parseInt($('#map-toolbar').css('height'));
            if (mapToolbarHeight > 31) {
                $('#map').css('height', newHeight - (mapToolbarHeight - 31) - parseInt($('.map-bottom').css('height')) + 'px');
            } else {
                $('#map').css('height', newHeight - parseInt($('.map-bottom').css('height')) + 'px');
            }

            mapService.updateMapSize();
        }, 100);
    };

    $(window).resize(mapService.updateMapContainerSize);
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function() {
    	setTimeout(function() {
    		if($scope.showMeasureConfigWin){
        		$scope.openMeasureConfigWin();
        	}
    		if($scope.showPrintConfigWin){
    			$scope.openPrintConfigWin();
        	}
    		if($scope.showMapFishConfigWin){
    			$scope.openMapFishConfigWin();
    		}
    	}, 100);
	});

    angular.element(document).ready(function () {
        mapService.updateMapContainerSize();
    });

    //Other controls
//    $scope.otherEnable = function(){
//        console.log('enable other');
//    };
//    
//    $scope.otherDisable = function(){
//        console.log('disable other');
//    };
});

angular.module('unionvmsWeb').controller('MappanelCtrl',function($scope, locale, mapService, spatialHelperService){
    //Initial mock config object
    $scope.config = {
        map: {
            projection: {
                epsgCode: 3857, //So far we only support 3857 and 4326
                units: 'm',
                global: true,
                axis: 'enu',
                extent: '-20026376.39;-20048966.10;20026376.39;20048966.10'
            },
            control: [{
                type: 'zoom'
            },{
                type: 'drag'
            },{
                type: 'scale',
                units: 'nautical' //Possible values: metric, degrees, nautical, us, imperial
            },{
                type: 'mousecoords',
                epsgCode: 4326,
                format: 'dd' //Possible values: dd, dms, ddm, m
            },{
                type: 'history'
            }],
            tbControl: [{
                type: 'measure'
            },{
                type: 'fullscreen'
            },{
                type: 'print'
            },{
                type: 'mapFishPrint'
            }]
        }
    };

    locale.ready('spatial').then(function(){
        mapService.setMap($scope.config);
        $scope.map = mapService.map;
        spatialHelperService.setToolbarControls($scope.config);
    });
});