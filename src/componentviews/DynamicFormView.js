import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";

/** This component represents a table object. */
class DynamicFormView extends ComponentView {
        
    //==============================
    // Protected and Private Instance Methods
    //==============================

    getFormViewDisplay(displayContainer) {
        let dataDisplaySource = this.getFormCallbacks();
        return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
    }

    getFormCallbacks() { 
        var dataDisplaySource = {
            doUpdate: () => {
                //we have no data here, just the form layout
                let reloadData = false;
                let reloadDataDisplay = this.getComponent().isMemberDataUpdated("member");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => {             
                let functionMember = this.getComponent().getField("member"); 
                let layoutFunction = functionMember.getData();

                //make sure this is a function (could be invalid value, or a user code error)
                if(layoutFunction instanceof Function) {
                    let layout;
                    let admin = {
                        getCommandMessenger: () => new UiCommandMessenger(this,functionMember.getId())
                    }
                    try {
                        layout = layoutFunction(admin);
                        if(!layout) layout = ConfigurableFormEditor.getEmptyLayout();
                    }
                    catch(error) {
                        console.error("Error reading form layout " + this.getName() + ": " + error.toString());
                        if(error.stack) console.error(error.stack);
                        layout = ConfigurableFormEditor.getErrorLayout("Error in layout: " + error.toString())
                    }

                    return {
                        data: layout
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
            },

            getData: () => null,
        }

        return dataDisplaySource;
    }

}

const DynamicFormViewConfig = {
    componentType: "apogeeapp.ActionFormCell",
    viewClass: DynamicFormView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "Form",
            label: "Form",
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDisplay(displayContainer)
        },
        getFormulaViewModeEntry("member",{name:"Input Code",label:"Layout Code",argList:"admin"}),
        getPrivateViewModeEntry("member",{name:"Input Private",label:"Layout Private"}),
    ],
    hasTabEntry: false,
    hasChildEntry: true,
    iconResPath: "/icons3/formCellIcon.png"
}
export default DynamicFormViewConfig;
