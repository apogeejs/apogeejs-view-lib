import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import {Messenger} from "/apogeejs-model-lib/src/apogeeModelLib.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry,getMemberDataTextViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";

//==============================
// Protected and Private Instance Methods
//==============================

function getFormViewDisplay(component,displayContainer) {
    let dataDisplaySource = getOutputDataDisplaySource(component);
    return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
}

function getOutputDataDisplaySource(component) {
    return {
        //NEED TO FACTOR IN INPUT VALUE!!!

        //This method reloads the component and checks if there is a DATA update. UI update is checked later.
        doUpdate: () => {
            let reloadData = component.isMemberDataUpdated("member.value");
            let reloadDataDisplay = component.isFieldUpdated("layoutFunction") || component.isMemberFieldUpdated("member.input","data");
            return {reloadData,reloadDataDisplay};
        },

        getDisplayData: () => {       
            //get the layout function
            let layoutFunction = component.getField("layoutFunction");
            if(layoutFunction instanceof Error) {
                let wrappedData = {};
                wrappedData.displayInvalid = true;
                wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                wrappedData.message = "Error in layout function: " + layoutFunction.toString();
                return wrappedData;
            }

            //load the layout
            let wrappedData = dataDisplayHelper.getWrappedMemberData(component,"member.input");

            //use the parent folder as the scope base
            if(wrappedData.data != apogeeutil.INVALID_VALUE) {
                let runContextLink = component.getApp().getWorkspaceManager().getRunContextLink();
                let scopeMemberId = component.getMember().getParentId();
                let messenger = new Messenger(runContextLink,scopeMemberId);
                try {
                    let layout = layoutFunction(messenger,wrappedData.data);
                    wrappedData.data = layout;
                }
                catch(error) {
                    let errorWrappedData = {};
                    errorWrappedData.hideDisplay = true;
                    errorWrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                    errorWrappedData.message = "Error executing layout function: " + error.toString();
                    return errorWrappedData;
                }
            }

            return wrappedData;
        },

        getData: () => dataDisplayHelper.getWrappedMemberData(component,"member.value"),

        getEditOk: () => true,

        saveData: (formValue) => {
            //below this data is valid only for normal state input. That should be ok since this is save.
            let inputData = component.getField("member.input").getData();

            try {
                let isDataValidFunction = component.getField("validatorFunction");
                if(isDataValidFunction instanceof Error) {
                    //this is clumsy - we need to show the user somewhere that there is an error
                    //maybe in the code?
                    apogeeUserAlert("Error in validator function! Input could not be processed!");
                    return false;
                }

                let isValidResult = isDataValidFunction(formValue,inputData);
                if(isValidResult === true) {
                    //save data
                    let runContextLink = component.getApp().getWorkspaceManager().getRunContextLink();
                    let memberId = component.getMemberId();
                    let messenger = new Messenger(runContextLink,memberId);
                    messenger.dataUpdate("value",formValue);
                    return true;
                }
                else {
                    //isValidResult should be the error message. Check to make sure if it is string, 
                    //since the user may return false. (If so, give a generic error message)
                    let msg = ((typeof isValidResult) == "string") ? isValidResult : "Invalid form value!";
                    apogeeUserAlert(msg);
                    return false;
                }
            }
            catch(error) {
                if(error.stack) console.error(error.stack);
                apogeeUserAlert("Error validating input: " + error.toString());
            }
        }
    }
}

const FullDataFormComponentViewConfig = {
    componentType: "apogeeapp.FullDataFormCell",
    viewClass: ComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "Form",
            label: "Form",
            sourceLayer: "model",
            sourceType: "data",
            suffix: ".value", 
            isActive: true,
            getDataDisplay: (component,displayContainer) => getFormViewDisplay(component,displayContainer)
        },
        getAppCodeViewModeEntry("layoutCode","layoutFunction","layout","Layout Code",{argList:"commandMessenger,inputData",isActive: true}),
        getAppCodeViewModeEntry("validatorCode","validatorFunction","validator","Validator Code",{argList:"formValue,inputData"}),
        getFormulaViewModeEntry("member.input",{name: "input", label:"Input Data Code"}),
        getPrivateViewModeEntry("member.input",{name: "inputPrivate", label:"Input Data Private"}),
        getMemberDataTextViewModeEntry("member.value")
    ],
    iconResPath: "/icons3/formCellIcon.png"
}
export default FullDataFormComponentViewConfig;





