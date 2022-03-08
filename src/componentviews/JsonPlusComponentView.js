import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import AceTextEditor from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";



//==============================
// Protected and Private Instance Methods
//==============================

function getDataDataDisplay(component, displayContainer) {
    let dataDisplaySource = getDataSource(component);
    return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/json",AceTextEditor.OPTION_SET_DISPLAY_SOME);
}


/** This data source is read only (no edit). It returns text for a json */
function getDataSource(component) {

    return {
        doUpdate: () => {
            //return value is whether or not the data display needs to be udpated
            let reloadData = component.isMemberDataUpdated("member");
            let reloadDataDisplay = false;
            return {reloadData,reloadDataDisplay};
        },

        getData: () => {
            let wrappedData = dataDisplayHelper.getWrappedMemberData(component,"member")
            //if we have valid data, update it to display the functions with the otherwise JSON data.
            if(wrappedData.data != apogeeutil.INVALID_VALUE) {
                var textData;
                if(wrappedData.data === undefined) {
                    textData = "undefined";
                }
                else {
                    let modifiedValueJson = replaceFunctions(wrappedData.data);
                    textData = JSON.stringify(modifiedValueJson,null,FORMAT_STRING);
                }

                wrappedData.data = textData;
            }
        }
    }
}




const FORMAT_STRING = "\t";

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
        copiedJson.push(replaceFunctions(element));
    }
    return copiedJson;
}

const JsonPlusComponentViewConfig = {
    componentType: "apogeeapp.ExtendedJsonCell",
    viewClass: ComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "Data",
            label: "Data",
            sourceLayer: "model",
            sourceType: "data",
            isActive: true,
            getDataDisplay: (component,displayContainer) => getDataDataDisplay(component,displayContainer)
        },
        getFormulaViewModeEntry("member"),
        getPrivateViewModeEntry("member")
    ],
    iconResPath: "/icons3/jsonCellIcon.png"
}
export default JsonPlusComponentViewConfig;
