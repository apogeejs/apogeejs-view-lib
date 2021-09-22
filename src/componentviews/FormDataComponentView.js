import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import {Messenger} from "/apogeejs-model-lib/src/apogeeModelLib.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry,getMemberDataTextViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";

/** This ccomponent represents a data value, with input being from a configurable form.
 * This is an example of componound component. The data associated with the form
 * can be accessed from the variables (componentName).data. There are also subtables
 * "layout" which contains the form layout and "isInputValid" which is a function
 * to validate form input.
 * If you want a form to take an action on submit rather than create and edit a 
 * data value, you can use the dynmaic form. */
class FormDataComponentView extends ComponentView {

    //==============================
    // Protected and Private Instance Methods
    //==============================

    getFormViewDisplay(displayContainer) {
        let dataDisplaySource = this.getFormEditorCallbacks();
        return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
    }

    getFormEditorCallbacks() {

        var dataDisplaySource = {};
        dataDisplaySource.doUpdate = () => {
            //update depends on multiplefields
            let component = this.getComponent();
            let reloadData = component.isMemberDataUpdated("member.data");
            let reloadDataDisplay = ( (component.isMemberDataUpdated("member.layout")) ||
                (component.isMemberDataUpdated("member.isInputValid")) );
            return {reloadData,reloadDataDisplay};
        },

        //return form layout
        dataDisplaySource.getDisplayData = () => { 
            let layoutFunctionMember = this.getComponent().getField("member.layout");
            if(layoutFunctionMember.getState() == apogeeutil.STATE_NORMAL) {
                let layoutFunction = layoutFunctionMember.getData();   
                if(layoutFunction instanceof Function) {
                    let layout;
                    try { 
                        layout = layoutFunction();
                        if(!layout) layout = ConfigurableFormEditor.getEmptyLayout();
                    }
                    catch(error) {
                        console.error("Error reading form layout " + this.getName() + ": " + error.toString());
                        if(error.stack) console.error(error.stack);
                        layout = ConfigurableFormEditor.getErrorLayout("Error in layout: " + error.toString());
                    }
                    return {
                        data: layout
                    }
                }
            }
            else {
                return {
                    data: apogeeutil.INVALID_VALUE,
                    hideDisplay: true,
                    messageType: DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR,
                    message: "Form layout not available"
                }
            }
            
        }
        
        //return desired form value
        dataDisplaySource.getData = () => dataDisplayHelper.getWrappedMemberData(this,"member.data");
        
        //edit ok - always true
        dataDisplaySource.getEditOk = () => {
            return true;
        }
        
        //save data - just form value here
        
        dataDisplaySource.saveData = (formValue) => {
            let layoutFunctionMember = this.getComponent().getField("member.layout");
            let isInputValidFunctionMember = this.getComponent().getField("member.isInputValid");
            //validate input
            var isInputValid = isInputValidFunctionMember.getData();
            let validateResult;
            if(isInputValid instanceof Function) {
                try {
                    validateResult = isInputValid(formValue);
                }
                catch(error) {
                    validateResult = "Error running input validation function.";
                    console.error("Error reading form layout: " + this.getName());
                }
            }
            else {
                validateResult = "Input validate function not valid";
            }

            if(validateResult !== true) {
                if(typeof validateResult != 'string') {
                    validateResult = "Improper format for isInputValid function. It should return true or an error message";
                }
                apogeeUserAlert(validateResult);
                return false;
            }

            //save the data - send via messenger to the variable named "data" in code, which is the field 
            //named "member.data", NOT the field named "data"
            let commandMessenger = new Messenger(this.getApp(),layoutFunctionMember.getId());
            commandMessenger.dataCommand("data",formValue);
            return true;
        }
        
        return dataDisplaySource;
    }

}

const FormDataComponentViewConfig = {
    componentType: "apogeeapp.DataFormCell",
    viewClass: FormDataComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "Form",
            label: "Form",
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDisplay(displayContainer)
        },
        getFormulaViewModeEntry("member.layout",{name:"Layout Code",label:"Layout Code"}),
        getPrivateViewModeEntry("member.layout",{name:"Layout Private",label:"Layout Private"}),
        getFormulaViewModeEntry("member.isInputValid",{name:"isInputValid(formValue)",label:"isInputValid",argList: "formValue"}),
        getPrivateViewModeEntry("member.isInputValid",{name:"isInputValid Private",label:"isInputValid Private"}),
        getMemberDataTextViewModeEntry("member.data",{name: "Form Value",label: "Form Value"})
    ],
    iconResPath: "/icons3/formCellIcon.png"
}
export default FormDataComponentViewConfig;