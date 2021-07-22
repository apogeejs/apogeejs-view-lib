import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

/** This is a custom resource component. 
 * To implement it, the resource script must have the methods "run()" which will
 * be called when the component is updated. It also must have any methods that are
 * confugred with initialization data from the model. */
export default class FullActionFormComponentView extends ComponentView {

    //==============================
    // Protected and Private Instance Methods
    //==============================

    getFormViewDisplay(displayContainer) {
        let dataDisplaySource = this.getOutputDataDisplaySource();
        return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
    }

    getOutputDataDisplaySource() {
        return {

            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                let reloadData = false;
                let reloadDataDisplay = this.getComponent().isFieldUpdated("layoutCode") || this.getComponent().isMemberDataUpdated("member");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => {       
                let wrappedData = dataDisplayHelper.getEmptyWrappedData();

                //get the layout function
                let component = this.getComponent();
                let {formLayoutFunction,errorMessage} = component.createFormLayoutFunction();
                if(errorMessage) {
                    wrappedData.displayInvalid = true;
                    wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                    wrappedData.message = errorMessage;
                    return wrappedData;
                }

                //load the layout
                //read the input data (checking for non-normal state)
                let member = this.getComponent().getMember();
                let {abnormalWrappedData,inputData} = dataDisplayHelper.getProcessedMemberDisplayData(member);
                if(abnormalWrappedData) {
                    return abnormalWrappedData;
                }

                //use the parent folder as the context base
                let contextMemberId = component.getMember().getParentId();
                let commandMessenger = new UiCommandMessenger(this,contextMemberId);
                try {
                    let layout = formLayoutFunction(commandMessenger,inputData);
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

            //no data
            getData: () => null
        }
    }
}

//======================================
// This is the control generator, to register the control
//======================================

FullActionFormComponentView.VIEW_MODES = [
    getErrorViewModeEntry(),
    {
        name: "form",
        label: "Form",
        isActive: true,
        getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDisplay(displayContainer)
    },
    getAppCodeViewModeEntry("layoutCode","layout","Layout Code",{argList:"commandMessenger,inputData",isActive: true}),
    getFormulaViewModeEntry("member",{name: "input", label:"Input Data Code"}),
    getPrivateViewModeEntry("member",{name: "inputPrivate", label:"Input Data Private"})
];


FullActionFormComponentView.componentName = "apogeeapp.FullActionFormCell";
FullActionFormComponentView.hasTabEntry = false;
FullActionFormComponentView.hasChildEntry = true;
FullActionFormComponentView.ICON_RES_PATH = "/icons3/formCellIcon.png";


