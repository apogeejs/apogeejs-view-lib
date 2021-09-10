//These are in lieue of the import statements
import FormInputBaseComponentView from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import {getAppCodeViewModeEntry,getMemberDataTextViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {ConfigurablePanel} from "/apogeejs-ui-lib/src/apogeeUiLib.js"
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";

/** This is a graphing component using ChartJS. It consists of a single data member that is set to
 * hold the generated chart data. The input is configured with a form, which gives multiple options
 * for how to set the data. */
class DesignerDataFormComponentView extends FormInputBaseComponentView {

    //=================================
    // Implementation Methods
    //=================================

    /** This method returns the form layout.
     * @protected. */
    getFormLayout() {
        let flags = {
            "inputExpressions": this.getComponent().getField("allowInputExpressions"),
            "submit": false
        }
        return ConfigurablePanel.getFormDesignerLayout(flags);
    }

    getFormViewDataDisplay(displayContainer) {
        let dataDisplaySource = this._getOutputFormDataSource();
        return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
    }

    //==========================
    // Private Methods
    //==========================
 
    _getOutputFormDataSource() {

        return {
            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let component = this.getComponent();
                let reloadData = component.isMemberDataUpdated("member.value");
                let reloadDataDisplay = component.isMemberFieldUpdated("member.data","data");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () =>  dataDisplayHelper.getWrappedMemberData(this,"member.data"),

            getData: () => dataDisplayHelper.getWrappedMemberData(this,"member.value"),

            getEditOk: () => true,

            saveData: (formValue) => {
                let component = this.getComponent();
                //below this data is valid only for normal state input. That should be ok since this is save.
                let formLayout = component.getField("member.data").getData();

                try {
                    let isDataValidFunction = component.getField("validatorFunction");
                    if(isDataValidFunction instanceof Error) {
                        //this is clumsy - we need to show the user somewhere that there is an error
                        //maybe in the code?
                        apogeeUserAlert("Error in validator function! Input could not be processed!");
                        return false;
                    }
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
}

const DesignerDataFormComponentViewConfig = {
    componentType: "apogeeapp.DesignerDataFormCell",
    viewClass: DesignerDataFormComponentView,
    viewModes: [
        {
            name: "Form",
            label: "Form", 
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDataDisplay(displayContainer)
        },
        FormInputBaseComponentView.getConfigViewModeEntry("Form Designer"),
        getAppCodeViewModeEntry("validatorCode",null,"On Save","isValid",{argList: "formValue,formLayout"}),
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

