import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js"

let dataDisplayHelper = {};
export {dataDisplayHelper as default}

const MIME_TYPE_JSON = "application/json"
const SPACING_FORMAT_STRING = "\t";


/** This function creates the data display data source  for the data of the given member. The
 * member field should be the field name used to access the data source from the associated component. */
dataDisplayHelper.getMemberDataJsonDataSource = function(app,componentView,memberFieldName,doReadOnly) {
    return _getMemberDataDataSource(app,componentView,memberFieldName,doReadOnly);
}

/** This function creates editor callbacks or member data where the editor takes text format. 
 * This data source sets error valueData (a substitue value) when the user tries to save an improperly 
 * formatted JSON. */
 dataDisplayHelper.getMemberDataTextDataSource = function(app,componentView,memberFieldName,doReadOnly) {
    return _getMemberDataDataSource(app,componentView,memberFieldName,doReadOnly,{stringify: true});
 }

 /** This gets a data source for JSON or stringified JSON data from a member. */
function _getMemberDataDataSource(app,componentView,memberFieldName,doReadOnly,options) {
    if(!options) options = {};
    
    return {

        doUpdate: function() {
            //return value is whether or not the data display needs to be udpated
            let component = componentView.getComponent();
            let reloadData = component.isMemberDataUpdated(memberFieldName);
            let reloadDataDisplay = false;
            return {reloadData,reloadDataDisplay};
        },

        getData: function() {
            return dataDisplayHelper.getWrappedMemberData(componentView,memberFieldName,options);
        },

        getEditOk: doReadOnly ? 
            function () { return false; }  : 
            function () {
                let member = componentView.getComponent().getField(memberFieldName);
                return !member.hasCode();
            },

        saveData: doReadOnly ? undefined :
            function(data) {

                //is the display data is stringified, parse it into a json
                if(options.stringify) {
                    let text = data;
                    if(text === "undefined") {
                        data = undefined;
                    }
                    else {
                        //this call adds spogee specific error information if the parse fails
                        try {
                            data = JSON.parse(text);
                        }
                        catch(error) {
                            //if we had an error parsing append the string data to the error so we can display it.
                            if(apogeeutil._.isString(data)) {
                                error.valueData = {
                                    value: text,
                                    nominalType: MIME_TYPE_JSON,
                                    stringified: true
                                };
                            }
                            data = error;
                            
                        }
                    }
                }

                let member = componentView.getComponent().getField(memberFieldName);
                var commandData = {};
                commandData.type = "saveMemberData";
                commandData.memberId = member.getId();
                commandData.data = data;
                
                app.executeCommand(commandData);
                return true;
            }
    }
}

/** This function creates editor callbacks or the member function body. 
 * The argument optionalClearCodeValue can optionally be set. If so, the member data will be 
 * set with this value if the function body and supplemental code are empty. 
 * The optionalDefaultDataValue will be used to clear the function and save the data value if the formula and
 * private code are empty strings. */
dataDisplayHelper.getMemberFunctionBodyDataSource = function(app,componentView,memberFieldName) {

    return {

        doUpdate: function() {
            //return value is whether or not the data display needs to be udpated
            let component = componentView.getComponent();
            let reloadData = component.isMemberFieldUpdated(memberFieldName,"functionBody");
            let reloadDataDisplay = false;
            return {reloadData,reloadDataDisplay};
        },

        getData: function() {
            let functionMember = componentView.getComponent().getField(memberFieldName);
            return { 
                data: functionMember.getFunctionBody()
            }
        },

        getEditOk: function() {
            return true;
        },

        saveData: function(text) {
            let functionMember = componentView.getComponent().getField(memberFieldName);

            var commandData = {};
            commandData.type = "saveMemberCode";
            commandData.memberId = functionMember.getId();
            commandData.argList = functionMember.getArgList();
            commandData.functionBody = text;
            commandData.supplementalCode = functionMember.getSupplementalCode();
            
            app.executeCommand(commandData);
            return true;
        }
    }
}

