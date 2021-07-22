import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry,getMemberDataTextViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

/** This is a custom resource component. 
 * To implement it, the resource script must have the methods "run()" which will
 * be called when the component is updated. It also must have any methods that are
 * confugred with initialization data from the model. */
export default class FullDataFormComponentView extends ComponentView {

    //==============================
    // Protected and Private Instance Methods
    //==============================

    getFormViewDisplay(displayContainer) {
        let dataDisplaySource = this.getOutputDataDisplaySource();
        return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
    }

    getOutputDataDisplaySource() {
        //load this when the form is updated, to be used when form submitted
        //we will update the form if this value changes
        let isDataValidFunction;

        return {
            //NEED TO FACTOR IN INPUT VALUE!!!

            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let component = this.getComponent();
                let reloadData = component.isMemberDataUpdated("member.value");
                let reloadDataDisplay = component.areAnyFieldsUpdated(["layoutCode","validatorCode"]) || component.isMemberFieldUpdated("member.input","data");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => {       
                let wrappedData = dataDisplayHelper.getEmptyWrappedData();

                //get the layout function
                let component = this.getComponent();
                let {layoutFunction,validatorFunction,errorMessage} = component.createFormFunctions();
                if(errorMessage) {
                    wrappedData.displayInvalid = true;
                    wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                    wrappedData.message = errorMessage;
                    return wrappedData;
                }

                //load the layout
                let inputMember = component.getField("member.input");
                let {abnormalWrappedData,inputData} = dataDisplayHelper.getProcessedMemberDisplayData(inputMember);
                if(abnormalWrappedData) {
                    return abnormalWrappedData;
                }

                //save this for use on submit
                isDataValidFunction = validatorFunction;

                //use the parent folder as the context base
                let contextMemberId = component.getMember().getParentId();
                let commandMessenger = new UiCommandMessenger(this,contextMemberId);
                try {
                    let layout = layoutFunction(commandMessenger,inputData);
                    wrappedData.data = layout;
                    return wrappedData;
                }
                catch(error) {
                    wrappedData.displayInvalid = true;
                    wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                    wrappedData.message = "Error executing layout function: " + error.toString();
                    return wrappedData;
                }
            },

            getData: () => {
                let valueMember = this.getComponent().getField("member.value");
                return dataDisplayHelper.getStandardWrappedMemberData(valueMember,true);
            },

            getEditOk: () => true,

            saveData: (formValue) => {
                let component = this.getComponent();
                //below this data is valid only for normal state input. That should be ok since this is save.
                let inputData = component.getField("member.input").getData();

                try {
                    let isValidResult = isDataValidFunction(formValue,inputData);
                    if(isValidResult === true) {
                        //save data
                        let memberId = component.getMemberId();
                        let commandMessenger = new UiCommandMessenger(this,memberId);
                        commandMessenger.dataCommand("value",formValue);
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

}

//======================================
// This is the control generator, to register the control
//======================================

FullDataFormComponentView.VIEW_MODES = [
    getErrorViewModeEntry(),
    {
        name: FullDataFormComponentView.VIEW_FORM,
        label: "Form",
        sourceLayer: "model",
        sourceType: "data",
        suffix: ".value", 
        isActive: true,
        getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDisplay(displayContainer)
    },
    getAppCodeViewModeEntry("layoutCode","layout","Layout Code",{argList:"commandMessenger,inputData",isActive: true}),
    getAppCodeViewModeEntry("validatorCode","validator","Validator Code",{argList:"formValue,inputData"}),
    getFormulaViewModeEntry("member.input",{name: "input", label:"Input Data Code"}),
    getPrivateViewModeEntry("member.input",{name: "inputPrivate", label:"Input Data Private"}),
    getMemberDataTextViewModeEntry("member.value")
];

FullDataFormComponentView.componentName = "apogeeapp.FullDataFormCell";
FullDataFormComponentView.hasTabEntry = false;
FullDataFormComponentView.hasChildEntry = true;
FullDataFormComponentView.ICON_RES_PATH = "/icons3/formCellIcon.png";






