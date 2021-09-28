import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import {Messenger} from "/apogeejs-model-lib/src/apogeeModelLib.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";

/** This is a custom resource component. 
 * To implement it, the resource script must have the methods "run()" which will
 * be called when the component is updated. It also must have any methods that are
 * confugred with initialization data from the model. */
class FullActionFormComponentView extends ComponentView {

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
                let reloadDataDisplay = this.getComponent().isFieldUpdated("layoutFunction") || this.getComponent().isMemberDataUpdated("member");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => {       
                //get the layout function
                let component = this.getComponent();
                let layoutFunction = component.getField("layoutFunction");
                if(layoutFunction instanceof Error) {
                    let wrappedData = {};
                    wrappedData.displayInvalid = true;
                    wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                    wrappedData.message = "Error in layout function: " + layoutFunction.toString();
                    return wrappedData;
                }

                //load the layout
                //read the input data (checking for non-normal state)
                let wrappedData = dataDisplayHelper.getWrappedMemberData(this,"member");

                //use the parent folder as the scope base
                if(wrappedData.data != apogeeutil.INVALID_VALUE) {
                    let runContextLink = this.getApp().getWorkspaceManager().getRunContextLink();
                    let inputData = wrappedData.data;
                    let scopeMemberId = component.getMember().getParentId();
                    let commandMessenger = new Messenger(runContextLink,scopeMemberId);
                    try {
                        let layout = layoutFunction(commandMessenger,inputData);
                        wrappedData.data = layout;
                    }
                    catch(error) {
                        let errorWrappedData = {};
                        errorWrappedData.hideDisplay = true;
                        errorWrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                        errorWrappedData.message = "Error executing layout function: " + error.toString();
                        return errorWrappedData;
                    }
                }

                return wrappedData;
            },

            //no data
            getData: () => { return {"data": null}; }
        }
    }
}

const FullActionFormComponentViewConfig = {
    componentType: "apogeeapp.FullActionFormCell",
    viewClass: FullActionFormComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "form",
            label: "Form",
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDisplay(displayContainer)
        },
        getAppCodeViewModeEntry("layoutCode",null,"layout","Layout Code",{argList:"commandMessenger,inputData",isActive: true}),
        getFormulaViewModeEntry("member",{name: "input", label:"Input Data Code"}),
        getPrivateViewModeEntry("member",{name: "inputPrivate", label:"Input Data Private"})
    ],
    iconResPath: "/icons3/formCellIcon.png"
}
export default FullActionFormComponentViewConfig;


