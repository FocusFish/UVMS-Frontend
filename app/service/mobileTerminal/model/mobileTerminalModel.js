angular.module('unionvmsWeb').factory('MobileTerminal', function(CommunicationChannel, CarrierId) {

        var INMARSAT_C_ATTRIBUTES = [
            'ANSWER_BACK',
            'ANTENNA',
            'ANTENNA_SERIAL_NUMBER',
            'INSTALLED_BY',
            'INSTALLED_ON',
            'SATELLITE_NUMBER', 
            'SERIAL_NUMBER',
            'SOFTWARE_VERSION',
            'STARTED_ON',
            'TRANSCEIVER_TYPE',
            'UNINSTALLED_ON'
        ];

        function MobileTerminal(){
            this.attributes = {};
            this.channels = [];
            //Add an initial channel
            this.channels.push(new CommunicationChannel());
            this.active = true;
            this.carrierId = undefined;
            this.associatedVessel = undefined;
            this.guid = undefined;
            this.type = undefined;
        }

        MobileTerminal.fromJson = function(data){
            var mobileTerminal = new MobileTerminal();

            mobileTerminal.active = !data.inactive;
            mobileTerminal.guid = data.mobileTerminalId.guid;
            mobileTerminal.source = data.source;
            mobileTerminal.type = data.type;

            //CarrierId
            if (angular.isDefined(data.carrierId)) {
                mobileTerminal.carrierId = CarrierId.fromJson(data.carrierId);
            }

            //Attributes
            if (data.attributes !== null) {
                mobileTerminal.attributes = {};
                for (var i = 0; i < data.attributes.length; i++) {
                    var value = data.attributes[i].value;
                    if (angular.isDefined(value) && String(value).trim().length > 0){
                        mobileTerminal.attributes[data.attributes[i].type.toUpperCase()] = value;
                    }
                }
            }

            //Channels
            if (data.channels !== null) {
                mobileTerminal.channels = [];
                for (var idx = 0; idx < data.channels.length; idx++) {
                    mobileTerminal.channels.push(CommunicationChannel.fromJson(data.channels[idx]));
                }

                //sortchannels by order
                if (mobileTerminal.channels.length > 1) {
                    mobileTerminal.channels.sort(function (obj1, obj2){
                        if (obj1.order !== undefined && obj2.order !== undefined){
                            return obj1.order - obj2.order;
                        } else {
                            return;
                        }
                    });
                }
            }

            return mobileTerminal;
        };

        MobileTerminal.prototype.dataTransferObject = function() {
            //Create array of attributes
            var attributesObjects = [];
            if (this.type === 'INMARSAT_C') {
                $.each(this.attributes, function(key, value){
                    if(INMARSAT_C_ATTRIBUTES.indexOf(key) >= 0 && angular.isDefined(value) && String(value).trim().length > 0){
                        attributesObjects.push({"type": key, "value": value});
                    }
                });
            }

            //Create array of Channels in json format
            var jsonChannels = [];
            $.each(this.channels, function(index, value){
                var channelObject = JSON.parse(value.toJson());
                jsonChannels.push(channelObject);
            });

            return {
                attributes : attributesObjects,
                channels : jsonChannels,
                mobileTerminalId : { guid: this.guid }
            };
        };

        MobileTerminal.prototype.toJson = function(){
            return JSON.stringify(this.dataTransferObject());
        };

        MobileTerminal.prototype.copy = function() {
            var copy = new MobileTerminal();
            copy.active = this.active;
            copy.associatedVessel = this.associatedVessel;
            copy.source = this.source;
            for (var key in this.attributes) {
                if (this.attributes.hasOwnProperty(key)) {
                    copy.attributes[key] = this.attributes[key];
                }
            }

            copy.type = this.type;
            copy.guid = this.guid;
            copy.channels = this.channels.map(function(ch) {
                return ch.copy();
            });

            if (this.carrierId) {
                copy.carrierId = this.carrierId.copy();
            }

            return copy;
        };

        //Used when activating, inactivating and removing
        MobileTerminal.prototype.toSetStatusJson = function() {
            return JSON.stringify({ guid: this.guid });
        };

        MobileTerminal.prototype.getCarrierAssingmentDto = function(carrierId) {
            return {
                mobileTerminalId: { guid: this.guid },
                carrierId: carrierId
            };
        };

        MobileTerminal.prototype.toAssignJson = function(carrierId){
            return JSON.stringify(this.getCarrierAssingmentDto(carrierId));
        };

        MobileTerminal.prototype.toUnassignJson = function() {
            return JSON.stringify(this.getCarrierAssingmentDto(this.carrierId));
        };

        MobileTerminal.prototype.toCreatePoll = function() {
            return {
                mobileTerminal: { guid: this.guid },
                comChannel: this.channels[0].dataTransferObject()
            };
        };

        MobileTerminal.prototype.setSystemTypeToInmarsatC = function(){
            this.type = 'INMARSAT_C';

            //TODO: Is this neeeded? /Gustav
            this.oceanRegion = undefined;
            this.satteliteNumber = undefined;
            this.serialNumber = undefined;
            this.transceiverType = undefined;
            this.softwareVersion = undefined;
            this.antenna = undefined;
            this.answerBack = undefined;
            this.installedBy = undefined;
            this.installedOn = undefined;
            this.startedOn = undefined;
            this.uninstalledOn = undefined;
            this.landEarthStation = undefined;
            this.expectedRepFreq = undefined;
            this.gracePeriod = undefined;
            this.inPortGracePeriod = undefined;
        };

        //Add a new channel to the end of the list
        MobileTerminal.prototype.addNewChannel = function(){
            this.channels.push(new CommunicationChannel());
        };

        //Unassign the mobileTerminal from its carrier
        MobileTerminal.prototype.unassign = function(){
            this.carrierId = undefined;
            this.associatedVessel = undefined;
        };

        //Check if the mobileTerminal is assigned to a carrier
        MobileTerminal.prototype.isAssigned = function(){
            return this.carrierId !== undefined && this.carrierId.value !== undefined;
        };

        //Assign the mobileTerminal to a vessel by internalId
        MobileTerminal.prototype.assignToVesselWithIrcs = function(ircs){
            this.carrierId = CarrierId.createVesselWithIrcs(ircs);
        };

        //Set the attributes
        MobileTerminal.prototype.setAttributes = function(attributes){
            this.attributes = attributes;
        };

        //Set the channels
        MobileTerminal.prototype.setChannels = function(channels){
            this.channels = channels;
        };

        //Set the active status
        MobileTerminal.prototype.setActive = function(active){
            this.active = active;
        };

        //Set associated vessel
        MobileTerminal.prototype.setAssociatedVessel = function(vessel){
            return this.associatedVessel = vessel;
        };

        MobileTerminal.prototype.getSerialNumber = function() {
            return this.attributes["SERIAL_NUMBER"];
        };

        MobileTerminal.prototype.getSystemType = function() {
            return this.type;
        };

        MobileTerminal.prototype.isEqualTerminal = function(item) {
            if(item.getSerialNumber() === this.getSerialNumber() && item.getSystemType() === this.getSystemType()){
                return true;
            }else{
                return false;
            }
        };

        return MobileTerminal;
    });