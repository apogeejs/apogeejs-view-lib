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
export default class MakerActionFormComponentView extends FormInputBaseComponentView {

    constructor(appViewInterface,component) {
        super(appViewInterface,component);
    };

    //=================================
    // Implementation Methods
    //=================================

    /**  This method retrieves the table edit settings for this component instance
     * @protected */
     getTableEditSettings() {
        return MakerActionFormComponentView.TABLE_EDIT_SETTINGS;
    }

    /** This method should be implemented to retrieve a data display of the give type. 
     * @protected. */
    getDataDisplay(displayContainer,viewType) {
        let dataDisplaySource;
        switch(viewType) {

            case MakerActionFormComponentView.VIEW_FORM:
                dataDisplaySource = this._getOutputFormDataSource();
                return new ConfigurableFormEditor(displayContainer,dataDisplaySource);

            case FormInputBaseComponentView.VIEW_INPUT:
                return this.getFormDataDisplay(displayContainer);

            case FormInputBaseComponentView.VIEW_INFO: 
                dataDisplaySource = dataDisplayHelper.getStandardErrorDataSource(this.getApp(),this);
                return new StandardErrorDisplay(displayContainer,dataDisplaySource);

            case MakerActionFormComponentView.VIEW_ON_SAVE_CODE:
                dataDisplaySource = this._getOnSubmitDataDisplaySource(this.getApp());
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/javascript",AceTextEditor.OPTION_SET_DISPLAY_MAX);

            case MakerActionFormComponentView.VIEW_ON_CANCEL_CODE:
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
let flags = {"inputExpressions": true}
        return ConfigurablePanel.getFormMakerLayout(flags);
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

                //input data is the layout from the form maker
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
                command.type = "makerActionFormUpdateCommand";
                command.memberId = component.getMemberId();
                command.field = "onSubmit";
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
                command.type = "makerActionFormUpdateCommand";
                command.memberId = component.getMemberId();
                command.field = "onCancel";
                command.initialValue = component.getField("onCancelCode");
                command.targetValue = targetLayoutCode;

                app.executeCommand(command);
                return true; 
            }

        }
    }

    _getFullLayout(inputLayout) {
        let {onSubmitFunction,onCancelFunction,errorMessage} = this.component.createActionFunctions();
        let appendEntry;
        if(errorMessage) {
            appendEntry = {
                type: "htmlDisplay",
                html: "errorMessage"
            }
        }
        else {
            let contextMemberId = this.component.getMember().getParentId();
            let commandMessenger = new UiCommandMessenger(this,contextMemberId);
            appendEntry = {
                type: "submit",
                onSubmit: (formValue,formObject) => onSubmitFunction(commandMessenger,formValue,formObject),
                onCancel: (formObject) => onCancelFunction(commandMessenger,formObject)
            }
        }
        return inputLayout.concat([appendEntry]);
    }

}

//======================================
// Static properties
//======================================


//===================================
// View Definitions Constants (referenced internally)
//==================================

MakerActionFormComponentView.VIEW_FORM = "Form";
MakerActionFormComponentView.VIEW_VALUE = "Value";
MakerActionFormComponentView.VIEW_ON_SAVE_CODE = "On Save";
MakerActionFormComponentView.VIEW_ON_CANCEL_CODE = "On Cancel"

MakerActionFormComponentView.VIEW_MODES = [
    {name: MakerActionFormComponentView.VIEW_FORM, label: "Form", isActive: true},
    FormInputBaseComponentView.INPUT_VIEW_MODE_INFO,
    {name: MakerActionFormComponentView.VIEW_ON_SAVE_CODE, label: "onSubmit(cmdMsngr,formValue,formObject)", isActive: false},
    {name: MakerActionFormComponentView.VIEW_ON_CANCEL_CODE, label: "onCancel(cmdMsngr,formObject)", isActive: false}
];

MakerActionFormComponentView.TABLE_EDIT_SETTINGS = {
    "viewModes": MakerActionFormComponentView.VIEW_MODES
}


//===============================
// Required External Settings
//===============================

/** This is the component name with which this view is associated. */
MakerActionFormComponentView.componentName = "apogeeapp.MakerActionFormCell";

/** If true, this indicates the component has a tab entry */
MakerActionFormComponentView.hasTabEntry = false;
/** If true, this indicates the component has an entry appearing on the parent tab */
MakerActionFormComponentView.hasChildEntry = true;

/** This is the icon url for the component. */
MakerActionFormComponentView.ICON_RES_PATH = "/icons3/formCellIcon.png";

