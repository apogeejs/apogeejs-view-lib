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
export default class DesignerActionFormComponentView extends FormInputBaseComponentView {

    constructor(appViewInterface,component) {
        super(appViewInterface,component);
    };

    //=================================
    // Implementation Methods
    //=================================

    /**  This method retrieves the table edit settings for this component instance
     * @protected */
     getTableEditSettings() {
        return DesignerActionFormComponentView.TABLE_EDIT_SETTINGS;
    }

    /** This method should be implemented to retrieve a data display of the give type. 
     * @protected. */
    getDataDisplay(displayContainer,viewType) {
        let dataDisplaySource;
        switch(viewType) {

            case DesignerActionFormComponentView.VIEW_FORM:
                dataDisplaySource = this._getOutputFormDataSource();
                return new ConfigurableFormEditor(displayContainer,dataDisplaySource);

            case FormInputBaseComponentView.VIEW_INPUT:
                return this.getFormDataDisplay(displayContainer);

            case FormInputBaseComponentView.VIEW_ERROR: 
                dataDisplaySource = dataDisplayHelper.getStandardErrorDataSource(this.getApp(),this);
                return new StandardErrorDisplay(displayContainer,dataDisplaySource);

            case DesignerActionFormComponentView.VIEW_ON_SAVE_CODE:
                dataDisplaySource = this._getOnSubmitDataDisplaySource(this.getApp());
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/javascript",AceTextEditor.OPTION_SET_DISPLAY_MAX);

            case DesignerActionFormComponentView.VIEW_ON_CANCEL_CODE:
                dataDisplaySource = this._getOnCancelDataDisplaySource(this.getApp());
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/javascript",AceTextEditor.OPTION_SET_DISPLAY_MAX);

            default:
                console.error("unrecognized view element: " + viewType);
                return null;
        }
    }

    /** This method returns the form layout.
     * @protected. */
    getFormLayout() {
        let flags = {
            "inputExpressions": this.getComponent().getAllowInputExpressions(),
            "submit": true
        }
        return ConfigurablePanel.getFormDesignerLayout(flags);
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

    _getOnSubmitDataDisplaySource(app) {
        return {

            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let reloadData = this.getComponent().isFieldUpdated("onSubmitCode");
                let reloadDataDisplay = false;
                return {reloadData,reloadDataDisplay};
            },

            getData: () => {
                return this.getComponent().getField("onSubmitCode");
            },

            getEditOk: () => {
                return true;
            },

            saveData: (targetLayoutCode) => {
                let component = this.getComponent();

                var command = {};
                command.type = "updateComponentField";
                command.memberId = component.getMemberId();
                command.fieldName = "onSubmitCode";
                command.initialValue = component.getField("onSubmitCode");
                command.targetValue = targetLayoutCode;

                app.executeCommand(command);
                return true; 
            }

        }
    }

    _getOnCancelDataDisplaySource(app) {
        return {

            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let reloadData = this.getComponent().isFieldUpdated("onCancelCode");
                let reloadDataDisplay = false;
                return {reloadData,reloadDataDisplay};
            },

            getData: () => {
                return this.getComponent().getField("onCancelCode");
            },

            getEditOk: () => {
                return true;
            },

            saveData: (targetLayoutCode) => {
                let component = this.getComponent();

                var command = {};
                command.type = "updateComponentField";
                command.memberId = component.getMemberId();
                command.fieldName = "onCancelCode";
                command.initialValue = component.getField("onCancelCode");
                command.targetValue = targetLayoutCode;

                app.executeCommand(command);
                return true; 
            }

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

//======================================
// Static properties
//======================================


//===================================
// View Definitions Constants (referenced internally)
//==================================

DesignerActionFormComponentView.VIEW_FORM = "Form";
DesignerActionFormComponentView.VIEW_VALUE = "Value";
DesignerActionFormComponentView.VIEW_ON_SAVE_CODE = "On Save";
DesignerActionFormComponentView.VIEW_ON_CANCEL_CODE = "On Cancel"

DesignerActionFormComponentView.VIEW_MODES = [
    {
        name: DesignerActionFormComponentView.VIEW_FORM, label: "Form", 
        isActive: true
    },
    FormInputBaseComponentView.getConfigViewModeEntry("Form Designer"),
    {
        name: DesignerActionFormComponentView.VIEW_ON_SAVE_CODE,
        label: "onSubmit",
        sourceLayer: "app",
        sourceType: "function", 
        argList: "cmdMsngr,formValue,formObject",
        isActive: false
    },
    {
        name: DesignerActionFormComponentView.VIEW_ON_CANCEL_CODE,
        label: "onCancel",
        sourceLayer: "app",
        sourceType: "function", 
        argList: "cmdMsngr,formObject",
        isActive: false
    }
];

DesignerActionFormComponentView.TABLE_EDIT_SETTINGS = {
    "viewModes": DesignerActionFormComponentView.VIEW_MODES
}


//===============================
// Required External Settings
//===============================

/** This is the component name with which this view is associated. */
DesignerActionFormComponentView.componentName = "apogeeapp.DesignerActionFormCell";

/** If true, this indicates the component has a tab entry */
DesignerActionFormComponentView.hasTabEntry = false;
/** If true, this indicates the component has an entry appearing on the parent tab */
DesignerActionFormComponentView.hasChildEntry = true;

/** This is the icon url for the component. */
DesignerActionFormComponentView.ICON_RES_PATH = "/icons3/formCellIcon.png";

/** This is configuration for the properties dialog box, the results of which
 * our code will read in. */
DesignerActionFormComponentView.propertyDialogLines = [
    {
        "type":"checkbox",
        "label":"Allow Designer Input Expressions: ",
        "value": true,
        "key":"allowInputExpressions"
    }
];

