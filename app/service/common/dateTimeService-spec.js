describe('dateTimeService', function($provide) {

  beforeEach(module('unionvmsWeb'));

    beforeEach(module(function ($provide) {
        $provide.service('globalSettingsService', function() {
            return {
                getTimezone: function() {
                    return 60;
                },
                getDateFormat: function() {
                    return '';
                }
            };
        });
  }));

  it('isFormattedAsUnixSecondsTimstamp() should return true only for unix timstamps consisting of 9-10 digits', inject(function(dateTimeService) {
    var d;

    //9 digits
    d = '196416552';
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeTruthy();

    //10 digits
    d = '1964165522';
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeTruthy();

    //number 9 digits
    d = 196416552;
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeTruthy();

    //> 10 digits
    d = '1444116559472';
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeFalsy();

    //> 10 digits number
    d = 1444116559472;
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeFalsy();

    //< 9digits
    d = '19641655';
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeFalsy();

    //other date format
    d = '2015-11-18 13:49:00 +01:00';
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeFalsy();

    //undefined
    d = undefined;
    expect(dateTimeService.isFormattedAsUnixSecondsTimstamp(d)).toBeFalsy();
  }));


  it('isFormattedAsUnixMillisecondsTimstamp() should return true only for unix timstamps consisting of 12-13 digits', inject(function(dateTimeService) {
    var d;

    //13 digits
    d = '1444116559472';
    expect(dateTimeService.isFormattedAsUnixMillisecondsTimstamp(d)).toBeTruthy();

    //13 digits number
    d = 1444116559472;
    expect(dateTimeService.isFormattedAsUnixMillisecondsTimstamp(d)).toBeTruthy();

    //12 digits
    d = '144411655947';
    expect(dateTimeService.isFormattedAsUnixMillisecondsTimstamp(d)).toBeTruthy();

    //< 12 digits
    d = '14441165594';
    expect(dateTimeService.isFormattedAsUnixMillisecondsTimstamp(d)).toBeFalsy();

    //> 13 digits number
    d = 14441165594722;
    expect(dateTimeService.isFormattedAsUnixMillisecondsTimstamp(d)).toBeFalsy();

    //other date format
    d = '2015-11-18 13:49:00 +01:00';
    expect(dateTimeService.isFormattedAsUnixMillisecondsTimstamp(d)).toBeFalsy();

    //undefined
    d = undefined;
    expect(dateTimeService.isFormattedAsUnixMillisecondsTimstamp(d)).toBeFalsy();
  }));

  it('isFormattedWithTimeZone() should return true only for utc dateTimes on specified format', inject(function(dateTimeService) {
    var d;

    //Colon in timezone
    d = '2015-11-18 13:49:00 +01:00';
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeTruthy();

    //Colon in timezone
    d = '2015-11-18 13:49:00 -01:00';
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeTruthy();

    //Without colon in timezone
    d = '2018-01-22 18:12:85 +0200';
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeTruthy();

    //Without colon in timezone
    d = '2018-01-22 18:12:85 -0200';
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeTruthy();

    //Missing space
    d = '2015-11-18 13:49:00+01:00';
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeFalsy();

    //Incorrect date format, year should be 4 digits
    d = '15-11-18 13:49:00 +02:00';
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeFalsy();

    //No timezone
    d = '2015-11-18 13:49:00';
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeFalsy();

    //Date object
    d = new Date("Sep 2, 2015 12:34:56");
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeFalsy();

    //undefined
    d = undefined;
    expect(dateTimeService.isFormattedWithTimeZone(d)).toBeFalsy();
  }));


  it('toUTC should format date and time correct', inject(function(dateTimeService) {

    var d;

    //Without colon in timezone
    d = '2015-11-18 13:49:00 +01:00';
    expect(dateTimeService.toUTC(d)).toEqual('2015-11-18 12:49:00');

    //Without colon in timezone +
    d = '2015-10-14 16:20:00 +0200';
    expect(dateTimeService.toUTC(d)).toEqual('2015-10-14 14:20:00');

    //Without colon in timezone -
    d = '2015-10-14 12:20:00 -0200';
    expect(dateTimeService.toUTC(d)).toEqual('2015-10-14 14:20:00');

    //Already formatted as UTC
    d = '2015-10-14 12:20:00';
    expect(dateTimeService.toUTC(d)).toEqual(d);

    //Unix milliseconds as string
    d = '1444116559472';
    expect(dateTimeService.toUTC(d)).toEqual('2015-10-06 07:29:19');

    //Unix milliseconds as number
    d = 1444116559472;
    expect(dateTimeService.toUTC(d)).toEqual('2015-10-06 07:29:19');

    //Unix seconds as string
    d = '1444116559';
    expect(dateTimeService.toUTC(d)).toEqual('2015-10-06 07:29:19');

    //Unix seconds as number
    d = 1444116559;
    expect(dateTimeService.toUTC(d)).toEqual('2015-10-06 07:29:19');

    //undefined
    d = undefined;
    expect(dateTimeService.toUTC(d)).toBeUndefined();

    //Strange format
    d = 'STRANGE DATE FORMAT';
    expect(dateTimeService.toUTC(d)).toEqual(d, "Should return input value.");
  }));


  it('formatUTCDateWithTimezone should format date and time correct', inject(function(dateTimeService) {
    var d;

    //Already formatted with timezone, the change timezone
    d = '2015-11-18 13:49:00 +01:00';
    expect(dateTimeService.formatUTCDateWithTimezone(d)).toEqual('2015-11-18 12:49:00 +00:00');

    //String date
    d = '2015-09-18 11:49:00';
    expect(dateTimeService.formatUTCDateWithTimezone(d)).toEqual('2015-09-18 10:49:00 +00:00');

    //Strange format
    d = 'STRANGE DATE FORMAT';
    expect(dateTimeService.formatUTCDateWithTimezone(d)).toEqual('Invalid date');

    //MomentJS
    d = moment.utc();
    expect(dateTimeService.formatUTCDateWithTimezone(d)).not.toEqual('Invalid date');

    //Undefined
    d = undefined;
    expect(dateTimeService.formatUTCDateWithTimezone(d)).toBeUndefined();
  }));


  it('formatAccordingToUserSettings should format correct', inject(function(dateTimeService) {
    var d;

    //Timezone format
    d = '2015-11-18 13:49:00 +01:00';
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual('2015-11-18 13:49');

    //Without timezone
    d = '2018-02-03 04:05:00';
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual('2018-02-03 05:05');

    //Unix milliseconds and seconds
    d = '1444116559472';
    var d2 = '1444116559';
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual('2015-10-06 08:29');
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual(dateTimeService.formatAccordingToUserSettings(d));

    //Unix milliseconds as number
    d = 1444116604804;
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual('2015-10-06 08:30');

    //Unix seconds
    d = '196416552'
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual('1976-03-23 09:09');

    //Unix seconds as number
    d = 196416552;
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual('1976-03-23 09:09');

    //Strange format
    d = 'STRANGE DATE FORMAT';
    expect(dateTimeService.formatAccordingToUserSettings(d)).toEqual(d);

    //Undefined
    expect(dateTimeService.formatAccordingToUserSettings(undefined)).toBeUndefined();
  }));


});


/*FILTERS*/
describe('confDateFormat filter', function() {

    beforeEach(module('unionvmsWeb'));

    beforeEach(module(function ($provide) {
        $provide.service('globalSettingsService', function() {
            return {
                getTimezone: function() {
                    return 240; //4 hours
                },
                getDateFormat: function() {
                    return '';
                }
            };
        });
    }));

    it('should format date according to configuration', inject(function($filter) {

        var filter = $filter('confDateFormat');
        var d;
        //Valid date
        d = '2018-02-03 04:05:00';
        expect(filter(d)).toEqual('2018-02-03 08:05');

        //Date object
        d = 196416552;
        expect(filter(d)).toEqual('1976-03-23 12:09');

        //Undefined
        expect(filter(undefined)).toBeUndefined();

        //Strange date
        d = 'STRANGE DATE FORMAT';
        expect(filter(d)).toEqual(d);

    }));

});