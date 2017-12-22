
function CustomJavaScript()
{
	FC_NUMBER_VALIDATION_RE = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
FC_NUMBER_KEYSTROKE_RE = /^-?\d*\.?\d*$/;
FC_DATE_KEYSTROKE_RE = /^[0-9/]*$/;
FC_INVALID_NUMBER_WARNING = 'Please enter a valid number (example: 1234.56).';
FC_INVALID_CURRENCY_WARNING = 'Please enter a valid currency (example: $1234.56).';
FC_INVALID_DATE_WARNING = 'Please enter a valid date (example: 09/17/1961).';
FC_INVALID_PERCENT_WARNING = 'Please enter a valid percentage (example: 31.42%).';
FC_CURRENCY_SYMBOL = '\u0024';
FC_PREPEND_CURRENCY = true;
FC_SPACE_BEFORE_PERCENT = false;
FC_REQUIRED = 'Please fill in the required field before continuing.';
FieldValidationPending = false;

function FCParseNumber(value)
{
    if (FC_NUMBER_VALIDATION_RE.test(value))
        return parseFloat(value);

    return null;
}

function FCNumber_Keystroke(errorMessage, precision)
{
    var value = AFMergeChange(event);
    if (!value)
        return;

    if (event.willCommit)
    {
        var num = FCParseNumber(value);
        if (num == null)
        {
            event.rc = false;
            if (!event.silenceErrors)
                app.alert(errorMessage);
        }
        else
        {
           if (precision != undefined)
              num = num.toFixed(precision);
           var n = Math.abs(num);
           if (n >= 1e15)
           {
              event.rc = false;
              if (!event.silenceErrors)
                  app.alert('Please enter a smaller number.');
           }
           else
           {
              if (n.toString().length > 16)
              {
                  event.rc = false;
                  if (!event.silenceErrors)
                      app.alert('Number field supports up to 15 digits. Please modify your entry.');
              }
              else
              {
                  event.value = num;
              }
           }
        }

        FieldValidationPending = !event.rc;
    }
    else
    {
        if (!FC_NUMBER_KEYSTROKE_RE.test(value))
        {
            app.beep(0);
            event.rc = false;
        }
    }
}

function FCDate_Keystroke(errorMessage, format)
{
    var value = AFMergeChange(event);
    if (!value)
        return;

    if (event.willCommit)
    {
        var date = AFParseDateEx(event.value, format);
        if (!date)
        {
            event.rc = false;
            if (!event.silenceErrors)
              app.alert(errorMessage);
        }

        FieldValidationPending = !event.rc;
    }
    else
    {
        if (!FC_DATE_KEYSTROKE_RE.test(value))
        {
            app.beep(0);
            event.rc = false;
        }
    }
}

function FCNumber_Format(value)
{
   if (value.length == 0)
      return '';

   var parts = value.split('.');
   var intPart = parts[0];

   var re = /(\d+)(\d{3})/;
   while (re.test(intPart))
   {
      intPart = intPart.replace(re, '$1,$2');
   }

   var result = intPart;
   if (parts.length == 2)
      result = result + '.' + parts[1];

   return result;
}

function FCPercent_Format(value)
{
   var result = '';
   if (value.length > 0)
   {
      result = FCNumber_Format(value);

      if (FC_SPACE_BEFORE_PERCENT)
      {
         result += ' ';
      }

      result += '%';
   }

   return result;
}

function FCCurrency_Format(value)
{
   var result = '';
   if (value.length > 0)
   {
      var num = FCNumber_Format(value);
      if (FC_PREPEND_CURRENCY)
      {
         if (num.charAt(0) == '-')
            result = '-' + FC_CURRENCY_SYMBOL + num.substring(1);
         else
            result = FC_CURRENCY_SYMBOL + num;
      }
      else
         result = num + FC_CURRENCY_SYMBOL;
   }
   return result;
}

function FCEmail_Validate()
{
   var valid = true;
   if (event.value)
   {
      var usernameInitialChars = '[a-zA-Z0-9!#$%&*+/?^_`{|}~-]';
      var usernameChars = '[a-zA-Z0-9!#$%&*+/?^_`{|}~\'=-]';
      var username = '%1%2*(?:\\.%2+)*'.replace(/%1/g, usernameInitialChars).replace(/%2/g, usernameChars);

      var domainnameChars = '[a-zA-Z0-9-]';
      var domainname = '(?:%1+\\.)+%1{2,}'.replace(/%1/g, domainnameChars);

      var email = '^%1@%2$';
      var re = RegExp(email.replace(/%1/, username).replace(/%2/, domainname));

      valid = re.test(event.value.replace(/\s*/g,''));
      if (!valid)
      {
         app.alert('Please enter a valid email address (example: john123@somecompany.com).');
      }
   }
   event.rc = valid;
   FieldValidationPending = !valid;
}

function TextDataLimit(min, max)
{
   var len = event.value.length;
   var valid = ((len == 0) || ((min == 0 || len >= min) && (max == 0 || len <= max)));
   if (!valid)
   {
      var warning;

      if (min == max)
      {
         warning = 'Please enter a value exactly {0} characters long.';
         warning = warning.replace('{0}', min);
      }
      else if (max == 0)
      {
         warning = 'Please enter at least {0} characters.';
         warning = warning.replace('{0}', min);
      }
      else
      {
         warning = 'Please enter a value between {0} and {1} characters long.';
         warning = warning.replace('{0}', min);
         warning = warning.replace('{1}', max);
      }

      app.alert(warning);
   }

   event.rc = valid;
   FieldValidationPending = !valid;
}

function CheckBoxSelectionCount(arr)
{
   var numSelected = 0;
   for (var i = 0; i < arr.length; i++)
   {
      if (this.getField(arr[i]).value == 'Yes')
         numSelected++;
   }
   return numSelected;
}

function CheckBox_DataLimit_AlertMsg(min, max)
{
   var alertMsg = '';

   if (min == 0)
   {
      alertMsg = 'Please select no more than {0} choice(s).';
      alertMsg = alertMsg.replace('{0}', max);
   }
   else if (max == 0)
   {
      alertMsg = 'Please select at least {0} choice(s).';
      alertMsg = alertMsg.replace('{0}', min);
   }
   else if (min == max)
   {
      alertMsg = 'Please select exactly {0} choice(s).';
      alertMsg = alertMsg.replace('{0}', max);
   }
   else
   {
      alertMsg = 'Please select between {0} and {1} choices.';
      alertMsg = alertMsg.replace('{0}', min);
      alertMsg = alertMsg.replace('{1}', max);
   }
   return alertMsg;
}

function CheckBoxMaxDataLimit_Choice(arr, min, max)
{
   var numSelected = CheckBoxSelectionCount(arr);
   if (numSelected > max)
   {
      if (event.target.value == 'Yes')
         event.target.value = 'Off';

      var alertMsg = CheckBox_DataLimit_AlertMsg(min, max);
      app.alert(alertMsg);
   }
}

function CheckBoxMaxDataLimit_OtherText(arr, min, max, oOtherChoiceFld)
{
   var numSelected = CheckBoxSelectionCount(arr);
   if (numSelected < max)
   {
      oOtherChoiceFld.value = 'Yes';
   }
   else
   {
      var alertMsg = CheckBox_DataLimit_AlertMsg(min, max);
      app.alert(alertMsg);
      oOtherChoiceFld.setFocus();
      event.rc = false;
   }
}

function CheckBoxMinDataLimit(arr, required, min, max)
{
   var numSelected = CheckBoxSelectionCount(arr);
   var alertMsg = null;

   if (required && numSelected == 0)
   {
      alertMsg = FC_REQUIRED;
   }
   else if ((numSelected > 0) && (numSelected < min))
   {
      alertMsg = CheckBox_DataLimit_AlertMsg(min, max);
   }

   if (alertMsg != null)
   {
      app.alert(alertMsg);
      this.getField(arr[0]).setFocus();
      return false;
   }

   return true;
}

function SingleCheckBoxRequiredValidation(checkBoxFieldName)
{
   if (this.getField(checkBoxFieldName).value != 'Yes')
   {
      app.alert(FC_REQUIRED);
      this.getField(checkBoxFieldName).setFocus();
      return false;
   }

   return true;
}

function DateDataLimit(min, max, format)
{
   if (min == 0 && max == 0)
   {
      FieldValidationPending = false;
      event.rc = true;
      return;
   }

   var MS_PER_DAY = 86400000;
   var EPOCH = new Date(100, 0, 1);

   var date = AFParseDateEx(event.value, format);
   date.setMilliseconds(0);

   var minDate = 0;
   var minDateStr;
   if (min > 0)
   {
      minDate = new Date(EPOCH.getTime() + (MS_PER_DAY * min));
      minDate.setHours(0, 0, 0);
      minDateStr = util.printd(format, minDate);
   }

   var maxDate = 0;
   var maxDateStr;
   if (max > 0)
   {
      maxDate = new Date(EPOCH.getTime() + (MS_PER_DAY * max));
      maxDate.setHours(0, 0, 0);
      maxDateStr = util.printd(format, maxDate);
   }

   var valid = ((event.value == '') ||
                ((!minDate || date.getTime() >= minDate.getTime()) &&
                 (!maxDate || date.getTime() <= maxDate.getTime())));

   if (!valid)
   {
      var warning;

      if (min == max)
      {
         warning = 'Please enter a date as {0}.';
         warning = warning.replace('{0}', minDateStr);
      }
      else if (min && max)
      {
         warning = 'Please enter a date between {0} and {1}.';
         warning = warning.replace('{0}', minDateStr);
         warning = warning.replace('{1}', maxDateStr);
      }
      else if (min)
      {
         warning = 'Please enter a date after {0}.';
         warning = warning.replace('{0}', minDateStr);
      }
      else
      {
         warning = 'Please enter a date before {0}.';
         warning = warning.replace('{0}', maxDateStr);
      }

      app.alert(warning);
   }

   event.rc = valid;
   FieldValidationPending = !valid;
}

function OtherChoiceValidation(choiceFieldName, otherChoiceValue, textInputName)
{
   if (this.getField(choiceFieldName).value == otherChoiceValue)
   {
      var oTextInput = this.getField(textInputName);
      var valueStr = oTextInput.value.toString();
      valueStr = valueStr.replace(/^\s+/, '').replace(/\s+$/, '');
      if (valueStr.length == 0)
      {
         app.alert('Please enter a value.');
         oTextInput.setFocus();
         return false;
      }
   }

   return true;
}

PreSubmitValidationChecks = [ ];

function PreSubmitValidation()
{
   for (var i = 0; i < PreSubmitValidationChecks.length; ++i)
   {
      var obj = PreSubmitValidationChecks[i];
      if (!obj.func.apply(this, obj.args))
         return false;
   }

   return true;
}

function onDocOpen()
{
   var fld = this.getField('fc-int01-generateAppearances');
   if (fld && fld.value == 'TRUE')
   {
      this.resetForm();
      fld.value = 'FALSE';
      this.dirty = false;
       resetToStart();


   }
}

onDocOpen();
}
/************************************************************************************************************************************************
**********************************CUSTOM SCRIPT BEGINS HERE*************************************************************************************
*************************************************************************************************************************************************/


