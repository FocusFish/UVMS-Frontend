angular.module('unionvmsWeb').controller('MapCtrl',function($scope, locale, $timeout, $document, mapService, spatialHelperService, $window){
    $scope.activeControl = '';
    $scope.showMeasureConfigWin = false;
    $scope.showPrintConfigWin = false;
    $scope.measureConfigs = spatialHelperService.measure;
    $scope.print = spatialHelperService.print;
    $scope.tbControls = spatialHelperService.tbControls;
    
    //Close identify popup
    $scope.closePopup = function(){
        mapService.closePopup();
    };
    
    $scope.measuringUnits = [];
    $scope.measuringUnits.push({"text": locale.getString('spatial.map_measuring_units_meters'), "code": "m"});
    $scope.measuringUnits.push({"text": locale.getString('spatial.map_measuring_units_nautical_miles'), "code": "nm"});
    $scope.measuringUnits.push({"text": locale.getString('spatial.map_measuring_units_miles'), "code": "mi"});
    
    $scope.exportFormats = [];
    $scope.exportFormats.push({"text": 'PNG', "code": "png"});
    $scope.exportFormats.push({"text": 'JPEG', "code": "jpeg"});
    $scope.exportFormats.push({"text": 'PDF', "code": "pdf"});
    
    $scope.printLayouts = [];
    $scope.printLayouts.push({"text": 'Portrait', "code": "portrait"}); //TODO translations
    $scope.printLayouts.push({"text": 'Landscape', "code": "landscape"});
    
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
    $scope.setWinDraggable = function(win, marginRight){
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
        win[0].style.left = mapRect.left + marginRight + 'px';
    };
    
    //Measure control
    $scope.measureEnable = function(){
        $scope.openMeasureConfigWin();
        mapService.startMeasureControl();
    };
    
    $scope.openMeasureConfigWin = function(){
        $scope.showMeasureConfigWin = true;
        var win = angular.element('#measure-config');
        $scope.setWinDraggable(win, 40);
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
    
    $scope.openPrintConfigWin = function(){
        $scope.showPrintConfigWin = true;
        var win = angular.element('#print-config');
        $scope.setWinDraggable(win, 65);
    };
    
    $scope.printMap = function(){
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
      
      mapService.map.once('postcompose', function(evt){
         var canvas = evt.context.canvas;
         if ($scope.print.exportFormat === 'pdf'){
             var img = canvas.toDataURL(exportType);
             var imgSize = {
                width: canvas.width,
                height: canvas.height
             };
             var doc = new jsPDF($scope.print.layout, 'mm', 'a4');
             if ($scope.print.layout === 'portrait'){
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
    $scope.getFinalMapSize = function(originalSize, targetSize){
        var scaleWidth = originalSize.width / targetSize.maxWidth;
        var scaleHeight = originalSize.height / targetSize.maxHeight;
        
        var size = {};
        if (scaleWidth > scaleHeight){
            size.width = originalSize.width / scaleWidth;
            size.height = originalSize.height / scaleWidth;
        } else {
            size.width = originalSize.width / scaleHeight;
            size.height = originalSize.height / scaleHeight;
        }
        
        return size;
    };
    
    //Build portrait PDF layout
    $scope.setPortraitPdf = function(doc, map, mapSize){
        if (angular.isDefined($scope.print.title)){
            doc.setTextColor(41, 128, 185);
            doc.setFontSize(18);
            $scope.centerText(doc, $scope.print.title, $scope.print.portrait.title.top);
        }
        
        //Add map image
        var size = $scope.getFinalMapSize(mapSize, $scope.print.portrait.mapSize);
        var marginLeft = 10;
        if (size.width < doc.internal.pageSize.width){
            marginLeft = (doc.internal.pageSize.width - size.width) / 2;
        }
        doc.addImage(map, 'jpeg', marginLeft, 25, size.width, size.height);
        
        //Add footer
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text($scope.print.portrait.footer.left, $scope.print.portrait.footer.bottom, moment().utc().format('YYYY-MM-DD HH:mm Z') + ' UTC');
        doc.text($scope.print.portrait.footer.right, $scope.print.portrait.footer.bottom, 'Generated by unionVMS');
    };
    
    //Build landscape PDF layout
    $scope.setLandscapePdf = function(doc, map, mapSize){
        if (angular.isDefined($scope.print.title)){
            doc.setTextColor(41, 128, 185);
            doc.setFontSize(18);
            $scope.centerText(doc, $scope.print.title, $scope.print.landscape.title.top);
        }
        
        //Add map image
        var size = $scope.getFinalMapSize(mapSize, $scope.print.landscape.mapSize);
        var marginLeft = 10;
        if (size.width < doc.internal.pageSize.width){
            marginLeft = (doc.internal.pageSize.width - size.width) / 2;
        }
        doc.addImage(map, 'jpeg', marginLeft, 25, size.width, size.height);
        
        //Add footer
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text($scope.print.landscape.footer.left, $scope.print.landscape.footer.bottom, moment().utc().format('YYYY-MM-DD HH:mm Z') + ' UTC');
        doc.text($scope.print.landscape.footer.right, $scope.print.landscape.footer.bottom, 'Generated by unionVMS');
    };
    
    //Center text in PDF doc
    $scope.centerText = function(doc, text, offsetY){
        var textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        var textOffset = (doc.internal.pageSize.width - textWidth) / 2;
        doc.text(textOffset, offsetY, text);
    };
    
    $scope.printDisable = function(){
        $scope.showPrintConfigWin = false;
        $scope.print.exportFormat = 'png';
        $scope.print.layout = 'portrait';
        $scope.print.title = undefined;
    };
    
    //Clear highlight features control
    $scope.clearMapHighlights = function(){
        var layer = mapService.getLayerByType('highlight');
        layer.getSource().clear(true);
    };
    
    //Untoggle any toolbar btn when tab is changed
    $scope.$on('untoggleToolbarBtns', function(evt){
        if ($scope.activeControl !== ''){
            $scope.toggleToolbarBtn($scope.activeControl);
        }
    });
    
    var resizeMap = function(evt) {
    	
        var w = angular.element(window);
        
        if(evt && (angular.element('.mapPanelContainer.fullscreen').length > 0 ||
        		(angular.element('.mapPanelContainer.fullscreen').length === 0 && evt.type.toUpperCase().indexOf("FULLSCREENCHANGE") !== -1))){
        	
        	setTimeout(function() {
        		$('.map-container').css('height', w.height() - parseInt($('.map-bottom').css('height')) + 'px');
        		$('[ng-controller="LayerpanelCtrl"]').css('height', w.height() - parseInt($('#map-toolbar').css('height')) + 'px');
                $('#map').css('height', w.height() - parseInt($('#map-toolbar').css('height')) - parseInt($('.map-bottom').css('height')) + 'px');
                mapService.updateMapSize();
        	}, 100);
      	  return;
        }
        
        setTimeout(function() {
	        var offset = 100;
	        var minHeight = 340;
	        var footerHeight = angular.element('footer')[0].offsetHeight;
	        var headerHeight = angular.element('header')[0].offsetHeight;
	        var newHeight = w.height() - headerHeight - footerHeight - offset;
	        
	        if (newHeight < minHeight) {
	            newHeight = minHeight;
	        }
	        
	        $('.map-container').css('height', newHeight);
	        $('[ng-controller="LayerpanelCtrl"]').css('height', newHeight);
	        
	        var mapToolbarHeight = parseInt($('#map-toolbar').css('height'));
	        if(mapToolbarHeight > 31){
	        	$('#map').css('height', newHeight - (mapToolbarHeight - 31) - parseInt($('.map-bottom').css('height')) + 'px');
	        }else{
	        	$('#map').css('height', newHeight - parseInt($('.map-bottom').css('height')) + 'px');
	        }
	        
	        mapService.updateMapSize();
        }, 100);
  	};
    
    $(window).resize(resizeMap);
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', resizeMap);
    
    angular.element(document).ready(function () {
    	resizeMap();
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
    //Mock config object
    $scope.config = {
        map: {
            projection: {
                epsgCode: 3857, //So far we only support 3857 and 4326
                units: 'm',
                global: true
            },
            controls: [{
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
            tbControls: [{
                type: 'measure'
            },{
                type: 'fullscreen'
            },{
                type: 'print'
            }]
        }
    };
    
    locale.ready('spatial').then(function(){
        mapService.setMap($scope.config);
        $scope.map = mapService.map;
        spatialHelperService.setToolbarControls($scope.config);
    });
});