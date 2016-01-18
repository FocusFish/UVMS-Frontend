(function() {
    angular.module('unionvmsWeb').factory('assetCsvService', function(locale, csvService, $filter, globalSettingsService) {
        return {
            download: function(asset) {
                var header = getHeader(asset);
                var rows = getRows(asset);
                var filename = getCsvFilename(asset);
                csvService.downloadCSVFile(rows, header, filename);
            }
        };

        function getHeader(asset) {


            return [
                locale.getString('vessel.vessel_details_flagstate'),
                locale.getString('vessel.vessel_details_IRCS_code'),
                locale.getString('vessel.vessel_details_name'),
                locale.getString('vessel.vessel_details_ext_marking'),
                locale.getString('vessel.vessel_details_CFR'),
                locale.getString('vessel.vessel_details_IMO'),
                locale.getString('vessel.vessel_details_home_port'),
                locale.getString('vessel.vessel_details_gear_type'),
                locale.getString("vessel.vessel_details_MMSI_no"),
                locale.getString("vessel.vessel_details_license_type"),
                getLengthHeader(),
                getTonnageHeader(),
                getMainPowerHeader(),
                locale.getString("vessel.po_name"),
                locale.getString("vessel.po_code"),
                locale.getString("vessel.vessel_details_contact_name"),
                locale.getString("vessel.vessel_details_email"),
                locale.getString("vessel.vessel_details_contact_number"),
                locale.getString("vessel.notes")
            ];
        }

        function getRows(asset) {
            return [[
                asset.countryCode,
                asset.ircs,
                asset.name,
                asset.externalMarking,
                asset.cfr,
                asset.imo,
                asset.homePort,
                asset.gearType,
                asset.mmsiNo,
                asset.licenseType,
                $filter('length')(asset.lengthValue),
                asset.grossTonnage,
                asset.powerMain,
                asset.producer.name,
                asset.producer.code,
                asset.contact.name,
                asset.contact.email,
                asset.contact.number,
                asset.notes
            ]];
        }

        function getCsvFilename(asset) {
            return asset.vesselId.guid + '.csv';
        }

        function getLengthHeader() {
            var unit = locale.getString("common.short_length_unit_" + globalSettingsService.getLengthUnit());
            var length = locale.getString("vessel.vessel_details_length");
            return length + " (" + unit + ")";
        }

        function getTonnageHeader() {
            var tonnage = locale.getString("vessel.vessel_details_tonnage");
            var unit = locale.getString("common.tons");
            return tonnage + " (" + unit + ")";
        }

        function getMainPowerHeader() {
            var mainPower = locale.getString("vessel.vessel_details_main_power");
            var unit = locale.getString("common.kw");
            return mainPower + " (" + unit + ")";
        }
    });
})();
