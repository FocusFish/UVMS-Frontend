angular.module('unionvmsWeb').factory('TreeModel',function(locale, mapService, userService) {

	function TreeModel(){}
	
	var baseLayerCounter = 0;
	
	//Build tree node for OSM based layers
	var buildOsmBasedNodes = function(src){
	    if (src.isBaseLayer === true){
	        baseLayerCounter += 1;
	    }
	    
	    var node = {
	        title: src.title,
	        selected: src.isBaseLayer === false ? undefined : (baseLayerCounter === 1 ? true : false),
	        extraClasses: src.isBaseLayer === true ? 'layertree-basemap' : undefined,
	        data: {
	            type: src.type,
	            isBaseLayer: src.isBaseLayer,
	            title: src.title
	        }
	    };
	    
	    return node;
	};
	
	//Build tree node for Bing based layers
	var buildBingBasedNodes = function(src){
        baseLayerCounter += 1;
        
        var layerTitle = locale.getString('spatial.layer_tree_' + src.title);
	    var node = {
	        title: layerTitle,
	        selected: baseLayerCounter === 1 ? true : false,
	        extraClasses: 'layertree-basemap',
	        data: {
	            type: src.type,
	            isBaseLayer: true,
	            title: layerTitle,
	            layerGeoName: src.layerGeoName,
	            apiKey: src.apiKey
	        }
	    };
	    
	    return node;
	};
	
	//Build a tree node for WMS layers
	var buildWmsNode = function(src){
	    var stylesForObject = [];
	    var selected = false;
	    if (angular.isDefined(src.styles)){
	        stylesForObject = checkWmStylesAvailability(src.styles);
	    }
	    
	    var filtersForObject;
	    if (angular.isDefined(src.filters)){
	        filtersForObject = buildCqlContext(src.filters);
        }
	    
	    if (src.isBaseLayer === true){
	        baseLayerCounter += 1;
	        if (baseLayerCounter === 1){
	            selected = true;
	        }
	    }
	    
	    if (!angular.isDefined(src.cql)){
	        src.cql = null;
	    }
	    
	    //Final node
	    var mapExtent = mapService.map.getView().getProjection().getExtent();
	    var node = {
	        title: src.title,
	        selected: selected,
	        extraClasses: src.isBaseLayer === true ? 'layertree-basemap' : undefined,
	        data: {
	            type: 'WMS',
	            title: src.title,
	            isBaseLayer: src.isBaseLayer,
	            attribution: src.shortCopyright,
	            longAttribution: angular.isDefined(src.longCopyright) ? src.longCopyright : undefined,
	            url: src.url,
	            serverType: src.serverType,
	            params: {
	                time_: (new Date()).getTime(),
	                'LAYERS': src.layerGeoName,
	                'TILED': true,
	                'TILESORIGIN': mapExtent[0] + ',' + mapExtent[1],
	                'STYLES': angular.isDefined(stylesForObject) === true ? stylesForObject[0] : '', 
	                'cql_filter': src.cql
	            }
	        }
	    };
	    
	    
	    if (angular.isDefined(filtersForObject)){
            node.data.contextItems =  filtersForObject;
        }
	    
	    
	    var menuSep = {
	        className: 'context-menu-item context-menu-separator context-menu-not-selectable'
	    };
	    
	    if (stylesForObject.length > 1){
	        if (angular.isDefined(node.data.contextItems)){
	            _.extend(node.data.contextItems, {sep1: menuSep});
	            _.extend(node.data.contextItems, stylesForObject[1]); 
	        } else {
	            node.data.contextItems = stylesForObject[1];
	        }
	    }
	    
	    if (angular.isDefined(node.data.contextItems)){
	        node.data.contextTip = locale.getString('spatial.layer_tree_tip_context_menu');
	        _.extend(node.data.contextItems, {sep2: menuSep});
	    }
	    
	    return node;
	};
	
	//Build area nodes
	var buildAreaNode = function(src){
	    var node;
	    if (src.areaType === 'SYSAREA'){
	        node = buildWmsNode(src);
	    } else if (src.areaType === 'AREAGROUP'){
	        node = buildUserAreaGroupNode(src);
	    } else {
	        node = buildUserAreaNode(src);
	    }
	    
	    return node;
	};
	
	//User area group specific node
	var buildUserAreaGroupNode = function(src){
	    var cql = "(user_name = '" + userService.getUserName() + "' OR scopes ilike '%#" + userService.getCurrentContext().scope.scopeName +"#%')";
	    
	    var newDef = {
            isBaseLayer: src.isBaseLayer,
            layerGeoName: src.layerGeoName,
            longCopyright: src.longCopyright,
            shortCopyright: src.shortCopyright,
            serverType: src.serverType,
            styles: src.styles,
            type: src.url,
            url: src.url,
            title: src.title,
            cql: cql + ' AND ' + src.cql_all + ' AND ' +src.cql_active,
            filters: {
                baseCql: cql,
                allCql: src.cql_all,
                activeCql: src.cql_active
            }
        };
        
        return buildWmsNode(newDef);
	};
	
	//User area specific node
	var buildUserAreaNode = function(src){
	    var filter;
	    if (src.areaType === 'USERAREA'){
	        filter = 'gid = ' + src.gid;
	    } else {
	        filter = "user_name = '" + userService.getUserName() + "' AND " + src.cql;
	    }
	    
	    var newDef = {
            isBaseLayer: src.isBaseLayer,
            layerGeoName: src.layerGeoName,
            longCopyright: src.longCopyright,
            shortCopyright: src.shortCopyright,
            serverType: src.serverType,
            styles: src.styles,
            type: src.url,
            url: src.url,
            title: src.title,
            cql: filter 
        };
	    
	    return buildWmsNode(newDef);
	};
	
	//Check how many WMS styles are available, set the default style and build the style context menu
	var checkWmStylesAvailability = function(styles){
	    var finalStyles = [];
	    var styleKeys = Object.keys(styles);
	    var defaultStyle = styles[styleKeys[0]];
	    
	    finalStyles.push(defaultStyle);
	    if (styleKeys.length > 1){
	        var contextMenuItems = buildStyleContext(styles, defaultStyle);
	        finalStyles.push(contextMenuItems);
	    }
	    
	    return finalStyles;
	};
	
	
	//Cql options, mainly for user area group layers
	var buildCqlContext = function(filters){
	    var cqlContext = {
            cqlHeader: {
                name: locale.getString('spatial.layer_tree_context_menu_show_title'),
                disabled: true,
                className: 'layer-menu-header'
            }
	    };
	    
	    cqlContext.activeAreas = {
            name: locale.getString('spatial.layer_tree_context_menu_active_areas_title'),
            type: 'radio',
            radio: 'filter',
            value: 'activeAreas',
            cql: filters.baseCql + ' AND ' + filters.allCql + ' AND ' + filters.activeCql,
            selected: true
        };
	    
	    cqlContext.allAreas = {
	        name: locale.getString('spatial.layer_tree_context_menu_all_areas_title'),
	        type: 'radio',
	        radio: 'filter',
	        value: 'allAreas',
	        cql: filters.baseCql + ' AND ' + filters.allCql,
	        selected: false
	    };
	
	    return cqlContext;
	};
	
	//Build style contextmenu object
	var buildStyleContext = function(styles, defaultStyle){
	    var styleContext = {
	        styleHeader: {
	            name: locale.getString('spatial.layer_tree_context_menu_style_title'),
	            disabled: true,
	            className: 'layer-menu-header'
	        }
	    };
	    
	    if (angular.isDefined(styles.geom)){
	        styleContext.geomStyle = {
	            name: locale.getString('spatial.layer_tree_context_menu_geom_style'),
                type: 'radio',
                radio: 'style',
                value: styles.geom,
                selected: styles.geom === defaultStyle ? true : false
	        };
	    }
	    
	    if (angular.isDefined(styles.labelGeom)){
	        styleContext.geomLabelStyle = {
                name: locale.getString('spatial.layer_tree_context_menu_geom_label_style'),
                type: 'radio',
                radio: 'style',
                value: styles.labelGeom,
                selected: styles.labelGeom === defaultStyle ? true : false
            };
	    }
	    
	    if (angular.isDefined(styles.label)){
	        styleContext.labelStyle = {
                name: locale.getString('spatial.layer_tree_context_menu_label_style'),
                type: 'radio',
                radio: 'style',
                value: styles.label,
                selected: styles.label === defaultStyle ? true : false
            };
	    }
	    
	    return styleContext;
	};
	
	var loopAndBuildNode = function(nodeFromServer){
	    var nodeArray = [];
	    for (var i = 0; i < nodeFromServer.length; i++){
	        var def = nodeFromServer[i];
	        switch(def.type){
                case 'WMS':
                    if (angular.isDefined(def.areaType)){
                        nodeArray.push(buildAreaNode(def));
                    } else {
                        nodeArray.push(buildWmsNode(def));
                    }
                    break;
                case 'OSM':
                    nodeArray.push(buildOsmBasedNodes(def));
                    break;
                case 'OSEA':
                    nodeArray.push(buildOsmBasedNodes(def));
                    break;
                case 'BING':
                    nodeArray.push(buildBingBasedNodes(def));
                    break;
            }
	    }
	    
	    return nodeArray;
	};
	
	TreeModel.prototype.fromConfig = function(config){
	    var tree = [];

	    //Ports
	    if (angular.isDefined(config.port)){
	        var portNodes = loopAndBuildNode(config.port);
	        tree.push({
              title: locale.getString('spatial.layer_tree_ports'),
              folder: true,
              expanded: false,
              children: portNodes
	        });
	    }
	    
	    //Areas
	    if (angular.isDefined(config.areas) && config.areas.length > 0){
	        var areaNodes = loopAndBuildNode(config.areas);
	        var areaFolder = {
                title: locale.getString('spatial.layer_tree_areas'),
                folder: true,
                expanded: false,
                children: areaNodes
	        };
	        
	        tree.push(areaFolder);
	    }
	    
	    //Additional cartography
	    if (angular.isDefined(config.additional)){
	        var additionalNodes =  loopAndBuildNode(config.additional);
            tree.push({
                title: locale.getString('spatial.layer_tree_additional_cartography'),
                folder: true,
                expanded: true,
                children: additionalNodes
            });
        }
	    
   	    //Baselayers
        if (angular.isDefined(config.baseLayers)){
            var baseNodes = loopAndBuildNode(config.baseLayers);
            tree.push({
                title: locale.getString('spatial.layer_tree_background_layers'),
                folder: true,
                expanded: true,
                unselectable: true,
                hideCheckbox: true,
                extraClasses: 'layertree-baselayer-node',
                key: 'basemap',
                children: baseNodes
            });
        }

	    baseLayerCounter = 0; 
	    return tree;
	};
	
	//Build vector nodes for positions and segments
	var buildVectorNodes = function(type, data){
	    var longCopyright;
	    if (type === 'positions'){
	        longCopyright = locale.getString('spatial.vms_positions_long_copyright'); 
	    } else {
	        longCopyright = locale.getString('spatial.vms_segments_long_copyright');
	    }
	    
	    var node = {
	        title: type === 'positions' ? locale.getString('spatial.layer_tree_positions') : locale.getString('spatial.layer_tree_segments'),
	        selected: true,
	        data: {
	            excludeDnd: true,
	            title: type,
	            type: type === 'positions' ? 'vmspos' : 'vmsseg',
	            isBaseLayer: false,
	            popupEnabled: true,
	            popupTip: 'spatial.layer_tree_tip_popup',
	            labelEnabled: true,
	            labelTip: 'spatial.layer_tree_tip_label_vector',
	            longAttribution: longCopyright.length > 0 ? longCopyright : undefined,
	            geoJson: data
	        }
	    };
	    
	    return node;
	};
	
	//Build parent folder node for vms layers
	TreeModel.prototype.nodeFromData = function(data){
	    var vectorNodes = [];

	    if (data.movements.features.length > 0){
	        vectorNodes.push(buildVectorNodes('positions', data.movements));
	    }
	    if (data.segments.features.length > 0){
	        vectorNodes.push(buildVectorNodes('segments', data.segments));
	    }
	    
	    if (vectorNodes.length > 0){
	        var node = {
                title: locale.getString('spatial.layer_tree_vms'),
                type: 'vmsdata',
                folder: true,
                expanded: true,
                children: vectorNodes
            };
            
            return node;
	    }
	};
	
	//Build node for alarms
	TreeModel.prototype.nodeForAlarms = function(data){
	    var longCopyright = locale.getString('spatial.alarms_long_copyright');
	    var title = locale.getString('spatial.layer_tree_alarms'); 
	    var node = {
	        title: title,
	        type: 'alarms',
	        folder: false,
	        selected: true,
	        extraClasses: 'layertree-alarms',
	        data: {
	            excludeDnd: true,
                title: title,
                type: 'alarms',
                popupEnabled: true,
                popupTip: 'spatial.layer_tree_tip_popup',
                longAttribution: longCopyright.length > 0 ? longCopyright : undefined,
                geoJson: data
	        }
	    };
	    
	    return node;
	};
	
	return TreeModel;
});