/** This function creates editor callbacks or the member supplemental code. */
dataDisplayHelper.getMemberSupplementalDataSource = function(app,componentView,memberFieldName) {

    return {

        doUpdate: function() {
            //return value is whether or not the data display needs to be udpated
            let component = componentView.getComponent();
            let reloadData = component.isMemberFieldUpdated(memberFieldName,"supplementalCode");
            let reloadDataDisplay = false;
            return {reloadData,reloadDataDisplay};
        },

        getData: function() {
            let functionMember = componentView.getComponent().getField(memberFieldName);
            return {
                data: functionMember.getSupplementalCode()
            }
        },

        getEditOk: function() {
            return true;
        },

        saveData: function(text) {
            let functionMember = componentView.getComponent().getField(memberFieldName);

            var commandData = {};
            commandData.type = "saveMemberCode";
            commandData.memberId = functionMember.getId();
            commandData.argList = functionMember.getArgList();
            commandData.functionBody = functionMember.getFunctionBody();
            commandData.supplementalCode = text;
            
            app.executeCommand(commandData);
            return true;
        }
    }
}


/** This function creates the data display data source  for the data of the given member. The
 * member field should be the field name used to access the data source from the associated component. */
dataDisplayHelper.getStandardErrorDataSource = function(app,componentView) {
    
    return {
        doUpdate: function() {
            //remove the view if here is an error and error info
            let component = componentView.getComponent();
            let removeView;
            if(componentView.getBannerState() == apogeeutil.STATE_ERROR) {
                let errorInfoList = componentView.getErrorInfoList();
                removeView = !((errorInfoList)&&(errorInfoList.length > 0));
            }
            else {
                removeView = true;
            }

            let reloadData = component.isMemberDataUpdated("member");
            let reloadDataDisplay = false;
            return {reloadData,reloadDataDisplay,removeView};
        },

        getData: function() {
            if(componentView.getBannerState() == apogeeutil.STATE_ERROR) {
                let errorInfoList = componentView.getErrorInfoList()
                if((errorInfoList)&&(errorInfoList.length > 0)) {
                    //show data view, this is our data
                    return {
                        data: errorInfoList
                    }
                }
            }

            //no error info; we shouldn't get here
            return {
                data: apogeeutil.INVALID_VALUE
            }
            
        }
    }
}

/** This method returns data source wrapped data, for getData and getDisplayData 
 * options:
 * - stringify - Stringifies the data. Otherwise it is returned as is (JSON data assumed).
*/
dataDisplayHelper.getWrappedMemberData = function(componentView,memberFieldName,options) {
    if(!options) options = {};
    let member = componentView.getComponent().getField(memberFieldName);
    let wrappedData = {};
    if(member.getState() != apogeeutil.STATE_NORMAL) {
        
        switch(member.getState()) {
            case apogeeutil.STATE_ERROR: 
                //check if there is valueData on the error object, in which case we may be able to include it.
                let error = member.getError();
                if((error)&&(error.valueData)) {
                    //there is a substitute value
                    //only process json, which is what we expect this to hold
                    if(error.valueData.nominalType == MIME_TYPE_JSON) {
                        if(options.stringify) {
                            if(error.valueData.stringified) {
                                wrappedData.data = error.valueData.value;
                            }
                            else {
                                wrappedData.data = _stringifyJsonData(error.valueData.value);
                            }
                        }
                        else {
                            wrappedData.data = error.valueData.value;
                        }
                    }
                }
                else {
                    wrappedData.data = apogeeutil.INVALID_VALUE;
                }
                wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                wrappedData.message = "Error in value: " + member.getErrorMsg();
                break;

            case apogeeutil.STATE_PENDING:
                wrappedData.data = apogeeutil.INVALID_VALUE;
                wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_INFO;
                wrappedData.message = "Value pending!";
                break;

            case apogeeutil.STATE_INVALID:
                wrappedData.data = apogeeutil.INVALID_VALUE;
                wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_INFO;
                wrappedData.message = "Value invalid!";
                break;

            default:
                throw new Error("Unknown display data value state!")
        }

        wrappedData.hideDisplay = (wrappedData.data === apogeeutil.INVALID_VALUE);
    }
    else {
        let data = member.getData();
        if(options.stringify) {
            wrappedData.data = _stringifyJsonData(data);
        }
        else {
            wrappedData.data = data;
        }
    }

    return wrappedData;
}

function _stringifyJsonData(data) {
    if(data == apogeeutil.INVALID_VALUE) return apogeeutilINVALID_VALUE;
    else return JSON.stringify(data,null,SPACING_FORMAT_STRING);
}
