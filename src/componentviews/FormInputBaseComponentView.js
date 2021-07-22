import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import { FormResultFunctionGenerator } from "/apogeejs-ui-lib/src/apogeeUiLib.js";

/** This is a graphing component using ChartJS. It consists of a single data table that is set to
 * hold the generated chart data. The input is configured with a form, which gives multiple options
 * for how to set the data. */
export default class FormInputBaseComponentView extends ComponentView {

    constructor(appViewInterface,component) {
        super(appViewInterface,component);
    }

    getFormDataDisplay(displayContainer) {
        let dataDisplaySource = this._getInputFormDataSource();
        return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
    }

    //=====================================
    // Private Methods
    //=====================================

    /** This is the data source for the input form data display */
    _getInputFormDataSource() {
        return {
            doUpdate: () => {
                //data updates should only be triggered by the form itself
                let reloadData = this.getComponent().isMemberDataUpdated("member.formData");
                //form layout constant
                let reloadDataDisplay = false;
                return {reloadData,reloadDataDisplay};
            }, 
            getDisplayData: () => this.getFormLayout(),
            getData: () => {
                let formMember = this.getComponent().getField("member.formData");
                return dataDisplayHelper.getStandardWrappedMemberData(formMember);
            },
            getEditOk: () => true,
            saveData: (formData) => this._onSubmit(formData)
        }
    }

    /** This method saves the form result converted to a function body that handles expression inputs.
     * This is saved to the formula for the member object. */
    _onSubmit(formData) {
        //load the form meta - we have to look it up from the data display (this is a little clumsy)
        let formMeta;
        let formEditor = this.getCurrentDataDisplayInstance(FormInputBaseComponentView.VIEW_INPUT);
        if(formEditor) {
            formMeta = formEditor.getFormMeta();
        }

        if(!formMeta) {
            //data display should be present if the person submitted the form
            console.error("Unknown error loading the form meta value.");
            //return true indicates the submit is completed
            return true;
        }

        //set the form data value
        var dataMember = this.getComponent().getField("member.formData");

        var dataCommand = {};
        dataCommand.type = "saveMemberData";
        dataCommand.memberId = dataMember.getId();
        dataCommand.data = formData;

        //set the form result value, either using the compiled function or the plain form value as is appropriate
        let functionGenerator = new FormResultFunctionGenerator();
        functionGenerator.setInput(formData,formMeta);
        
        var resultMember = this.getComponent().getField("member.formResult");
        var resultCommand = {};

        if(functionGenerator.getHasExpressions()) {
            //save compiled form code
            let functionBody = functionGenerator.getFunctionBody(formData,formMeta);
            resultCommand.type = "saveMemberCode";
            resultCommand.memberId = resultMember.getId();
            resultCommand.argList = [];
            resultCommand.functionBody = functionBody;
            resultCommand.supplementalCode = "";
        }
        else {
            //save plain form value
            resultCommand.type = "saveMemberData";
            resultCommand.memberId = resultMember.getId();
            resultCommand.data = formData;
        }

        let command = {
            type: "compoundCommand",
            childCommands: [dataCommand,resultCommand]
        }
        
        let app = this.getApp();
        app.executeCommand(command);

        //if we got this far the form save should be accepted
        return true;
    }       

}


FormInputBaseComponentView.VIEW_INPUT = "Input";

//This is the standard formview mode info
FormInputBaseComponentView.INPUT_VIEW_MODE_CONFIG = {
    name: FormInputBaseComponentView.VIEW_INPUT,
    label: "Configuration",
    isActive: true,
    getDataDisplay: (componentView,displayContainer) => componentView.getFormDataDisplay(displayContainer)
}

//legacy name update - old name
FormInputBaseComponentView.INPUT_VIEW_MODE_INFO = FormInputBaseComponentView.INPUT_VIEW_MODE_CONFIG;

/** This function returns the view mode entry for the Config entry. This includes an option to change the name of the view. */
FormInputBaseComponentView.getConfigViewModeEntry = function(optionalAlternateLabel) {
    if(optionalAlternateLabel) {
        let viewModeInfo = {};
        Object.assign(viewModeInfo,FormInputBaseComponentView.INPUT_VIEW_MODE_CONFIG);
        viewModeInfo.label = optionalAlternateLabel;
        return viewModeInfo;
    }
    else {
        return FormInputBaseComponentView.INPUT_VIEW_MODE_CONFIG;
    }
}