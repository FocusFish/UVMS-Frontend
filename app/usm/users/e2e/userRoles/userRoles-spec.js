var LoginPage = require('../../../shared/e2e/loginPage');
var MenuPage = require('../../../shared/e2e/menuPage');
var UsersPage = require('../account/usersPage');

describe('User Contexts page', function() {
    var menuPage = new MenuPage();
    var loginPage = new LoginPage();
    var usersPage = new UsersPage();
    var initialRolesCount;
    var finalRolesCount;

    var LOGIN_PAGE = '#/login';

    beforeEach(function () {
        // login
        loginPage.visit();
        loginPage.login('usm_bootstrap', 'password');

        // select Users from menu
        menuPage.clickUsers();

        // take the count before searching
        usersPage.getTableResultsRows().count().then(function (rowCount) {
            initialRolesCount = rowCount;
            expect(initialRolesCount > 0).toBeTruthy();
        });
    });

    it('should test users page serach filters', function () {
        // set the criteria and search
		// usersPage.setOrganization("F");
		// usersPage.setStatus("E")
        usersPage.setSearchUser("vms_user");
		usersPage.clickSearchButton();

        // take the count after searching
        usersPage.getTableResultsRows().count().then(function (rowCount) {
            finalRolesCount = rowCount;
            // check the new count to be less equal to the inital one
            expect(finalRolesCount <= initialRolesCount).toBeTruthy();
        });

        // check the content of the serch results
        usersPage.getTableResultsRows().each(function (row) {
            var columns = row.$$('td');
            expect(columns.get(0).getText()).toMatch('vms_user*');
        });

		browser.waitForAngular();
    });

    it('should test users view context', function () {
        // set the criteria and search
        usersPage.setSearchUser("vms_user");
        usersPage.clickSearchButton();

		// This line click on the last column of the table of results, that should be the view button
		element.all(by.repeater('user in displayedUsers')).get(0).$('td:last-child span:last-child button').click();

		// This line click on the User 'Context' tab
		element(by.linkText('Contexts')).click();

		browser.waitForAngular();
    });

    it('should test users new context', function () {
        // set the criteria and search
        usersPage.setSearchUser("vms_user");
        usersPage.clickSearchButton();

		// This line click on the last column of the table of results, that should be the view button
		element.all(by.repeater('user in displayedUsers')).get(0).$('td:last-child span:last-child button').click();

		// This line click on the User 'Context' tab
		element(by.linkText('Contexts')).click();

		// This line click on the 'New' button of the selected User Context
		element(by.id('new_user_context')).click();

		// This line click on the New dialog role's combobox
		element(by.cssContainingText('option', 'Super User')).click();

		// This line click on the New dialog scopes's combobox
		element(by.cssContainingText('option', 'Some Reports')).click();

		// This line click on the 'New' button of the selected User Context
		element(by.buttonText('Save')).click();

        //element.all(by.repeater('uc in displayedUserContexts')).then(function(rows) {
        //    console.log(rows.length);
        //});

		browser.wait(function() {
		  var deferred = protractor.promise.defer();
		  element(by.id('btn-success')).isPresent()
			.then(function (isPresent) {
			  deferred.fulfill(!isPresent);
			});
		  return deferred.promise;
		});

        //element.all(by.repeater('uc in displayedUserContexts')).then(function(rows) {
        //    console.log(rows.length);
        //});

        //var grid2 = $$('.panel-default tbody tr');
        //expect(grid2.count()).toBe(initial_rows_count);

        //grid.each(function(row) {
        //   var rowElems = row.$$('td');
        //   console.log(rowElems.count());
        //   expect(rowElems.count()).toBe(3);
        //   expect(rowElems.get(0).getText()).toMatch('/Col1$/');
        //});
    });

    it('should test users edit context', function () {
        // set the criteria and search
        usersPage.setSearchUser("vms_user");
        usersPage.clickSearchButton();

        // This line click on the last column of the table of results, that should be the view button
        element.all(by.repeater('user in displayedUsers')).get(0).$('td:last-child span:last-child button').click();

        // This line click on the User 'Context' tab
        element(by.linkText('Contexts')).click();

        // This line click on the 'New' button of the selected User Context
        element(by.id('user_context_edit')).click();

        // This line click on the Edit dialog role's combobox
        element(by.cssContainingText('option', 'User')).click();

        // This line click on the Edit dialog scopes's combobox
        element(by.cssContainingText('option', 'FRA Quotas')).click();

        // This line click on the 'New' button of the selected User Context
        element(by.buttonText('Save')).click();

        // This line click on the 'Confirm' button of the selected User Context
        element(by.buttonText('Confirm')).click();

        browser.wait(function() {
            var deferred = protractor.promise.defer();
            element(by.id('btn-success')).isPresent()
                .then(function (isPresent) {
                    deferred.fulfill(!isPresent);
                });
            return deferred.promise;
        });
    });

    it('should test users delete context', function () {
        // set the criteria and search
        usersPage.setSearchUser("vms_user");
        usersPage.clickSearchButton();

        // This line click on the last column of the table of results, that should be the view button
        element.all(by.repeater('user in displayedUsers')).get(0).$('td:last-child span:last-child button').click();

        // This line click on the User 'Context' tab
        element(by.linkText('Contexts')).click();

        // This line click on the 'New' button of the selected User Context
        element(by.id('user_context_delete')).click();

        // This line click on the 'Delete' button of the selected User Context
        element(by.buttonText('Delete')).click();

        // This line click on the 'Confirm' button of the selected User Context
        element(by.buttonText('Confirm')).click();

        browser.wait(function() {
            var deferred = protractor.promise.defer();
            element(by.id('btn-success')).isPresent()
                .then(function (isPresent) {
                    deferred.fulfill(!isPresent);
                });
            return deferred.promise;
        });
    });

    afterEach(function () {
		loginPage.gotoHome();

        // logout
        menuPage.clickLogOut();
        expect(loginPage.getPageUrl()).toBe(LOGIN_PAGE);
    });
});