//declare global field variables
var partyName = this.getField('pm\.PartyName');
var taxRegNum = this.getField('pm\.TaxRegNum');
var acctDescr = this.getField('pm\.AcctDescr');
var classification = this.getField('pm\.Classification');
var acctType = this.getField('pm\.AccountType');
var busModel = this.getField('pm\.BusModel');
var engagementClass = this.getField('pm\.EngagementClass');
var profileClass = this.getField('pm\.ProfileClass');
var billCurrency = this.getField('pm\.BillingCurrency');
var paymentTerms = this.getField('pm\.PaymentTerms');
var OU = this.getField('pm\.OUAssign');
var country = this.getField('pm\.CountryDD');
var address1 = this.getField('pm\.AddLine1');
var address2 = this.getField('pm\.AddLine2');
var address3 = this.getField('pm\.AddLine3');
var address4 = this.getField('pm\.AddLine4');
var city = this.getField('pm\.City');
var county = this.getField('pm\.County');
var state = this.getField('pm\.State');
var province = this.getField('pm\.Province');
var postalCode = this.getField('pm\.PostalCode');
var countryOutput = this.getField('pm\.Country');
var firstName = this.getField('pm\.ContactFN');
var lastName = this.getField('pm\.ContactLN');
var email = this.getField('pm\.ContactEmail');
var addressC1 = this.getField('pm\.ContactAddLine1');
var addressC2 = this.getField('pm\.ContactAddLine2');
var addressC3 = this.getField('pm\.ContactAddLine3');
var addressC4 = this.getField('pm\.ContactAddLine4');
var cityC = this.getField('pm\.ContactCity');
var countyC = this.getField('pm\.ContactCounty');
var stateC = this.getField('pm\.ContactState');
var provinceC = this.getField('pm\.ContactProvince');
var postalCodeC = this.getField('pm\.ContactPostalCode');
var countryC = this.getField('pm\.ContactCountry');
var commType = this.getField('pm\.CommType');
var legalEntity = this.getField('bill\.LegalEntity');
var altCustName = this.getField('bill\.AltCustName');
var contactName = this.getField('bill\.ContactName');
var email2 = this.getField('bill\.AddEmailAddress');
var salesperson = this.getField('bill\.Salesperson');
var IOnum = this.getField('bill\.IONumber');
var currency = this.getField('bill\.BillingCurrency');
var payTerms = this.getField('bill\.PayTerms');
var lineNum = this.getField('bill\.LineNumber');
var itemCode = this.getField('bill\.ItemCode');
var lineDesc = this.getField('bill\.LineDescr');
var qty = this.getField('bill\.Qty');
var unitPrice = this.getField('bill\.UnitPrice');
var lineTotal = this.getField('bill\.LineTotal');
var transNumSource = this.getField('bill\.TransNumSource');
var transType = this.getField('bill\.TransType');
var advarr = this.getField('bill\.AdvArrears');

/**********************************GLOBAL CUSTOM FUNCTIONS*************************************************************************************/

//sets all fields to initial status
function resetToStart()
{
	this.resetForm();

	//make sure no fields are set to read-only
	for (var n= 0; n<this.numFields; n++)
   {
      var fieldName = this.getNthFieldName(n);
      var f = this.getField(fieldName);
      f.readonly = false;
	  //f.required = false;
   }

   //set required field status
	partyName.required = true;
	taxRegNum.required = true;
	acctDescr.required = true;
	classification.required = true;
	busModel.required = true;
	profileClass.required = true;
	billCurrency.required = true;
	paymentTerms.required = true;
	OU.required = true;
	country.required = true;
	address1.required = true;
	city.required = true;
	firstName.required = true;
	commType.required = true;
	legalEntity.required = true;
	altCustName.required = true;
	salesperson.required = true;
	lineNum.required = true;
	itemCode.required = true;
	qty.required = true;
	unitPrice.required = true;
	lineTotal.required = true;
	address2.readonly = false;
	address3.readonly = false;
	address4.readonly = false;
	advarr.required = false;
	advarr.readonly = true;

	//set initial values
	setLegalEntity();
	setTransNumSource();
	setTransType();
	resetItemCode();

}

//function to set account type and engagement class based on classification
function classify()
{
	if (classification.value == "Media Solutions - Marketing Fund")
	{
		acctType.value = "Internal";
		engagementClass.value = "Marketing Fund";
	}
	else
	{
		acctType.value = "External";
		engagementClass.value = "Direct Bill";
	}
}

//function to set address properties based on country
function countryProperties()
{
	if (country.value == "BR")
	{
		// address2.readonly = false;
		// address3.readonly = false;
		// address4.readonly = false;
		// state.required = false;
		// postalCode.required = false;
		// province.required = false;
		province.readonly = true;
	}
	else if (country.value == "US")
	{
		// address2.readonly = true;
		// address3.readonly = true;
		// address4.readonly = true;
		state.required = true;
		postalCode.required = true;
		province.required = false;
		province.readonly = true;

	}
	else if (country.value == "CA")
	{
		// address2.readonly = true;
		// address3.readonly = true;
		// address4.readonly = true;
		state.required = false;
		postalCode.required = false;
		province.required = true;
	}
	else
	{
		// address2.readonly = true;
		// address3.readonly = true;
		// address4.readonly = true;
		state.required = false;
		postalCode.required = false;
		province.required = false;
	}
  setState();
}

//function to set values of all duplicate fields
function setFieldValues()
{
	addressC1 = address1.value;
	addressC2 = address2.value;
	addressC3 = address3.value;
	addressC4 = address4.value;
	countryOutput = country.value;
	countryC = country.value;
	contactName = firstName.value + " " + lastName.value;
	currency = billCurrency.value;
	payTerms = paymentTerms.value;
	lineDesc = itemCode.value;

}

//function to set values of state

function setState()
{
  if(country.value == "US"){
  var f = state;
  f.setItems([" ","AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA","WV","WI","WY"]);
  } else {
    var f = state;
    f.setItems([""]);
  }
}

//function to set legal entity value based on OU
function setLegalEntity()
{
	if (OU.value == "14101 Travelscape, LLC")
	{
		var f = legalEntity;
		f.setItems(["","Travelscape, LLC", "Hotels.com LP", "Expedia Inc"]);
	}
	else if (OU.value == "61110 Egencia, LLC")
	{
		var f = legalEntity;
		f.setItems(["Egencia LLC"]);
	}
	else if (OU.value == "61120 Egencia Canada Corp.")
	{
		var f = legalEntity;
		f.setItems(["Egencia Canada Corp"]);
	}
	else
	{
		var f = legalEntity;
		f.setItems([""]);
	}
}

//function to set transaction number source based on legal entity value
function setTransNumSource()
{


	if (legalEntity.value == "Travelscape, LLC")
	{
		var f = transNumSource;
		f.setItems(["TS_SOURCE_AUTO", "HOTW_SOURCE_AUTO"]);
	}
	else if (legalEntity.value == "Hotels.com LP")
	{
		var f = transNumSource;
		f.setItems(["HOT_SOURCE_AUTO"]);
	}
	else if (legalEntity.value == "Expedia Inc")
	{
		var f = transNumSource;
		f.setItems(["EXP_SOURCE_AUTO"]);
	}
	else if (legalEntity.value == "Egencia LLC")
	{
		var f = transNumSource;
		f.setItems(["EGCT_SOURCE_AUTO", "EGADV_SOURCE_AUTO"]);
	}
	else if (legalEntity.value == "Egencia Canada Corp")
	{
		var f = transNumSource;
		f.setItems(["EGCA_SOURCE_AUTO"]);
	}
	else
	{
		var f = transNumSource;
		f.setItems([""]);
	}
}

//function to set transaction type based on number source value
function setTransType()
{
	var f = transType;

	if (transNumSource.value == "EXP_SOURCE_AUTO")
	{
		f.setItems([" ","EXP_INV_NT","EXP_INV_RP","EXP_INV_SO"]);
	}
	else if (transNumSource.value == "HOT_SOURCE_AUTO")
	{
		f.setItems([" ","HOT_INV_ADV","HOT_INV_ADV_MF","HOT_INV_ADV_MF_EX","HOT_INV_NT","HOT_INV_SO"]);
	}
	else if (transNumSource.value == "HOTW_SOURCE_AUTO")
	{
		f.setItems([" ","HOT_INV_ADV","HOT_INV_ADV_MF","HOT_INV_ADV_MF_EX","HOT_INV_NT","HOT_INV_SO"]);
	}
	else if (transNumSource.value == "TS_SOURCE_AUTO")
	{
		f.setItems([" ","TS_INV_ADV","TS_INV_ADV_MF","TS_INV_ADV_MF_EX","TS_INV_EAC","TS_INV_ELONG_IC","TS_INV_NT","TS_INV_RP","TS_INV_SO","TS_INV_TA","TS_VST_BILLING"]);
	}
	else if (transNumSource.value == "EGADV_SOURCE_AUTO")
	{
		f.setItems([" ","EG_INV_ADV","EG_INV_ADV_MF","EG_INV_ADV_MF_EX","EG_INV_CT"]);
	}
	else if (transNumSource.value == "EGCA_SOURCE_AUTO")
	{
		f.setItems([" ","EG_INV_ADV","EG_INV_ADV_MF","EG_INV_ADV_MF_EX","EG_INV_CT"]);
	}
	else if (transNumSource.value == "EGCT_SOURCE_AUTO")
	{
		f.setItems([" ","EGC_INV_CT"]);
	}
	else
	{
		f.setItems([""]);
	}
}

//functions to set Item Codes based on Transaction Types
function resetItemCode()
{
	var f = itemCode;
f.setItems([""]);
}

