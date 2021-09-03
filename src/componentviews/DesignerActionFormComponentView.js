//These are in lieue of the import statements
import FormInputBaseComponentView from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {ConfigurablePanel} from "/apogeejs-ui-lib/src/apogeeUiLib.js"
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";
import {getAppCodeViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";

/** This is a graphing component using ChartJS. It consists of a single data table that is set to
 * hold the generated chart data. The input is configured with a form, which gives multiple options
 * for how to set the data. */
class DesignerActionFormComponentView extends FormInputBaseComponentView {

    /** This method returns the form layout.
     * @protected. */
    getFormLayout() {
        let flags = {
            "inputExpressions": this.getComponent().getField("allowInputExpressions"),
            "submit": true
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
                let reloadData = false;
                let reloadDataDisplay = component.areAnyFieldsUpdated(["onSubmitFunction","onCancelFunction"]) || component.isMemberFieldUpdated("member.data","data");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => {  
                let wrappedData = dataDisplayHelper.getWrappedMemberData(this,"member.data");      

                //input data is the layout from the form designer
                if(wrappedData.data !== apogeeutil.INVALID_VALUE) {
                    wrappedData.data = this._getFullLayout(wrappedData.data);
                }

                return wrappedData;
            },

            getData: () => { return {"data": null}; },

            getEditOk: () => false
        }
    }

    _getFullLayout(inputLayout) {
        let component = this.getComponent();

        //remove the submit element and make a layout we can write into
        let fullLayout = [];
        let inputSubmitConfig;
        inputLayout.forEach(elementConfig => {
            if(elementConfig.type == "submit") {
                inputSubmitConfig = elementConfig;
            }
            else {
                fullLayout.push(elementConfig);
            }
        })
        //find which handlers we need
        let useSubmit = false;
        let useCancel = false;
        if(inputSubmitConfig) {
            useSubmit = inputSubmitConfig.useSubmit;
            useCancel = inputSubmitConfig.useCancel;
        }

        let onSubmitFunction;
        if(useSubmit) {
            onSubmitFunction = component.getField("onSubmitFunction");
            if(onSubmitFunction instanceof Error) {
                let wrappedData = {};
                wrappedData.displayInvalid = true;
                wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                wrappedData.message = "Error in save function: " + onSubmitFunction.toString();
                return wrappedData;
            }
        }

        let onCancelFunction;
        if(useCancel) {
            onCancelFunction = component.getField("onCancelFunction");
            if(onCancelFunction instanceof Error) {
                let wrappedData = {};
                wrappedData.displayInvalid = true;
                wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                wrappedData.message = "Error in cancel function: " + onCancelFunction.toString();
                return wrappedData;
            }
        }

        if(inputSubmitConfig) {
            //create the submit config
            let submitConfig = {};
            Object.assign(submitConfig,inputSubmitConfig)
            let contextMemberId = this.component.getMember().getParentId();
            let commandMessenger = new UiCommandMessenger(this,contextMemberId);
            if(useSubmit) submitConfig.onSubmit = (formValue,formObject) => onSubmitFunction(commandMessenger,formValue,formObject);
            if(useCancel) submitConfig.onCancel = (formObject) => onCancelFunction(commandMessenger,formObject);
            fullLayout.push(submitConfig);
        }

        return fullLayout;
    }

}


//===============================
// Required External Settings
//===============================



/** This is the component name with which this view is associated. */
const DesignerActionFormComponentViewConfig = {
    componentType: "apogeeapp.DesignerActionFormCell",
    viewClass: DesignerActionFormComponentView,
    viewModes: [
        {
            name: "Form",
            label: "Form", 
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDataDisplay(displayContainer)
        },
        FormInputBaseComponentView.getConfigViewModeEntry("Form Designer"),
        getAppCodeViewModeEntry("onSubmitCode",null,"On Save","onSubmit",{argList:"cmdMsngr,formValue,formObject"}),
        getAppCodeViewModeEntry("onCancelCode",null,"On Cancel", "onCancel",{argList: "cmdMsngr,formObject"}),
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
export default DesignerActionFormComponentViewConfig;

