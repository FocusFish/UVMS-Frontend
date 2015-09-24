var MenuPage = function () {
    var EC = protractor.ExpectedConditions;

    var Panel = require('../../shared/e2e/panel');


    this.users = element.all(by.css('.navbar .nav')).all(by.linkText("Users"));
    this.roles = element.all(by.css('.navbar .nav')).all(by.linkText("Roles"));
    this.organisations = element.all(by.css('.navbar .nav')).all(by.linkText("Organisations"));
    this.scopes = element.all(by.css('.navbar .nav')).all(by.linkText("Scopes"));
    this.applications = element.all(by.css('.navbar .nav')).all(by.linkText("Applications"));
    this.policies = element.all(by.css('.navbar .nav')).all(by.linkText("Policies"));
	this.changes = element.all(by.css('.navbar .nav')).all(by.linkText("Changes"));

    this.changeSecurityQuestions  = element(by.linkText("Change Security Answer"));
	this.updateContactDetails = element(by.linkText("Update Contact Details"));

    //this.userDropDown = element(by.id('header')).element(by.css('ul li:last-child.dropdown'));
    this.userDropDown = element(by.css('.dropdown-toggle'));

    //this.logOut = this.userDropDown.element(by.linkText("Log out"));
    this.logOut = element(by.css('[ng-click="logout()"]'))

    this.switchContext = this.userDropDown.element(by.linkText("Switch Context"));
    this.username = element(by.model('login.userName'));
    //this.changePassword = this.userDropDown.element(by.linkText("Change Password"));
    this.changePassword = element(by.linkText("Change Password"));

    //Buttons panel
    this.saveButton = element.all(by.buttonText('Save')).get(0); //Save button from the panel
    this.cancelButton = element(by.buttonText('Cancel')); //Cancel button from the panel

    this.successElement = element(by.id('btn-success'));

    //Message panel
    this.setPanelMessage = element(by.binding('actionMessage'));

    //  this.setPanelMessage = element(by.css('[ng-bind-html="actionMessage"]'));

    //Variables panel Set User Password
    this.currentPassword = element(by.id('currentPassword'));
    this.newPassword = element(by.model('passwordData.newPassword'));
    this.confirmPassword = element(by.model('passwordData.confirmPassword'));

    //Variables panel Select User Context
    //button Cancel
    this.cancelButtonSelectUserContext = element(by.buttonText('Cancel'));

    this.clickCancelButtonSelectUserContext = function () {
        browser.wait(EC.elementToBeClickable(this.cancelButtonSelectUserContext), 10000);
        this.cancelButtonSelectUserContext.click();
    };

    this.selectContext= function(context) {
        element.all(by.css('div .modal-dialog ul li')).all(by.linkText(context)).click();
    }

    this.clickSelectContext = function(context) {
        this.selectContext(context).click();
        // browser.wait(EC.visibilityOf(this.contextUserTab), 10000);
    };

    //end panel Select User Context
    this.clickHome = function () {
        this.home.click();
    };
    this.clickUsers = function () {
        this.users.click();
    };
    this.clickOrganisations = function () {
        this.organisations.click();
    };
    this.clickRoles = function () {
        this.roles.click();
    };
    this.clickScopes = function () {
        this.scopes.click();
    };
    this.clickApplications = function () {
        this.applications.click();
    };
    this.clickPolicies = function () {
        this.policies.click();
    };
    this.clickChanges = function () {
        this.changes.click();
    };

    this.clickMenuSelectContext = function (context) {
        this.userDropDown.click();
        browser.wait(EC.elementToBeClickable(this.switchContext), 10000);

        this.switchContext.click().then(function() {
            //console.log("switchContext clicked");
            browser.waitForAngular();
            this.selectContext(context).click();
        });
    }

    this.clickLogOut = function () {
        this.userDropDown.click();
        browser.wait(EC.elementToBeClickable(this.logOut), 10000);

        this.logOut.click().then(function() {
            //console.log("logout clicked");
            browser.waitForAngular();

        });

        //browser.wait(EC.elementToBeClickable(this.username), 10000);
    };

    this.clickChangePassword = function () {
        this.userDropDown.click().then(function() {
            //console.log("userDropDown clicked");
            browser.waitForAngular();
        });
        browser.wait(EC.elementToBeClickable(this.changePassword), 10000);
        this.changePassword.click().then(function() {
            //console.log("changePassword clicked");
            browser.waitForAngular();
        });
    };

    this.clickUpdateContactDetails = function () {
        this.userDropDown.click().then(function() {
            //console.log("userDropDown clicked");
            browser.waitForAngular();
        });
        browser.wait(EC.elementToBeClickable(this.updateContactDetails), 10000);
        this.updateContactDetails.click().then(function() {
            browser.waitForAngular();
        });
    };

    this.clickChangeSecurityQuestions = function () {
        this.userDropDown.click().then(function() {
            //console.log("userDropDown clicked");
            browser.waitForAngular();
        });
        browser.wait(EC.elementToBeClickable(this.changeSecurityQuestions), 10000);
        this.changeSecurityQuestions.click().then(function() {
            browser.waitForAngular();
        });
    };

    //Inform the current password field
    this.applyCurrentPassword = function (password) {
        this.currentPassword.click();
        this.currentPassword.clear();
        this.currentPassword.sendKeys(password);
    };

    //Inform the new password field
    this.applyNewPassword = function (newPassword) {
        this.newPassword.clear();
        this.newPassword.sendKeys(newPassword);
    };

    //Inform the repeated password field
    this.applyConfirmPassword = function (repeatedPassword) {
        this.confirmPassword.clear();
        this.confirmPassword.sendKeys(repeatedPassword);
    };

    //Press the Save Password button
    this.clickSaveButton = function() {
        browser.wait(EC.elementToBeClickable(this.saveButton), 10000);
        this.saveButton.click();

    };

    //Press the Save Password button with success
    this.clickSaveButtonSuccess = function() {
        var deferred = '';

        browser.wait(EC.elementToBeClickable(this.saveButton), 10000);
        this.saveButton.click();

        browser.wait(function() {
            deferred = protractor.promise.defer();
            element(by.id('btn-success')).isPresent()
                .then(function (isPresent) {
                    deferred.fulfill(!isPresent);
                });
            return deferred.promise;
        });
    };

    //Press the Cancel Password button
    this.clickCancelButton = function() {
        this.cancelButton.click();
    };

    this.informSetPasswordPanel=function(password1,password2,password3){
        this.applyCurrentPassword(password1);
        this.applyNewPassword(password2);
        this.applyConfirmPassword(password3);
    };

    this.getPanelMessage = function () {
        return this.setPanelMessage.getText();
    };


    this.getPageUrl = function () {
        return browser.getCurrentUrl();
    };

};
module.exports = MenuPage;