function itemCode1()
{
	var f = itemCode;
	f.setItems(["APAC_AD_CVB","AU_AD_CAR","AU_AD_FEE","CITI_MKTFUND","COUPONS_AMEX","CR_CLEARING_NAV","CR_DE_AD_CAR","CR_EMEA_AD_CAR","CR_FR_AD_CAR","CR_KYK_AD_CAR","CR_MFCLEARING",
				"CR_OVERRIDE_REV","CR_US_AD_CAR","DOMAGNCYAR","EG_MISCREV","EG_REIMBURSE_COOLEY","EG_REIMBURSE_DUKE_ENERGY","EG_REIMBURSE_EVERCORE","EG_REIMBURSE_INTEL_VENTURE","EG_REIMBURSE_JONES_LANG",
				"EG_REIMBURSE_LENOVO","EG_REIMBURSE_MANPOWER","EG_REIMBURSE_NEFLIX","EG_REIMBURSE_NEWELL_BRANDS","EG_REIMBURSE_RUSSELL","EG_REIMBURSE_WILLIAMS_CO","EG_REIMBURSE_WORKDAY","ELE_DS_EMB_SUITES",
				"ELE_RC_EMB_SUITES","EMEA_NL_FEE","EXPWA_AARP","EXPWA_AARP_MF_REIM","EXPWA_AGENCY_CAR","EXPWA_AGENCY_CAR_OVR","EXPWA_AIRMILE_COUPON","EXPWA_AMADEUS","EXPWA_AMADEUS_UK_ADM","EXPWA_AU_SEM_CRS",
				"EXPWA_BR_3PT_INS","EXPWA_CATOURCOM","EXPWA_CC_DEF_REV","EXPWA_CC_GPS_REV","EXPWA_CC_TY_REV","EXPWA_CITICOBRAND","EXPWA_CITI_MKTFUND","EXPWA_CLEARTRIP_COMM_REV","EXPWA_COUPONS","EXPWA_COUPONS_AMEX",
				"EXPWA_DESTSVCCOM","EXPWA_DESTSVCCOMMX","EXPWA_DE_3PP_COMM","EXPWA_DE_3PT_INS","EXPWA_DE_AIR_COMM","EXPWA_DISNEY","EXPWA_DOMAGNCYAR","EXPWA_EXPBOUNTYSALES","EXPWA_EXP_BOUNTY","EXPWA_EXP_EXTRAS",
				"EXPWA_FR_3PT_INS","EXPWA_FR_SCHEDULE_CHANGE","EXPWA_FR_SETTLEMENT","EXPWA_FUNDED_LOYALTY_POI","EXPWA_GL115100","EXPWA_GL120051","EXPWA_GL350004","EXPWA_GL_115675","EXPWA_GL_119650","EXPWA_GL_205101_QCNS",
				"EXPWA_GL_230007","EXPWA_GL_746028","EXPWA_GL_753010","EXPWA_GL_ARClearing","EXPWA_HVCB COOP","EXPWA_IT_3PP_COMM","EXPWA_IT_3PT_INS","EXPWA_IT_AIR_COMM","EXPWA_LAS_VEGAS_CONF","EXPWA_LOYALTY","EXPWA_LOYALTY_CA",
				"EXPWA_LOYALTY_UK","EXPWA_MC_CASHCARD","EXPWA_MC_LOYALTY_POINTS","EXPWA_MC_REVSHARE","EXPWA_MF_INV","EXPWA_MX_3PT_INS","EXPWA_NECTARBILLING","EXPWA_NL_3PP_COMM","EXPWA_NL_3PT_INS","EXPWA_NZ_3PT_INS","EXPWA_OPER_EXP",
				"EXPWA_OVERRIDE","EXPWA_PARK_EXP","EXPWA_PARTNER_FEES","EXPWA_PMSVCCOMM","EXPWA_PR_SOCIAL","EXPWA_PSG_TRDSHW","EXPWA_QCNS_CRUISE_COMM","EXPWA_RENT_EXP","EXPWA_RP_US_AD_NON","EXPWA_SPONSOR","EXPWA_TA_CI_REV",
				"EXPWA_TA_EW_CA","EXPWA_TA_EW_CTX","EXPWA_TA_EW_EBK","EXPWA_TA_EW_OWW","EXPWA_TA_EW_REV","EXPWA_TA_EW_TVLY","EXPWA_TA_EW_UK","EXPWA_TA_TAX","EXPWA_TA_TAX_TSA","EXPWA_TA_TSA","EXPWA_TDCHARGES","EXPWA_TDCONTEST",
				"EXPWA_TD_CALL_BR","EXPWA_TX_TRDSHW","EXPWA_UK_3PP_COMM","EXPWA_UK_3PT_INS","EXPWA_UK_AIR_COMM","EXPWA_UK_TRN_COM","EXPWA_VSC_CALL_CENTER","EXPWA_VSC_FULFILLMENT","EXPWA_VSC_PHONE","EXPWA_XSV_69112","EXPWA_XSV_69220",
				"EXPWA_XSV_69316","EXPWA_XSV_69405","EXPWA_XSV_69446","EXPWA_XSV_82103","EXPWA_XSV_82213","EXP_MISCREV","EXP_NL_FEE","FR_SETTLEMENT","FUNDED_LOYALTY_POI","GL_200103_ADV_AIR","GL_200103_ADV_AIR_IMP","GL_200103_ADV_CAR",
				"GL_200103_ADV_CAR_IMP","GL_200103_ADV_CRSE","GL_200103_ADV_CRSE_IMP","GL_200103_ADV_CVB","GL_200103_ADV_CVB_IMP","GL_200103_ADV_DSVC","GL_200103_ADV_DSVC_IMP","GL_200103_ADV_EML","GL_200103_ADV_EML_IMP","GL_200103_ADV_HTL",
				"GL_200103_ADV_HTL_IMP","GL_200103_ADV_NON","GL_200103_ADV_NON_IMP","GL_200103_ADV_OTH","GL_200103_ADV_OTH_IMP","HCOM_ACCR_COUPON","HCOM_AD_AIR","HCOM_AD_AIR_IMP","HCOM_AD_CAR","HCOM_AD_CAR_IMP","HCOM_AD_CRSE","HCOM_AD_CRSE_IMP",
				"HCOM_AD_CVB","HCOM_AD_CVB_IMP","HCOM_AD_DSVC","HCOM_AD_DSVC_IMP","HCOM_AD_EML","HCOM_AD_EML_IMP","HCOM_AD_HTL","HCOM_AD_HTL_IMP","HCOM_AD_NON","HCOM_AD_NON_IMP","HCOM_AD_OTH","HCOM_AD_OTH_IMP","HCOM_APAC_AD_AIR","HCOM_APAC_AD_AIR_IMP",
				"HCOM_APAC_AD_CAR","HCOM_APAC_AD_CAR_IMP","HCOM_APAC_AD_CRSE","HCOM_APAC_AD_CRSE_IMP","HCOM_APAC_AD_CVB","HCOM_APAC_AD_CVB_IMP","HCOM_APAC_AD_DSCV_IMP","HCOM_APAC_AD_DSVC","HCOM_APAC_AD_DSVC_IMP","HCOM_APAC_AD_EML","HCOM_APAC_AD_EML_IMP",
				"HCOM_APAC_AD_HOTL_IMP","HCOM_APAC_AD_HTL","HCOM_APAC_AD_HTL_IMP","HCOM_APAC_AD_NON","HCOM_APAC_AD_NON_IMP","HCOM_APAC_AD_OTH","HCOM_APAC_AD_OTH_IMP","HCOM_APAC_COUPON","HCOM_APAC_MC","HCOM_CA_AD_AIR","HCOM_CA_AD_AIR_IMP","HCOM_CA_AD_CAR",
				"HCOM_CA_AD_CAR_IMP","HCOM_CA_AD_CRSE","HCOM_CA_AD_CRSE_IMP","HCOM_CA_AD_CVB","HCOM_CA_AD_CVB_IMP","HCOM_CA_AD_DSVC","HCOM_CA_AD_DSVC_IMP","HCOM_CA_AD_EML","HCOM_CA_AD_EML_IMP","HCOM_CA_AD_HOTL","HCOM_CA_AD_HOTL_IMP","HCOM_CA_AD_NON",
				"HCOM_CA_AD_NON_IMP","HCOM_CA_AD_OTH","HCOM_CA_AD_OTH_IMP","HCOM_EMEA_AD_AIR","HCOM_EMEA_AD_AIR_IMP","HCOM_EMEA_AD_CAR","HCOM_EMEA_AD_CAR_IMP","HCOM_EMEA_AD_CRSE","HCOM_EMEA_AD_CRSE_IMP","HCOM_EMEA_AD_CVB","HCOM_EMEA_AD_CVB_IMP","HCOM_EMEA_AD_DSVC",
				"HCOM_EMEA_AD_DSVC_IMP","HCOM_EMEA_AD_EML","HCOM_EMEA_AD_EML_IMP","HCOM_EMEA_AD_HOTL","HCOM_EMEA_AD_HOTL_IMP","HCOM_EMEA_AD_NON","HCOM_EMEA_AD_NON_IMP","HCOM_EMEA_AD_OTH","HCOM_EMEA_AD_OTH_IMP","HCOM_EMEA_COUPON","HCOM_EMEA_NL_FEE",
				"HCOM_EXP_EXTRAS","HCOM_GL_361055","HCOM_GOLF_SPONS","HCOM_LATAM_AD_AIR","HCOM_LATAM_AD_AIR_IMP","HCOM_LATAM_AD_CAR","HCOM_LATAM_AD_CAR_IMP","HCOM_LATAM_AD_CRSE","HCOM_LATAM_AD_CRSE_IMP","HCOM_LATAM_AD_CVB","HCOM_LATAM_AD_CVB_IMP","HCOM_LATAM_AD_DSCV",
				"HCOM_LATAM_AD_DSCV_IMP","HCOM_LATAM_AD_EML","HCOM_LATAM_AD_EML_IMP","HCOM_LATAM_AD_HTL","HCOM_LATAM_AD_HTL_IMP","HCOM_LATAM_AD_NON","HCOM_LATAM_AD_NON_IMP","HCOM_LATAM_AD_OTH","HCOM_LATAM_AD_OTH_IMP","HCOM_LATAM_COUPON","HCOM_MFCLEARING","HCOM_MF_AIR",
				"HCOM_MF_HTL","HCOM_MF_INV","HCOM_NA_COUPON","HCOM_PROMO_GIFT CARDS","HOTW_AD_AIR","HOTW_AD_AIR_IMP","HOTW_AD_CAR","HOTW_AD_CAR_IMP","HOTW_AD_CRSE","HOTW_AD_CRSE_IMP","HOTW_AD_CVB","HOTW_AD_CVB_IMP","HOTW_AD_DSVC","HOTW_AD_DSVC_IMP","HOTW_AD_EML",
				"HOTW_AD_EML_IMP","HOTW_AD_HOTL","HOTW_AD_HOTL_IMP","HOTW_AD_NON","HOTW_AD_NON_IMP","HOTW_AD_OTH","HOTW_AD_OTH_IMP","HOTW_MISCREV","HOTW_SUBLEASE","HOT_GC_B2B","HOT_MF_AIR","HOT_MISCREV","LX_AGREEFEES","LX_CALLINGREIMB","LX_COSTREIMB","LX_DESTSVCCOM",
				"LX_INMKTCALL","LX_LICFEES","LX_TKTS","LX_Uber_Billings","NL_AD_CRSE_IMP","OWW_RBC_CC_GPS","TRIVAGO_US","TS _CHPTCKT_AD_CRSE","TS _CHPTCKT_AD_CRSE_IMP","TS _EBOOK_CH_AD_CRSE","TS _EBOOK_CH_AD_CRSE_IMP","TS _EBOOK_DE_AD_CRSE","TS _EBOOK_DE_AD_CRSE_IMP",
				"TS _EBOOK_FI_AD_CRSE","TS _EBOOK_FI_AD_CRSE_IMP","TS _EBOOK_FR_AD_CRSE","TS _EBOOK_FR_AD_CRSE_IMP","TS _EBOOK_IE_AD_CRSE","TS _EBOOK_IE_AD_CRSE_IMP","TS _EBOOK_UK_AD_CRSE","TS _EBOOK_UK_AD_CRSE_IMP","TS __ORBTZ__AD_CRSE","TS __ORBTZ__AD_CRSE_IMP",
				"TS_AAE_SG_AD_AIR","TS_AAE_SG_AD_AIR_IMP","TS_AAE_SG_AD_CAR","TS_AAE_SG_AD_CAR_IMP","TS_AAE_SG_AD_CRSE","TS_AAE_SG_AD_CRSE_IMP","TS_AAE_SG_AD_CVB","TS_AAE_SG_AD_CVB_IMP","TS_AAE_SG_AD_DSVC","TS_AAE_SG_AD_DSVC_IMP","TS_AAE_SG_AD_HOT","TS_AAE_SG_AD_HOT_IMP",
				"TS_AAE_SG_AD_NON","TS_AAE_SG_AD_NON_IMP","TS_AAE_SG_AD_OTH","TS_AAE_SG_AD_OTH_IMP","TS_AAGO_AD_CAR","TS_AAGO_AD_CAR_IMP","TS_AAGO_AD_CRSE","TS_AAGO_AD_CRSE_IMP","TS_AAGO_AD_CVB","TS_AAGO_AD_CVB_IMP","TS_AAGO_AD_DSVC","TS_AAGO_AD_DSVC_IMP",
				"TS_AAGO_AD_EML","TS_AAGO_AD_EML_IMP","TS_AAGO_AD_NON","TS_AAGO_AD_NON_IMP","TS_AAGO_AD_OTH","TS_AAGO_AD_OTH_IMP","TS_AAGO_AU_AD_AIR","TS_AAGO_AU_AD_AIR_IMP","TS_AAGO_AU_AD_CAR","TS_AAGO_AU_AD_CAR_IMP","TS_AAGO_AU_AD_CRSE","TS_AAGO_AU_AD_CVB",
				"TS_AAGO_AU_AD_CVB_IMP","TS_AAGO_AU_AD_DSVC_IMP","TS_AAGO_AU_AD_EML","TS_AAGO_AU_AD_EML_IMP","TS_AAGO_AU_AD_HOTL","TS_AAGO_AU_AD_HOTL_IMP","TS_AAGO_AU_AD_NON","TS_AAGO_AU_AD_NON_IMP","TS_AAGO_AU_AD_OTH","TS_AAGO_AU_AD_OTH_IMP","TS_AAGO_CH_AD_AIR",
				"TS_AAGO_CH_AD_AIR_IMP","TS_AAGO_CH_AD_CAR","TS_AAGO_CH_AD_CAR_IMP","TS_AAGO_CH_AD_CRSE","TS_AAGO_CH_AD_CRSE_IMP","TS_AAGO_CH_AD_CVB","TS_AAGO_CH_AD_CVB_IMP","TS_AAGO_CH_AD_DSVC","TS_AAGO_CH_AD_DSVC_IMP","TS_AAGO_CH_AD_EML","TS_AAGO_CH_AD_EML_IMP",
				"TS_AAGO_CH_AD_HOTL","TS_AAGO_CH_AD_HOTL_IMP","TS_AAGO_CH_AD_NON","TS_AAGO_CH_AD_NON_IMP","TS_AAGO_CH_AD_OTH","TS_AAGO_CH_AD_OTH_IMP","TS_AAGO_HK_AD_AIR","TS_AAGO_HK_AD_AIR_IMP","TS_AAGO_HK_AD_CAR","TS_AAGO_HK_AD_CAR_IMP","TS_AAGO_HK_AD_CRSE",
				"TS_AAGO_HK_AD_CRSE_IMP","TS_AAGO_HK_AD_CVB","TS_AAGO_HK_AD_CVB_IMP","TS_AAGO_HK_AD_DSVC","TS_AAGO_HK_AD_DSVC_IMP","TS_AAGO_HK_AD_EML","TS_AAGO_HK_AD_EML_IMP","TS_AAGO_HK_AD_HOTL","TS_AAGO_HK_AD_HOTL_IMP","TS_AAGO_HK_AD_NON","TS_AAGO_HK_AD_NON_IMP",
				"TS_AAGO_HK_AD_OTH","TS_AAGO_HK_AD_OTH_IMP","TS_AAGO_ID_AD_AIR","TS_AAGO_ID_AD_AIR_IMP","TS_AAGO_ID_AD_CAR","TS_AAGO_ID_AD_CAR_IMP","TS_AAGO_ID_AD_CRSE","TS_AAGO_ID_AD_CRSE_IMP","TS_AAGO_ID_AD_CVB","TS_AAGO_ID_AD_CVB_IMP","TS_AAGO_ID_AD_DSVC",
				"TS_AAGO_ID_AD_DSVC_IMP","TS_AAGO_ID_AD_EML","TS_AAGO_ID_AD_EML_IMP","TS_AAGO_ID_AD_HOTL","TS_AAGO_ID_AD_HOTL_IMP","TS_AAGO_ID_AD_NON","TS_AAGO_ID_AD_NON_IMP","TS_AAGO_ID_AD_OTH","TS_AAGO_MY_AD_AIR","TS_AAGO_MY_AD_AIR_IMP","TS_AAGO_MY_AD_CAR",
				"TS_AAGO_MY_AD_CAR_IMP","TS_AAGO_MY_AD_CRSE","TS_AAGO_MY_AD_CRSE_IMP","TS_AAGO_MY_AD_CVB","TS_AAGO_MY_AD_CVB_IMP","TS_AAGO_MY_AD_DSVC","TS_AAGO_MY_AD_DSVC_IMP","TS_AAGO_MY_AD_EML","TS_AAGO_MY_AD_EML_IMP","TS_AAGO_MY_AD_HOTL","TS_AAGO_MY_AD_HOTL_IMP",
				"TS_AAGO_MY_AD_NON","TS_AAGO_MY_AD_NON_IMP","TS_AAGO_MY_AD_OTH","TS_AAGO_MY_AD_OTH_IMP","TS_AAGO_TH_AD_AIR","TS_AAGO_TH_AD_AIR_IMP","TS_AAGO_TH_AD_HOTL","TS_AAGO_TH_AD_HOTL_IMP","TS_AA_COUPON","TS_AGENCY-CAR","TS_AIR_ASIA_JV","TS_AP_TRADE_DEDUCT",
				"TS_AR_AD_AIR","TS_AR_AD_AIR_IMP","TS_AR_AD_CAR","TS_AR_AD_CAR_IMP","TS_AR_AD_CRSE","TS_AR_AD_CRSE_IMP","TS_AR_AD_CVB","TS_AR_AD_CVB_IMP","TS_AR_AD_DSVC","TS_AR_AD_DSVC_IMP","TS_AR_AD_EML","TS_AR_AD_EML_IMP","TS_AR_AD_HOTL","TS_AR_AD_HOTL_IMP",
				"TS_AR_AD_NON","TS_AR_AD_NON_IMP","TS_AR_AD_OTH","TS_AR_AD_OTH_IMP","TS_AR_OFFSET","TS_AT_AD_AIR","TS_AT_AD_AIR_IMP","TS_AT_AD_CAR","TS_AT_AD_CAR_IMP","TS_AT_AD_CRSE","TS_AT_AD_CRSE_IMP","TS_AT_AD_CVB","TS_AT_AD_CVB_IMP","TS_AT_AD_DSCV","TS_AT_AD_DSCV_IMP",
				"TS_AT_AD_EML","TS_AT_AD_EML_IMP","TS_AT_AD_HOTL","TS_AT_AD_HOTL_IMP","TS_AT_AD_NON","TS_AT_AD_NON_IMP","TS_AT_AD_OTH","TS_AT_AD_OTH_IMP","TS_AU_AD_AIR","TS_AU_AD_AIR_IMP","TS_AU_AD_CAR","TS_AU_AD_CAR_IMP","TS_AU_AD_CRAU","TS_AU_AD_CRAU_IMP","TS_AU_AD_CVB",
				"TS_AU_AD_CVB_IMP","TS_AU_AD_DSVC","TS_AU_AD_DSVC_IMP","TS_AU_AD_EML","TS_AU_AD_EML_IMP","TS_AU_AD_FEE","TS_AU_AD_HOTL","TS_AU_AD_HOTL_IMP","TS_AU_AD_NON","TS_AU_AD_NON_IMP","TS_AU_AD_OTH","TS_AU_AD_OTH_IMP","TS_B2B REIMB2","TS_B2B_REIMB",
				"TS_BE_AD_AIR","TS_BE_AD_AIR_IMP","TS_BE_AD_CAR","TS_BE_AD_CAR_IMP","TS_BE_AD_CRSE","TS_BE_AD_CRSE_IMP","TS_BE_AD_CVB","TS_BE_AD_CVB_IMP","TS_BE_AD_DSVC","TS_BE_AD_DSVC_IMP","TS_BE_AD_EML","TS_BE_AD_EML_IMP","TS_BE_AD_HOTL","TS_BE_AD_HOTL_IMP",
				"TS_BE_AD_NON","TS_BE_AD_NON_IMP","TS_BE_AD_OTH","TS_BE_AD_OTHL_IMP","TS_BP_US_AD_AIR","TS_BP_US_AD_AIR_IMP","TS_BP_US_AD_CAR","TS_BP_US_AD_CAR_IMP","TS_BP_US_AD_CRSE","TS_BP_US_AD_CRSE_IMP","TS_BP_US_AD_CVB","TS_BP_US_AD_CVB_IMP","TS_BP_US_AD_DSVC",
				"TS_BP_US_AD_DSVC_IMP","TS_BP_US_AD_EML","TS_BP_US_AD_EML_IMP","TS_BP_US_AD_HOTL","TS_BP_US_AD_HOTL_IMP","TS_BP_US_AD_NON","TS_BP_US_AD_NON_IMP","TS_BP_US_AD_OTH","TS_BP_US_AD_OTH_IMP","TS_BR_AD_AIR","TS_BR_AD_AIR_IMP","TS_BR_AD_CAR","TS_BR_AD_CAR_IMP",
				"TS_BR_AD_CRSE","TS_BR_AD_CRSE_IMP","TS_BR_AD_CVB","TS_BR_AD_CVB_IMP","TS_BR_AD_DSVC","TS_BR_AD_DSVC_IMP","TS_BR_AD_EML","TS_BR_AD_EML_IMP","TS_BR_AD_HOTL","TS_BR_AD_HOTL_IMP","TS_BR_AD_NON","TS_BR_AD_NON_IMP","TS_BR_AD_OTH","TS_BR_AD_OTH_IMP",
				"TS_CA_AD_AIR","TS_CA_AD_AIR_IMP","TS_CA_AD_CAR","TS_CA_AD_CAR_IMP","TS_CA_AD_CRSE","TS_CA_AD_CRSE_IMP","TS_CA_AD_CVB","TS_CA_AD_CVB_IMP","TS_CA_AD_DSVC","TS_CA_AD_DSVC_IMP","TS_CA_AD_EML","TS_CA_AD_EML_IMP","TS_CA_AD_HOTL","TS_CA_AD_HOTL_IMP",
				"TS_CA_AD_NON","TS_CA_AD_NON_IMP","TS_CA_AD_OTH","TS_CA_AD_OTH_IMP","TS_CBA_COUPON","TS_CHPTCKT_AD_AIR","TS_CHPTCKT_AD_AIR_IMP","TS_CHPTCKT_AD_CAR","TS_CHPTCKT_AD_CAR_IMP","TS_CHPTCKT_AD_CVB","TS_CHPTCKT_AD_CVB_IMP","TS_CHPTCKT_AD_DSCV",
				"TS_CHPTCKT_AD_DSCV_IMP","TS_CHPTCKT_AD_EML","TS_CHPTCKT_AD_EML_IMP","TS_CHPTCKT_AD_HOTL","TS_CHPTCKT_AD_HOTL_IMP","TS_CHPTCKT_AD_NON","TS_CHPTCKT_AD_NON_IMP","TS_CHPTCKT_AD_OTH","TS_CHPTCKT_AD_OTH_IMP","TS_CH_AD_AIR","TS_CH_AD_AIR_IMP",
				"TS_CH_AD_CAR","TS_CH_AD_CAR_IMP","TS_CH_AD_CRSE","TS_CH_AD_CRSE_IMP","TS_CH_AD_CVB","TS_CH_AD_CVB_IMP","TS_CH_AD_DSVC","TS_CH_AD_DSVC_IMP","TS_CH_AD_EML","TS_CH_AD_EML_IMP","TS_CH_AD_HOTL_IMP","TS_CH_AD_HTL","TS_CH_AD_NON","TS_CH_AD_NON_IMP",
				"TS_CH_AD_OTH","TS_CH_AD_OTH_IMP","TS_CN_AD_AIR","TS_CN_AD_AIR_IMP","TS_CN_AD_CAR","TS_CN_AD_CAR_IMP","TS_CN_AD_CRSE","TS_CN_AD_CRSE_IMP","TS_CN_AD_CVB","TS_CN_AD_CVB_IMP","TS_CN_AD_DSVC","TS_CN_AD_DSVC_IMP","TS_CN_AD_EML","TS_CN_AD_EML_IMP",
				"TS_CN_AD_HOTL","TS_CN_AD_HOTL_IMP","TS_CN_AD_NON","TS_CN_AD_NON_IMP","TS_CN_AD_OTH","TS_CN_AD_OTH_IMP","TS_COUPONS","TS_DE_AD_AIR","TS_DE_AD_AIR_IMP","TS_DE_AD_CAR","TS_DE_AD_CAR_IMP","TS_DE_AD_CRSE","TS_DE_AD_CRSE_IMP","TS_DE_AD_CVB",
				"TS_DE_AD_CVB_IMP","TS_DE_AD_DSVC","TS_DE_AD_DSVC_IMP","TS_DE_AD_EML","TS_DE_AD_EML_IMP","TS_DE_AD_HOTL","TS_DE_AD_HOTL_IMP","TS_DE_AD_NON","TS_DE_AD_NON_IMP","TS_DE_AD_OTH","TS_DE_AD_OTH_IMP","TS_DISNEY","TS_DK_AD_AIR","TS_DK_AD_AIR_IMP",
				"TS_DK_AD_CAR","TS_DK_AD_CAR_IMP","TS_DK_AD_CRSE","TS_DK_AD_CRSE_IMP","TS_DK_AD_CVB","TS_DK_AD_CVB_IMP","TS_DK_AD_DSVC","TS_DK_AD_DSVC_IMP","TS_DK_AD_EML","TS_DK_AD_EML_IMP","TS_DK_AD_HOTL","TS_DK_AD_HOTL_IMP","TS_DK_AD_NON","TS_DK_AD_NON_IMP",
				"TS_DK_AD_OTH","TS_DK_AD_OTH_IMP","TS_EAC_BOOK","TS_EAC_GR_AAGo","TS_EAC_GR_AMER","TS_EAC_GR_APAC","TS_EAC_GR_EMEA","TS_EAC_GR_LATAM","TS_EAC_STAY","TS_EANAPAC_COUPON","TS_EBOOK_CH_AD_AIR","TS_EBOOK_CH_AD_AIR_IMP","TS_EBOOK_CH_AD_CAR",
				"TS_EBOOK_CH_AD_CAR_IMP","TS_EBOOK_CH_AD_CVB","TS_EBOOK_CH_AD_CVB_IMP","TS_EBOOK_CH_AD_DSCV","TS_EBOOK_CH_AD_DSCV_IMP","TS_EBOOK_CH_AD_EML","TS_EBOOK_CH_AD_EML_IMP","TS_EBOOK_CH_AD_HOTL","TS_EBOOK_CH_AD_HOTL_IMP","TS_EBOOK_CH_AD_NON",
				"TS_EBOOK_CH_AD_NON_IMP","TS_EBOOK_CH_AD_OTH","TS_EBOOK_CH_AD_OTH_IMP","TS_EBOOK_DE_AD_AIR","TS_EBOOK_DE_AD_AIR_IMP","TS_EBOOK_DE_AD_CAR","TS_EBOOK_DE_AD_CAR_IMP","TS_EBOOK_DE_AD_CVB","TS_EBOOK_DE_AD_CVB_IMP","TS_EBOOK_DE_AD_DSCV","TS_EBOOK_DE_AD_DSCV_IMP",
				"TS_EBOOK_DE_AD_EML","TS_EBOOK_DE_AD_EML_IMP","TS_EBOOK_DE_AD_HOTL","TS_EBOOK_DE_AD_HOTL_IMP","TS_EBOOK_DE_AD_NON","TS_EBOOK_DE_AD_NON_IMP","TS_EBOOK_DE_AD_OTH","TS_EBOOK_DE_AD_OTH_IMP","TS_EBOOK_FI_AD_AIR","TS_EBOOK_FI_AD_AIR_IMP","TS_EBOOK_FI_AD_CAR",
				"TS_EBOOK_FI_AD_CAR_IMP","TS_EBOOK_FI_AD_CVB","TS_EBOOK_FI_AD_CVB_IMP","TS_EBOOK_FI_AD_DSCV","TS_EBOOK_FI_AD_DSCV_IMP","TS_EBOOK_FI_AD_EML","TS_EBOOK_FI_AD_EML_IMP","TS_EBOOK_FI_AD_HOTL","TS_EBOOK_FI_AD_HOTL_IMP","TS_EBOOK_FI_AD_NON","TS_EBOOK_FI_AD_NON_IMP",
				"TS_EBOOK_FI_AD_OTH","TS_EBOOK_FI_AD_OTH_IMP","TS_EBOOK_FR_AD_AIR","TS_EBOOK_FR_AD_AIR_IMP","TS_EBOOK_FR_AD_CAR","TS_EBOOK_FR_AD_CAR_IMP","TS_EBOOK_FR_AD_CVB","TS_EBOOK_FR_AD_CVB_IMP","TS_EBOOK_FR_AD_DSCV","TS_EBOOK_FR_AD_DSCV_IMP","TS_EBOOK_FR_AD_EML",
				"TS_EBOOK_FR_AD_EML_IMP","TS_EBOOK_FR_AD_HOTL","TS_EBOOK_FR_AD_HOTL_IMP","TS_EBOOK_FR_AD_NON","TS_EBOOK_FR_AD_NON_IMP","TS_EBOOK_FR_AD_OTH","TS_EBOOK_FR_AD_OTH_IMP","TS_EBOOK_IE_AD_AIR","TS_EBOOK_IE_AD_AIR_IMP","TS_EBOOK_IE_AD_CAR",
				"TS_EBOOK_IE_AD_CAR_IMP","TS_EBOOK_IE_AD_CVB","TS_EBOOK_IE_AD_CVB_IMP","TS_EBOOK_IE_AD_DSCV","TS_EBOOK_IE_AD_DSCV_IMP","TS_EBOOK_IE_AD_EML","TS_EBOOK_IE_AD_EML_IMP","TS_EBOOK_IE_AD_HOTL","TS_EBOOK_IE_AD_HOTL_IMP","TS_EBOOK_IE_AD_NON","TS_EBOOK_IE_AD_NON_IMP",
				"TS_EBOOK_IE_AD_OTH","TS_EBOOK_IE_AD_OTH_IMP","TS_EBOOK_UK_AD_AIR","TS_EBOOK_UK_AD_AIR_IMP","TS_EBOOK_UK_AD_CAR","TS_EBOOK_UK_AD_CAR_IMP","TS_EBOOK_UK_AD_CVB","TS_EBOOK_UK_AD_CVB_IMP","TS_EBOOK_UK_AD_DSCV","TS_EBOOK_UK_AD_DSCV_IMP","TS_EBOOK_UK_AD_EML",
				"TS_EBOOK_UK_AD_EML_IMP","TS_EBOOK_UK_AD_HOTL","TS_EBOOK_UK_AD_HOTL_IMP","TS_EBOOK_UK_AD_NON","TS_EBOOK_UK_AD_NON_IMP","TS_EBOOK_UK_AD_OTH","TS_EBOOK_UK_AD_OTH_IMP","TS_ELONG_MS_AIR","TS_ELONG_MS_CAR","TS_ELONG_MS_CRSE","TS_ELONG_MS_CVB","TS_ELONG_MS_DSVC",
				"TS_ELONG_MS_EML","TS_ELONG_MS_EML_IMP","TS_ELONG_MS_HOTL","TS_ELONG_MS_NON","TS_ELONG_MS_OTH","TS_ES_AD_AIR","TS_ES_AD_AIR_IMP","TS_ES_AD_CAR","TS_ES_AD_CAR_IMP","TS_ES_AD_CRSE","TS_ES_AD_CRSE_IMP","TS_ES_AD_CVB","TS_ES_AD_CVB_IMP","TS_ES_AD_DSVC",
				"TS_ES_AD_DSVC_IMP","TS_ES_AD_EML","TS_ES_AD_EML_IMP","TS_ES_AD_HOTL","TS_ES_AD_HOTL_IMP","TS_ES_AD_NON","TS_ES_AD_NON_IMP","TS_ES_AD_OTH","TS_ES_AD_OTH_IMP","TS_EXP_EXTRAS","TS_EXP_FR_FEE","TS_EXP_GEN_COUPON","TS_EXP_NL_FEE","TS_FI_AD_AIR","TS_FI_AD_AIR_IMP",
				"TS_FI_AD_CAR","TS_FI_AD_CAR_IMP","TS_FI_AD_CRSE","TS_FI_AD_CRSE_IMP","TS_FI_AD_CVB","TS_FI_AD_CVB_IMP","TS_FI_AD_DSVC","TS_FI_AD_DSVC_IMP","TS_FI_AD_EML","TS_FI_AD_EML_IMP","TS_FI_AD_HOTL","TS_FI_AD_HOTL_IMP","TS_FI_AD_NON","TS_FI_AD_NON_IMP",
				"TS_FI_AD_OTH","TS_FI_AD_OTH_IMP","TS_FR_AD_AIR","TS_FR_AD_AIR_IMP","TS_FR_AD_CAR","TS_FR_AD_CAR_IMP","TS_FR_AD_CRSE","TS_FR_AD_CRSE_IMP","TS_FR_AD_CVB","TS_FR_AD_CVB_IMP","TS_FR_AD_DSVC","TS_FR_AD_DSVC_IMP","TS_FR_AD_EML","TS_FR_AD_EML_IMP","TS_FR_AD_HOTL",
				"TS_FR_AD_HOTL_IMP","TS_FR_AD_NON","TS_FR_AD_NON_IMP","TS_FR_AD_OTH","TS_FR_AD_OTH_IMP","TS_GENERIC_REFUND_B2B","TS_GENREFLATAM","TS_GENREFSGD","TS_GENREF_B2B","TS_GL121007","TS_GL350004_QCNS","TS_GL_115325","TS_GL_119650","TS_GL_121006_CVB","TS_GL_230007",
				"TS_GL_ARClearing","TS_GL_EXP","TS_HK_AD_AIR","TS_HK_AD_AIR_IMP","TS_HK_AD_CAR","TS_HK_AD_CAR_IMP","TS_HK_AD_CRSE","TS_HK_AD_CRSE_IMP","TS_HK_AD_CVB","TS_HK_AD_CVB_IMP","TS_HK_AD_DSVC","TS_HK_AD_DSVC_IMP","TS_HK_AD_EML","TS_HK_AD_EML_IMP","TS_HK_AD_HOTL",
				"TS_HK_AD_HOTL_IMP","TS_HK_AD_NON","TS_HK_AD_NON_IMP","TS_HK_AD_OTH","TS_HK_AD_OTH_IMP","TS_IN_AD_AIR","TS_IN_AD_AIR_IMP","TS_IN_AD_CAR","TS_IN_AD_CAR_IMP","TS_IN_AD_CRSE","TS_IN_AD_CRSE_IMP","TS_IN_AD_CVB","TS_IN_AD_CVB_IMP","TS_IN_AD_DSVC","TS_IN_AD_DSVC_IMP",
				"TS_IN_AD_EML","TS_IN_AD_EML_IMP","TS_IN_AD_HTL","TS_IN_AD_HTL_IMP","TS_IN_AD_NON","TS_IN_AD_NON_IMP","TS_IN_AD_OTH","TS_IN_AD_OTH_IMP","TS_IO_AD_AIR","TS_IO_AD_AIR_IMP","TS_IO_AD_CAR","TS_IO_AD_CAR_IMP","TS_IO_AD_CRSE","TS_IO_AD_CRSE_IMP","TS_IO_AD_CVB",
				"TS_IO_AD_CVB_IMP","TS_IO_AD_DSVC","TS_IO_AD_DSVC_IMP","TS_IO_AD_EML","TS_IO_AD_EML_IMP","TS_IO_AD_HOTL","TS_IO_AD_HOTL_IMP","TS_IO_AD_NON","TS_IO_AD_NON_IMP","TS_IO_AD_OTH","TS_IO_AD_OTH_IMP","TS_IRL_AD_AIR","TS_IRL_AD_AIR_IMP","TS_IRL_AD_CAR","TS_IRL_AD_CAR_IMP",
				"TS_IRL_AD_CRSE","TS_IRL_AD_CRSE_IMP","TS_IRL_AD_CVB","TS_IRL_AD_CVB_IMP","TS_IRL_AD_DSVC","TS_IRL_AD_DSVC_IMP","TS_IRL_AD_EML","TS_IRL_AD_EML_IMP","TS_IRL_AD_HOTL","TS_IRL_AD_HOTL_IMP","TS_IRL_AD_NON","TS_IRL_AD_NON_IMP","TS_IRL_AD_OTH","TS_IRL_AD_OTH_IMP",
				"TS_ITResourceFund_AU","TS_ITResourceFund_DE","TS_ITResourceFund_DK","TS_ITResourceFund_ES","TS_ITResourceFund_FR","TS_ITResourceFund_IT","TS_ITResourceFund_NL","TS_ITResourceFund_NO","TS_ITResourceFund_NZ","TS_ITResourceFund_SE","TS_ITResourceFund_UK",
				"TS_IT_AD_AIR","TS_IT_AD_AIR_IMP","TS_IT_AD_CAR","TS_IT_AD_CAR_IMP","TS_IT_AD_CRSE","TS_IT_AD_CRSE_IMP","TS_IT_AD_CVB","TS_IT_AD_CVB_IMP","TS_IT_AD_DSVC","TS_IT_AD_DSVC_IMP","TS_IT_AD_EML","TS_IT_AD_EML_IMP","TS_IT_AD_HOTL","TS_IT_AD_HOTL_IMP","TS_IT_AD_NON",
				"TS_IT_AD_NON_IMP","TS_IT_AD_OTH","TS_IT_AD_OTH_IMP","TS_JP_AD_AIR","TS_JP_AD_AIR_IMP","TS_JP_AD_CAR","TS_JP_AD_CAR_IMP","TS_JP_AD_CRSE","TS_JP_AD_CRSE_IMP","TS_JP_AD_CVB","TS_JP_AD_CVB_IMP","TS_JP_AD_DSVC","TS_JP_AD_DSVC_IMP","TS_JP_AD_EML","TS_JP_AD_EML_IMP",
				"TS_JP_AD_HOTL","TS_JP_AD_HOTL_IMP","TS_JP_AD_NON","TS_JP_AD_NON_IMP","TS_JP_AD_OTH","TS_JP_AD_OTH_IMP","TS_KR_AD_AIR","TS_KR_AD_AIR_IMP","TS_KR_AD_CAR","TS_KR_AD_CAR_IMP","TS_KR_AD_CRSE","TS_KR_AD_CRSE_IMP","TS_KR_AD_CVB","TS_KR_AD_CVB_IMP","TS_KR_AD_DSVC",
				"TS_KR_AD_DSVC_IMP","TS_KR_AD_EML","TS_KR_AD_EML_IMP","TS_KR_AD_HOTL","TS_KR_AD_HOTL_IMP","TS_KR_AD_NON","TS_KR_AD_NON_IMP","TS_KR_AD_OTH","TS_KR_AD_OTH_IMP","TS_LM_AD_AIR","TS_LM_AD_AIR_IMP","TS_LM_AD_CAR","TS_LM_AD_CAR_IMP","TS_LM_AD_CRSE","TS_LM_AD_CRSE_IMP",
				"TS_LM_AD_CVB","TS_LM_AD_CVB_IMP","TS_LM_AD_DSCV","TS_LM_AD_DSCV_IMP","TS_LM_AD_EML","TS_LM_AD_EML_IMP","TS_LM_AD_HOTL","TS_LM_AD_HOTL_IMP","TS_LM_AD_NON","TS_LM_AD_NON_IMP","TS_LM_AD_OTH","TS_LM_AD_OTH_IMP","TS_MESO_PASS_UK","TS_MFCLEARING","TS_MFCUSTPD","TS_MFCUSTPDUS",
				"TS_MFUSAIR","TS_MF_INV","TS_MISCREV","TS_MISC_SUPPLIER","TS_MONDIAL","TS_MONDIAL_AU","TS_MONDIAL_DE","TS_MONDIAL_DK","TS_MONDIAL_ES","TS_MONDIAL_FR","TS_MONDIAL_IT","TS_MONDIAL_JV","TS_MONDIAL_NL","TS_MONDIAL_NZ","TS_MONDIAL_UK","TS_MRJET_AD_AIR","TS_MRJET_AD_AIR_IMP",
				"TS_MRJET_AD_CAR","TS_MRJET_AD_CAR_IMP","TS_MRJET_AD_CRSE","TS_MRJET_AD_CRSE_IMP","TS_MRJET_AD_CVB","TS_MRJET_AD_CVB_IMP","TS_MRJET_AD_DSVC","TS_MRJET_AD_DSVC_IMP","TS_MRJET_AD_EML","TS_MRJET_AD_EML_IMP","TS_MRJET_AD_HOTL","TS_MRJET_AD_HOTL_IMP","TS_MRJET_AD_NON","TS_MRJET_AD_NON_IMP",
				"TS_MRJET_AD_OTH","TS_MRJET_AD_OTH_IMP","TS_MX_AD_AIR","TS_MX_AD_AIR_IMP","TS_MX_AD_CAR","TS_MX_AD_CAR_IMP","TS_MX_AD_CRSE","TS_MX_AD_CRSE_IMP","TS_MX_AD_CVB","TS_MX_AD_CVB_IMP","TS_MX_AD_DSVC","TS_MX_AD_DSVC_IMP","TS_MX_AD_EML","TS_MX_AD_EML_IMP","TS_MX_AD_HOTL","TS_MX_AD_HOTL_IMP",
				"TS_MX_AD_NON","TS_MX_AD_NON_IMP","TS_MX_AD_OTH","TS_MX_AD_OTH_IMP","TS_MY_AD_AIR","TS_MY_AD_AIR_IMP","TS_MY_AD_CAR","TS_MY_AD_CAR_IMP","TS_MY_AD_CRSE","TS_MY_AD_CRSE_IMP","TS_MY_AD_CVB","TS_MY_AD_CVB_IMP","TS_MY_AD_DSVC","TS_MY_AD_DSVC_IMP","TS_MY_AD_EML","TS_MY_AD_EML_IMP",
				"TS_MY_AD_HOTL","TS_MY_AD_HOTL_IMP","TS_MY_AD_NON","TS_MY_AD_NON_IMP","TS_MY_AD_OTH","TS_MY_AD_OTH_IMP","TS_NL_AD_AIR","TS_NL_AD_AIR_IMP","TS_NL_AD_CAR","TS_NL_AD_CAR_IMP","TS_NL_AD_CRSE","TS_NL_AD_CRSE_IMP","TS_NL_AD_CVB","TS_NL_AD_CVB_IMP","TS_NL_AD_DSVC","TS_NL_AD_DSVC_IMP",
				"TS_NL_AD_EML","TS_NL_AD_EML_IMP","TS_NL_AD_HOTL","TS_NL_AD_HOTL_IMP","TS_NL_AD_NON","TS_NL_AD_NON_IMP","TS_NL_AD_OTH","TS_NL_AD_OTH_IMP","TS_NO_AD_AIR","TS_NO_AD_AIR_IMP","TS_NO_AD_CAR","TS_NO_AD_CAR_IMP","TS_NO_AD_CRSE","TS_NO_AD_CRSE_IMP","TS_NO_AD_CVB","TS_NO_AD_CVB_IMP",
				"TS_NO_AD_DSVC","TS_NO_AD_DSVC_IMP","TS_NO_AD_EML","TS_NO_AD_EML_IMP","TS_NO_AD_HOTL","TS_NO_AD_HOTL_IMP","TS_NO_AD_NON","TS_NO_AD_NON_IMP","TS_NO_AD_OTH","TS_NO_AD_OTH_IMP","TS_NZ_AD_AIR","TS_NZ_AD_AIR_IMP","TS_NZ_AD_CAR","TS_NZ_AD_CAR_IMP","TS_NZ_AD_CRSE","TS_NZ_AD_CRSE_IMP",
				"TS_NZ_AD_CVB","TS_NZ_AD_CVB_IMP","TS_NZ_AD_DSVC","TS_NZ_AD_DSVC_IMP","TS_NZ_AD_EML","TS_NZ_AD_EML_IMP","TS_NZ_AD_HOTL","TS_NZ_AD_HOTL_IMP","TS_NZ_AD_NON","TS_NZ_AD_NON_IMP","TS_NZ_AD_OTH","TS_NZ_AD_OTH_IMP","TS_OverCommission_AT","TS_OverCommission_AU","TS_OverCommission_BR",
				"TS_OverCommission_DE","TS_OverCommission_DK","TS_OverCommission_ES","TS_OverCommission_FR","TS_OverCommission_IT","TS_OverCommission_MX","TS_OverCommission_NO","TS_OverCommission_NZ","TS_OverCommission_SE","TS_Overrides_AU","TS_Overrides_DE","TS_Overrides_DK","TS_Overrides_ES",
				"TS_Overrides_FR","TS_Overrides_IT","TS_Overrides_NL","TS_Overrides_NO","TS_Overrides_NZ","TS_Overrides_SE","TS_PASSADRP","TS_PASSPORT_ADS","TS_PASSPORT_ADS_IMP","TS_PH_AD_AIR","TS_PH_AD_AIR_IMP","TS_PH_AD_CAR","TS_PH_AD_CAR_IMP","TS_PH_AD_CRSE","TS_PH_AD_CRSE_IMP","TS_PH_AD_CVB",
				"TS_PH_AD_CVB_IMP","TS_PH_AD_DSVC","TS_PH_AD_DSVC_IMP","TS_PH_AD_EML","TS_PH_AD_EML_IMP","TS_PH_AD_HOTL","TS_PH_AD_HOTL_IMP","TS_PH_AD_NON","TS_PH_AD_NON_IMP","TS_PH_AD_OTH","TS_PH_AD_OTH_IMP","TS_ProfitShare_AU","TS_ProfitShare_DE","TS_ProfitShare_DK","TS_ProfitShare_ES",
				"TS_ProfitShare_FR","TS_ProfitShare_IT","TS_ProfitShare_NL","TS_ProfitShare_NO","TS_ProfitShare_NZ","TS_ProfitShare_SE","TS_RECOVERY","TS_REIMB_EXP_PKG","TS_RELOCATION","TS_RP_AU_AD_OTH_IMP","TS_RP_CA_AD_NON","TS_RP_CA_AD_OTH","TS_RP_CA_AD_OTH_IMP","TS_RP_UK_AD_OTH",
				"TS_RP_UK_AD_OTH_IMP","TS_RP_USADNON","TS_RP_USADOTH","TS_RP_US_AD_OTH_IMP","TS_RU_AD_AIR","TS_RU_AD_AIR_IMP","TS_RU_AD_CAR","TS_RU_AD_CAR_IMP","TS_RU_AD_CRSE","TS_RU_AD_CRSE_IMP","TS_RU_AD_CVB","TS_RU_AD_CVB_IMP","TS_RU_AD_DSVC","TS_RU_AD_DSVC_IMP","TS_RU_AD_EML","TS_RU_AD_EML_IMP",
				"TS_RU_AD_HOTL","TS_RU_AD_HOTL_IMP","TS_RU_AD_NON","TS_RU_AD_NON_IMP","TS_RU_AD_OTH","TS_RU_AD_OTH_IMP","TS_SE_AD_AIR","TS_SE_AD_AIR_IMP","TS_SE_AD_CAR","TS_SE_AD_CAR_IMP","TS_SE_AD_CRSE","TS_SE_AD_CRSE_IMP","TS_SE_AD_CVB","TS_SE_AD_CVB_IMP","TS_SE_AD_DSVC","TS_SE_AD_DSVC_IMP",
				"TS_SE_AD_EML","TS_SE_AD_EML_IMP","TS_SE_AD_HOTL","TS_SE_AD_HOTL_IMP","TS_SE_AD_NON","TS_SE_AD_NON_IMP","TS_SE_AD_OTH","TS_SE_AD_OTH_IMP","TS_SG_AD_AIR","TS_SG_AD_AIR_IMP","TS_SG_AD_CAR","TS_SG_AD_CAR_IMP","TS_SG_AD_CRSE","TS_SG_AD_CRSE_IMP","TS_SG_AD_CVB","TS_SG_AD_CVB_IMP",
				"TS_SG_AD_DSVC","TS_SG_AD_DSVC_IMP","TS_SG_AD_EML","TS_SG_AD_EML_IMP","TS_SG_AD_HOTL","TS_SG_AD_HOTL_IMP","TS_SG_AD_NON","TS_SG_AD_NON_IMP","TS_SG_AD_OTH","TS_SG_AD_OTH_IMP","TS_SUPP_COMP","TS_TD_AD_AIR","TS_TD_AD_AIR_IMP","TS_TD_AD_CAR","TS_TD_AD_CAR_IMP","TS_TD_AD_CRSE","TS_TD_AD_CRSE_IMP",
				"TS_TD_AD_CVB","TS_TD_AD_CVB_IMP","TS_TD_AD_DSVC","TS_TD_AD_DSVC_IMP","TS_TD_AD_EML","TS_TD_AD_EML_IMP","TS_TD_AD_HOTL","TS_TD_AD_HOTL_IMP","TS_TD_AD_NON","TS_TD_AD_NON_IMP","TS_TD_AD_OTH","TS_TD_AD_OTH_IMP","TS_TH_AD_AIR","TS_TH_AD_AIR_IMP","TS_TH_AD_CAR","TS_TH_AD_CAR_IMP","TS_TH_AD_CRSE",
				"TS_TH_AD_CRSE_IMP","TS_TH_AD_CVB","TS_TH_AD_CVB_IMP","TS_TH_AD_DSVC","TS_TH_AD_DSVC_IMP","TS_TH_AD_EML","TS_TH_AD_EML_IMP","TS_TH_AD_HOTL","TS_TH_AD_HOTL_IMP","TS_TH_AD_NON","TS_TH_AD_NON_IMP","TS_TH_AD_OTH","TS_TH_AD_OTH_IMP","TS_TVLY_COUPON","TS_TW_AD_AIR","TS_TW_AD_AIR_IMP","TS_TW_AD_CAR",
				"TS_TW_AD_CAR_IMP","TS_TW_AD_CRSE","TS_TW_AD_CRSE_IMP","TS_TW_AD_CVB","TS_TW_AD_CVB_IMP","TS_TW_AD_DSVC","TS_TW_AD_DSVC_IMP","TS_TW_AD_EML","TS_TW_AD_EML_IMP","TS_TW_AD_HOTL","TS_TW_AD_HOTL_IMP","TS_TW_AD_NON","TS_TW_AD_NON_IMP","TS_TW_AD_OTH","TS_TW_AD_OTH_IMP","TS_UA_CALLTRN","TS_UK_AD_AIR",
				"TS_UK_AD_AIR_IMP","TS_UK_AD_CAR","TS_UK_AD_CAR_IMP","TS_UK_AD_CRSE","TS_UK_AD_CRSE_IMP","TS_UK_AD_CVB","TS_UK_AD_CVB_IMP","TS_UK_AD_DSVC","TS_UK_AD_DSVC_IMP","TS_UK_AD_EML","TS_UK_AD_EML_IMP","TS_UK_AD_HOTL","TS_UK_AD_HOTL_IMP","TS_UK_AD_NON","TS_UK_AD_NON_IMP","TS_UK_AD_OTH","TS_UK_AD_OTH_IMP",
				"TS_UK_TRN_COM","TS_US_AD_AIR","TS_US_AD_AIR_IMP","TS_US_AD_CAR","TS_US_AD_CAR_IMP","TS_US_AD_CRSE","TS_US_AD_CRSE_IMP","TS_US_AD_CVB","TS_US_AD_CVB_IMP","TS_US_AD_DSVC","TS_US_AD_DSVC_IMP","TS_US_AD_EML","TS_US_AD_EML_IMP","TS_US_AD_HOTL","TS_US_AD_HOTL_IMP","TS_US_AD_NON","TS_US_AD_NON_IMP",
				"TS_US_AD_OTH","TS_US_AD_OTH_IMP","TS_US_TRVLAD","TS_VN_AD_AIR","TS_VN_AD_AIR_IMP","TS_VN_AD_CAR","TS_VN_AD_CAR_IMP","TS_VN_AD_CRSE","TS_VN_AD_CRSE_IMP","TS_VN_AD_CVB","TS_VN_AD_CVB_IMP","TS_VN_AD_DSVC","TS_VN_AD_DSVC_IMP","TS_VN_AD_EML","TS_VN_AD_EML_IMP","TS_VN_AD_HOTL","TS_VN_AD_HOTL_IMP",
				"TS_VN_AD_NON","TS_VN_AD_NON_IMP","TS_VN_AD_OTH","TS_VN_AD_OTH_IMP","TS_VST_BILLING","TS_VS_BILLING","TS_VT_AD_AIR","TS_VT_AD_AIR_IMP","TS_VT_AD_CAR","TS_VT_AD_CAR_IMP","TS_VT_AD_CRSE","TS_VT_AD_CRSE_IMP","TS_VT_AD_CVB","TS_VT_AD_CVB_IMP","TS_VT_AD_DSVC","TS_VT_AD_DSVC_IMP","TS_VT_AD_EML",
				"TS_VT_AD_EML_IMP","TS_VT_AD_HOTL","TS_VT_AD_HOTL_IMP","TS_VT_AD_NON","TS_VT_AD_NON_IMP","TS_VT_AD_OTH","TS_VT_AD_OTH_IMP","TS_WO_AD_AIR","TS_WO_AD_AIR_IMP","TS_WO_AD_CAR","TS_WO_AD_CAR_IMP","TS_WO_AD_CRSE","TS_WO_AD_CRSE_IMP","TS_WO_AD_CVB","TS_WO_AD_CVB_IMP","TS_WO_AD_DSVC","TS_WO_AD_DSVC_IMP",
				"TS_WO_AD_EML","TS_WO_AD_EML_IMP","TS_WO_AD_HOTL","TS_WO_AD_HOTL_IMP","TS_WO_AD_NON","TS_WO_AD_NON_IMP","TS_WO_AD_OTH","TS_WO_AD_OTH_IMP","TS_WYNDHAM_RELO","TS_WZ_AD_AIR","TS_WZ_AD_AIR_IMP","TS_WZ_AD_CAR","TS_WZ_AD_CAR_IMP","TS_WZ_AD_CRSE","TS_WZ_AD_CRSE_IMP","TS_WZ_AD_CVB","TS_WZ_AD_CVB_IMP",
				"TS_WZ_AD_DSVC","TS_WZ_AD_DSVC_IMP","TS_WZ_AD_EML","TS_WZ_AD_EML_IMP","TS_WZ_AD_HOTL","TS_WZ_AD_HOTL_IMP","TS_WZ_AD_NON","TS_WZ_AD_NON_IMP","TS_WZ_AD_OTH","TS_WZ_AD_OTH_IMP","TS__ORBTZ__AD_AIR","TS__ORBTZ__AD_AIR_IMP","TS__ORBTZ__AD_CAR","TS__ORBTZ__AD_CAR_IMP","TS__ORBTZ__AD_CVB","TS__ORBTZ__AD_CVB_IMP",
				"TS__ORBTZ__AD_DSCV","TS__ORBTZ__AD_DSCV_IMP","TS__ORBTZ__AD_EML","TS__ORBTZ__AD_EML_IMP","TS__ORBTZ__AD_HOTL","TS__ORBTZ__AD_HOTL_IMP","TS__ORBTZ__AD_NON","TS__ORBTZ__AD_NON_IMP","TS__ORBTZ__AD_OTH","TS__ORBTZ__AD_OTH_IMP","TVLY_CA_AD_AIR","TVLY_CA_AD_AIR_IMP","TVLY_CA_AD_CAR","TVLY_CA_AD_CAR_IMP",
				"TVLY_CA_AD_CRSE","TVLY_CA_AD_CRSE_IMP","TVLY_CA_AD_CVB","TVLY_CA_AD_CVB_IMP","TVLY_CA_AD_DSVC","TVLY_CA_AD_DSVC_IMP","TVLY_CA_AD_EML","TVLY_CA_AD_EML_IMP","TVLY_CA_AD_HOTL","TVLY_CA_AD_HOTL_IMP","TVLY_CA_AD_NON","TVLY_CA_AD_NON_IMP","TVLY_CA_AD_OTH","TVLY_CA_AD_OTH_IMP","TVLY_CA_AD_TSHP","TVLY_CA_TRVLAD",
				"TVLY_MF_CA_AD_AIR","TVLY_MF_CA_AD_CAR","TVLY_MF_CA_AD_CRSE","TVLY_MF_CA_AD_CVB","TVLY_MF_CA_AD_DSVC","TVLY_MF_CA_AD_EML","TVLY_MF_CA_AD_EML_IMP","TVLY_MF_CA_AD_HOTL","TVLY_MF_CA_AD_OTH","TVLY_MF_CA_NON","TVLY_MF_US_AD_AIR","TVLY_MF_US_AD_CAR","TVLY_MF_US_AD_CRSE","TVLY_MF_US_AD_CVB","TVLY_MF_US_AD_DSVC",
				"TVLY_MF_US_AD_EML","TVLY_MF_US_AD_EML_IMP","TVLY_MF_US_AD_HOTL","TVLY_MF_US_AD_NON","TVLY_MF_US_AD_OTH","TVLY_US_AD_AIR","TVLY_US_AD_AIR_IMP","TVLY_US_AD_CAR","TVLY_US_AD_CAR_IMP","TVLY_US_AD_CRSE","TVLY_US_AD_CRSE_IMP","TVLY_US_AD_CVB","TVLY_US_AD_CVB_IMP","TVLY_US_AD_DSVC","TVLY_US_AD_DSVC_IMP",
				"TVLY_US_AD_EML","TVLY_US_AD_EML_IMP","TVLY_US_AD_HOTL","TVLY_US_AD_HOTL_IMP","TVLY_US_AD_NON","TVLY_US_AD_NON_IMP","TVLY_US_AD_OTH","TVLY_US_AD_OTH_IMP","TVLY_US_AD_TSHP","TVLY_US_TRVLAD","VSC_PHONE","XSV_82103"])
}

