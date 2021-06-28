//These are in lieue of the import statements
import FormInputBaseComponentView from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import AceTextEditor from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
import StandardErrorDisplay from "/apogeejs-view-lib/src/datadisplay/StandardErrorDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {ConfigurablePanel} from "/apogeejs-ui-lib/src/apogeeUiLib.js"
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";

/** This is a graphing component using ChartJS. It consists of a single data table that is set to
 * hold the generated chart data. The input is configured with a form, which gives multiple options
 * for how to set the data. */
export default class DesignerDataFormComponentView extends FormInputBaseComponentView {

    constructor(appViewInterface,component) {
        super(appViewInterface,component);
    };

    //=================================
    // Implementation Methods
    //=================================

    /**  This method retrieves the table edit settings for this component instance
     * @protected */
     getTableEditSettings() {
        return DesignerDataFormComponentView.TABLE_EDIT_SETTINGS;
    }

    /** This method should be implemented to retrieve a data display of the give type. 
     * @protected. */
    getDataDisplay(displayContainer,viewType) {
        let dataDisplaySource;
        switch(viewType) {

            case DesignerDataFormComponentView.VIEW_FORM:
                dataDisplaySource = this._getOutputFormDataSource();
                return new ConfigurableFormEditor(displayContainer,dataDisplaySource);

            case FormInputBaseComponentView.VIEW_INPUT:
                return this.getFormDataDisplay(displayContainer);

            case FormInputBaseComponentView.VIEW_ERROR: 
                dataDisplaySource = dataDisplayHelper.getStandardErrorDataSource(this.getApp(),this);
                return new StandardErrorDisplay(displayContainer,dataDisplaySource);

            case DesignerDataFormComponentView.VIEW_ON_SAVE_CODE:
                dataDisplaySource = this.getValidatorDataDisplaySource(this.getApp());
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/javascript",AceTextEditor.OPTION_SET_DISPLAY_MAX);

            case DesignerDataFormComponentView.VIEW_VALUE:
                dataDisplaySource = dataDisplayHelper.getMemberDataTextDataSource(this.getApp(),this,"member.value");
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/json",AceTextEditor.OPTION_SET_DISPLAY_SOME);

            default:
                console.error("unrecognized view element: " + viewType);
                return null;
        }
    }

    /** This method returns the form layout.
     * @protected. */
    getFormLayout() {
        let flags = {
            "inputExpressions": true,
            "submit": false
        }
        return ConfigurablePanel.getFormDesignerLayout(flags);
    }

    //==========================
    // Private Methods
    //==========================

    /** This is the data source for the input form data display */
    // _getOutputFormDataSource() {
    //     return {
    //         doUpdate: () => {
    //             //the form data is stored in the "value" member
    //             let reloadData = this.getComponent().isMemberDataUpdated("member.value");
    //             //form layout depends on data field
    //             let reloadDataDisplay = this.getComponent().isMemberDataUpdated("member.data");
    //             return {reloadData,reloadDataDisplay};
    //         }, 
    //         getDisplayData: () => {
    //             let formMember = this.getComponent().getField("member.data");
    //             return dataDisplayHelper.getStandardWrappedMemberData(formMember);
    //         },
    //         getData: () => {
    //             let valueMember = this.getComponent().getField("member.value");
    //             return dataDisplayHelper.getStandardWrappedMemberData(valueMember,true);
    //         },
    //         getEditOk: () => true,
    //         saveData: (formValue) => {
    //             let component = this.getComponent();
    //             let memberId = component.getMemberId();
    //             let commandMessenger = new UiCommandMessenger(this,memberId);
    //             commandMessenger.dataCommand("value",formValue);
    //             return true;
    //         }
    //     }
    // }

    
    _getOutputFormDataSource() {
        //load this when the form is updated, to be used when form submitted
        //we will update the form if this value changes
        let isDataValidFunction;

        return {
            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let component = this.getComponent();
                let reloadData = component.isMemberDataUpdated("member.value");
                let reloadDataDisplay = component.isFieldUpdated("validatorCode") || component.isMemberFieldUpdated("member.data","data");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => {       
                let wrappedData = dataDisplayHelper.getEmptyWrappedData();

                //get the layout function
                let component = this.getComponent();
                let {validatorFunction,errorMessage} = component.createValidatorFunction();
                if(errorMessage) {
                    wrappedData.displayInvalid = true;
                    wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                    wrappedData.message = errorMessage;
                    return wrappedData;
                }

                //load the layout
                let formMember = this.getComponent().getField("member.data");
                let {abnormalWrappedData,inputData} = dataDisplayHelper.getProcessedMemberDisplayData(formMember);
                if(abnormalWrappedData) {
                    return abnormalWrappedData;
                }

                //save this for use on submit
                isDataValidFunction = validatorFunction;

                return inputData;
            },

            getData: () => {
                let valueMember = this.getComponent().getField("member.value");
                return dataDisplayHelper.getStandardWrappedMemberData(valueMember,true);
            },

            getEditOk: () => true,

            saveData: (formValue) => {
                let component = this.getComponent();
                //below this data is valid only for normal state input. That should be ok since this is save.
                let formLayout = component.getField("member.data").getData();

                try {
                    let isValidResult = isDataValidFunction(formValue,formLayout);
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

    getValidatorDataDisplaySource(app) {
        return {

            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let reloadData = this.getComponent().isFieldUpdated("validatorCode");
                let reloadDataDisplay = false;
                return {reloadData,reloadDataDisplay};
            },

            getData: () => {
                return this.getComponent().getField("validatorCode");
            },

            getEditOk: () => {
                return true;
            },

            saveData: (targetLayoutCode) => {
                let component = this.getComponent();

                var command = {};
                command.type = "designerDataFormUpdateCommand";
                command.memberId = component.getMemberId();
                command.field = "validator";
                command.initialValue = component.getField("validatorCode");
                command.targetValue = targetLayoutCode;

                app.executeCommand(command);
                return true; 
            }

        }
    }

}

//======================================
// Static properties
//======================================


//===================================
// View Definitions Constants (referenced internally)
//==================================

DesignerDataFormComponentView.VIEW_FORM = "Form";
DesignerDataFormComponentView.VIEW_VALUE = "Value";
DesignerDataFormComponentView.VIEW_ON_SAVE_CODE = "On Save"

DesignerDataFormComponentView.VIEW_MODES = [
    {name: DesignerDataFormComponentView.VIEW_FORM, label: "Form", isActive: true},
    FormInputBaseComponentView.getConfigViewModeEntry("Form Designer"),
    {name: DesignerDataFormComponentView.VIEW_ON_SAVE_CODE, label: "isValid(formValue,formLayout)", isActive: false},
    {name: DesignerDataFormComponentView.VIEW_VALUE, label: "Value", isActive: false}
];

DesignerDataFormComponentView.TABLE_EDIT_SETTINGS = {
    "viewModes": DesignerDataFormComponentView.VIEW_MODES
}


//===============================
// Required External Settings
//===============================

/** This is the component name with which this view is associated. */
DesignerDataFormComponentView.componentName = "apogeeapp.DesignerDataFormCell";

/** If true, this indicates the component has a tab entry */
DesignerDataFormComponentView.hasTabEntry = false;
/** If true, this indicates the component has an entry appearing on the parent tab */
DesignerDataFormComponentView.hasChildEntry = true;

/** This is the icon url for the component. */
DesignerDataFormComponentView.ICON_RES_PATH = "/icons3/formCellIcon.png";

