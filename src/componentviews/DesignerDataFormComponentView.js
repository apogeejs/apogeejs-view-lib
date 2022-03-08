//These are in lieue of the import statements
import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import {getConfigViewModeEntry} from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import {getFormulaViewModeEntry,getPrivateViewModeEntry,getMemberDataTextViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {ConfigurablePanel} from "/apogeejs-ui-lib/src/apogeeUiLib.js"
import {Messenger} from "/apogeejs-model-lib/src/apogeeModelLib.js";


//=================================
// Implementation Methods
//=================================

/** This method returns the form layout.
 * @protected. */
function getFormLayout(component) {
    let flags = {
        "inputExpressions": component.getField("allowInputExpressions"),
        "submit": false
    }
    return ConfigurablePanel.getFormDesignerLayout(flags);
}

function getFormViewDataDisplay(component,displayContainer) {
    let dataDisplaySource = _getOutputFormDataSource(component);
    return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
}

//==========================
// Private Methods
//==========================

function _getOutputFormDataSource(component) {

    return {
        //This method reloads the component and checks if there is a DATA update. UI update is checked later.
        doUpdate: () => {
            //return value is whether or not the data display needs to be udpated
            let reloadData = component.isMemberDataUpdated("member.value");
            let reloadDataDisplay = component.isMemberFieldUpdated("member.data","data");
            return {reloadData,reloadDataDisplay};
        },

        getDisplayData: () =>  dataDisplayHelper.getWrappedMemberData(component,"member.data"),

        getData: () => dataDisplayHelper.getWrappedMemberData(component,"member.value"),

        getEditOk: () => true,

        saveData: (formValue) => {
            let isValidMember = component.getField("member.isValid");
            let isValidFunction;
            let issueMessage;
            switch(isValidMember.getState()) {
                case apogeeutil.STATE_NORMAL:
                    isValidFunction = isValidMember.getData();
                    break;

                case apogeeutil.STATE_PENDING:
                    issueMessage = "Validator function pending! Can not process submit button.";
                    break;

                case apogeeutil.STATE_INVALID:
                    issueMessage = "Validator function invalid! Can not process submit button.";
                    break;

                case apogeeutil.STATE_ERROR:
                    issueMessage = "Validator function error: " + isValidMember.getErrorMsg();
                    break;
            }

            if(isValidFunction) {
                try {
                    let isValidResult = isValidFunction(formValue);
                    if(isValidResult === true) {
                        //save data
                        let memberId = component.getMemberId();
                        let runContextLink = component.getApp().getWorkspaceManager().getRunContextLink();
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
            else {
                apogeeeUserAlert(issueMessage);
                return false;
            }
        }
    }
}


const DesignerDataFormComponentViewConfig = {
    componentType: "apogeeapp.DesignerDataFormCell",
    viewClass: ComponentView,
    viewModes: [
        {
            name: "Form",
            label: "Form", 
            isActive: true,
            getDataDisplay: (component,displayContainer) => getFormViewDataDisplay(component,displayContainer)
        },
        getConfigViewModeEntry(getFormLayout,"Form Designer"),
        getFormulaViewModeEntry("member.isValid",{name:"IsValidFunction",label:"IsValid Function",argList:"formValue"}),
        getPrivateViewModeEntry("member.isValid",{name:"IsValidPrivate",label:"IsValid Private"}),
        getMemberDataTextViewModeEntry("member.value")
    ],
    iconResPath: "/icons3/formCellIcon.png",
    propertyDialogEntries: [
        {
            propertyKey: "allowInputExpressions",
            dialogElement: {
                "type":"checkbox",
                "label":"Allow Designer Input Expressions: ",
                "value": true,
                "key":"allowInputExpressions"
            }
        }
    ]
}
export default DesignerDataFormComponentViewConfig;