function itemCode2()
{
	var f = itemCode;
	f.setItems(["TS_EAC_BOOK","TS_EAC_GR_AAGo","TS_EAC_GR_AMER","TS_EAC_GR_APAC","TS_EAC_GR_EMEA","TS_EAC_GR_LATAM","TS_EAC_STAY"])
}

function itemCode3()
{
	var f = itemCode;
	f.setItems(["TS_ELONG_MS_AIR","TS_ELONG_MS_CAR","TS_ELONG_MS_CRSE","TS_ELONG_MS_CVB","TS_ELONG_MS_DSVC","TS_ELONG_MS_EML","TS_ELONG_MS_EML_IMP","TS_ELONG_MS_HOTL","TS_ELONG_MS_NON","TS_ELONG_MS_OTH"])
}

function itemCode4()
{
	var f = itemCode;
	f.setItems(["TS_RP_AU_AD_OTH_IMP","TS_RP_CA_AD_NON","TS_RP_CA_AD_OTH","TS_RP_CA_AD_OTH_IMP","TS_RP_UK_AD_OTH","TS_RP_UK_AD_OTH_IMP","TS_RP_USADNON","TS_RP_USADOTH","TS_RP_US_AD_OTH_IMP"])
}

function itemCode5()
{
	var f = itemCode;
	f.setItems(["TS_US_TRVLAD"])
}

