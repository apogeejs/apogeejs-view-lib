import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import AceTextEditor from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

export default class JsonPlusTableComponentView extends ComponentView {

    //==============================
    // Protected and Private Instance Methods
    //==============================

    getDataDataDisplay(displayContainer) {
        let dataDisplaySource = this.getDataSource();
        return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/json",AceTextEditor.OPTION_SET_DISPLAY_SOME);
    }

    
    /** This data source is read only (no edit). It returns text for a json */
    getDataSource() {

        return {
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let component = this.getComponent();
                let reloadData = component.isMemberDataUpdated("member");
                let reloadDataDisplay = false;
                return {reloadData,reloadDataDisplay};
            },

            getData: () => {
                let member = this.getComponent().getMember();
                let state = member.getState();
                if(state != apogeeutil.STATE_NORMAL) {
                    //handle non-normal state returning wrapped data
                    let wrappedData = dataDisplayHelper.getEmptyWrappedData();
                    wrappedData.hideDisplay = true;
                    wrappedData.data = apogeeutil.INVALID_VALUE;
                    switch(member.getState()) {
                        case apogeeutil.STATE_ERROR: 
                            wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                            wrappedData.message = "Error in value: " + member.getErrorMsg();
                            break;

                        case apogeeutil.STATE_PENDING:
                            wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_INFO;
                            wrappedData.message = "Value pending!";
                            break;

                        case apogeeutil.STATE_INVALID:
                            wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_INFO;
                            wrappedData.message = "Value invalid!";
                            break;

                        default:
                            throw new Error("Unknown display data value state!")
                    }
                    return wrappedData;
                }

                let jsonPlus = member.getData();

                var textData;
                if(jsonPlus == apogeeutil.INVALID_VALUE) {
                    //for invalid input, convert to display an empty string
                    textData = "";
                }
                else if(jsonPlus === undefined) {
                    textData = "undefined";
                }
                else {
                    let modifiedValueJson = replaceFunctions(jsonPlus);
                    textData = JSON.stringify(modifiedValueJson,null,FORMAT_STRING);
                }

                return textData;
            }
        }
    }


}


const FORMAT_STRING = "\t";

/** The following functions update a json with functions to be a plain json, with a
 * replacement string for any functions. (It is pretty inefficient.) */

const FUNCTION_REPLACEMENT_STRING = "[**FUNCTION**]";

function replaceFunctions(jsonPlus) {
    var copiedJson;

    var objectType = apogeeutil.getObjectType(jsonPlus);
    
    switch(objectType) {
        case "Object":
            copiedJson = replaceFunctionInObject(jsonPlus);
            break;
            
        case "Array": 
            copiedJson = replaceFunctionsInArray(jsonPlus);
            break;

        case "Function": 
            //copiedJson = FUNCTION_REPLACEMENT_STRING;
            copiedJson = jsonPlus.toString();
            break;
            
        default:
            copiedJson = jsonPlus;
    }
    
    return copiedJson;
}

function replaceFunctionInObject(jsonPlus) {
    var copiedJson = {};
    for(let key in jsonPlus) {
        copiedJson[key] = replaceFunctions(jsonPlus[key]);
    }
    return copiedJson;
}

function replaceFunctionsInArray(jsonPlus) {
    var copiedJson = [];
    for(var i = 0; i < jsonPlus.length; i++) {
        var element = jsonPlus[i];
        copiedJson.push(apogeeutil.getNormalizedCopy(element));
    }
    return copiedJson;
}

//===============================
// Internal Settings
//===============================

JsonPlusTableComponentView.VIEW_MODES = [
    getErrorViewModeEntry(),
    {
        name: "Data",
        label: "Data",
        sourceLayer: "model",
        sourceType: "data",
        isActive: true,
        getDataDisplay: (componentView,displayContainer) => componentView.getDataDataDisplay(displayContainer)
    },
    getFormulaViewModeEntry("member"),
    getPrivateViewModeEntry("member")
];


//===============================
// External Settings
//===============================

/** This is the component name with which this view is associated. */
JsonPlusTableComponentView.componentName = "apogeeapp.ExtendedJsonCell";

/** If true, this indicates the component has a tab entry */
JsonPlusTableComponentView.hasTabEntry = false;
/** If true, this indicates the component has an entry appearing on the parent tab */
JsonPlusTableComponentView.hasChildEntry = true;
/** This is the icon url for the component. */
JsonPlusTableComponentView.ICON_RES_PATH = "/icons3/jsonCellIcon.png";
/** This field gives the default value for the JSON taht should be deserialized to
 * create the member for this object. The field "name" can be omitted. This will 
 * be added when the member is created. */

