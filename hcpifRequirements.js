/**
 * Requirements for HCPIF form
 */

var dateSubmitted; // current date - uneditable
var effectiveDate; // calendar option

var legalName; //required
var hotelName; //required
var address_1; //required
var address_2;
var address_3;
var address_4;
var city; //required
var state; //required if US
var province; //required if CAN
var country; //drop down selections
var postalCode; //required if US
var taxId; // required (validation available?)
var firstName; //required
var lastName; //required
var paymentMethod; //required
var currency; //required
var email; //required (format validated)
var preferredLanguage; //required

var directDebitForms; //options

var countryOpts = {
    "Italy":{
        "ddFormLink":"link goes here",
        "currency": ["EUR"],
        "paymentMethods": ["Check","Credit Card","Direct Debit","Wire"]
    },
    "France":{
        "ddFormLink":"",
        "currency":[],
        "paymentMethods": [];
    },
    "":{
        "ddFormLink":"",
        "currency":[],
        "paymentMethods":[]
    },

};

setItems(); //takes an array as a parameter

function ctrySelection(ctry){
    
}

// to call the object notation with the target value:
// countryOpts[target].property
// countryOpts[target].currency
// countryOpts[target].paymentMethods

// javascript onblur action for country field

/* 
var target = event.target.value;
fieldSettings(target);
*/



var country = this.getField('country');
var currency = this.getField('currency');

function fieldSettings(target){
	currency.setItems(countryOpts[target].currency);
}

countryOpts[target].currency