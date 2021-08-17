//These are in lieue of the import statements
import FormInputBaseComponentView from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {ConfigurablePanel} from "/apogeejs-ui-lib/src/apogeeUiLib.js"
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";
import {getAppCodeViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

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
                let reloadDataDisplay = component.areAnyFieldsUpdated(["onSubmitCode","onCancelCode"]) || component.isMemberFieldUpdated("member.data","data");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => {        
                //load the layout
                let formMember = this.getComponent().getField("member.data");
                let {abnormalWrappedData,inputData} = dataDisplayHelper.getProcessedMemberDisplayData(formMember);
                if(abnormalWrappedData) {
                    return abnormalWrappedData;
                }

                //input data is the layout from the form designer
                let fullLayout = this._getFullLayout(inputData);
                return fullLayout;
            },

            getData: () => null,

            getEditOk: () => false
        }
    }

    _getFullLayout(inputLayout) {
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

        let {onSubmitFunction,onCancelFunction,errorMessage} = this.component.createActionFunctions(useSubmit,useCancel);
        if(errorMessage) {
            //add the error message onto the layout
            fullLayout.push = [{
                type: "htmlDisplay",
                html: "errorMessage"
            }]
        }
        else if(inputSubmitConfig) {
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
        getAppCodeViewModeEntry("onSubmitCode","On Save","onSubmit",{argList:"cmdMsngr,formValue,formObject"}),
        getAppCodeViewModeEntry("onCancelCode","On Cancel", "onCancel",{argList: "cmdMsngr,formObject"}),
    ],
    hasTabEntry: false,
    hasChildEntry: true,
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