function itemCode6()
{
	var f = itemCode;
	f.setItems(["TS_VST_BILLING"])
}

function itemCode7()
{
	var f = itemCode;
	f.setItems(["EGA_TRAN_FEE","EGMIU_PLAN_FEES","EG_AD_AIR","EG_AD_CAR","EG_AD_HOT","EG_AD_MISC","EG_AGENT","EG_AIR_CONTRACT","EG_ANNUAL_FEE","EG_BULK_DATA","EG_CA_AD_HOT","EG_CC_RECON","EG_CONTRA_SALARY","EG_CUSTOM-REPORTS","EG_EARLY_TERM","EG_ESS_ANN_FEE","EG_HOTEL_CONTRACT","EG_MFCLEARING",
				"EG_MISC","EG_MIU_AAB","EG_MIU_AGENT_LABOR","EG_MIU_AH","EG_MIU_AHCO_FEE","EG_MIU_ANALYSIS","EG_MIU_ATTLOAD","EG_MIU_CRPTS","EG_MIU_DEPOSIT","EG_MIU_EVENT","EG_MIU_GIFTCERT","EG_MIU_ONCALL","EG_MIU_ONSITE","EG_MIU_PLAN_FEES","EG_MIU_PROFILE","EG_MIU_REG_FEES","EG_MIU_SPRTS","EG_MIU_TRAN_FEES",
				"EG_PROFILE","EG_RED24","EG_REIMBURSE_ACTELION","EG_REIMBURSE_BAIN","EG_REIMBURSE_COOLEY","EG_REIMBURSE_DUKE_ENERGY","EG_REIMBURSE_EISAI","EG_REIMBURSE_EVERCORE","EG_REIMBURSE_FAIR_ISAAC","EG_REIMBURSE_FLOWSERVE","EG_REIMBURSE_HERSHEY","EG_REIMBURSE_HILTI","EG_REIMBURSE_HOUGHTON",
				"EG_REIMBURSE_HSBC","EG_REIMBURSE_IMG_WORLDWIDE","EG_REIMBURSE_INTEL_VENTURE","EG_REIMBURSE_JONES_LANG","EG_REIMBURSE_KAR","EG_REIMBURSE_LAS_VEGAS","EG_REIMBURSE_LENOVO","EG_REIMBURSE_MANPOWER","EG_REIMBURSE_MCDERMOTT","EG_REIMBURSE_MONSTER","EG_REIMBURSE_NEFLIX","EG_REIMBURSE_NEWELL_BRANDS",
				"EG_REIMBURSE_RUSSELL","EG_REIMBURSE_SCHREIBER","EG_REIMBURSE_TOP_RANK","EG_REIMBURSE_T_ROWE_PRICE","EG_REIMBURSE_WILLIAMS_CO","EG_REIMBURSE_WILLIAM_BLAIR","EG_REIMBURSE_WORKDAY","EG_REIMBURSE_WW_GRAINGER","EG_REPORTS","EG_SOS","EG_STD_ANN_FEE","EG_TRAN_FEE","EG_TRAN_FEE_REB","EG_US_CONSULTING",
				"EG_US_DELTA_DUPES","EG_US_MFCLEARING","EG_US_MFCUSTPDCA","EG_US_MFCUSTPDUS","EG_US_MFUSAIR","EG_US_SLA_CREDIT","EG_US_SSO_SETUP","EG_US_SWA_SURCHARGE","FURNITURE CAPITAL","LEASEHOLD IMPROVEMENT","NETWORK CAPITAL","NETWORK COMPONENT","NETWORK SOFTWARE","OFFICE EQUIPMENT","PC DESKTOP","PC LAPTOP",
				"SAN CAPITAL","SAN COMPONENT","SAN SOFTWARE","SERVER CAPITAL","SERVER COMPONENT","SERVER SOFTWARE","SOFTWARE CAPITAL","TELECOM CAPITAL","TELECOM PERIPHERAL"])
}

//function to calculate total amount due
function calculateTotal()
{
	var sum = qty.value * unitPrice.value;
	lineTotal.value = sum;
}
