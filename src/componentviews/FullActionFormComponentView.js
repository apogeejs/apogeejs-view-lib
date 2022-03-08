import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import {Messenger} from "/apogeejs-model-lib/src/apogeeModelLib.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";


//==============================
// Protected and Private Instance Methods
//==============================

function getFormViewDisplay(component, displayContainer) {
    let dataDisplaySource = getOutputDataDisplaySource(component);
    return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
}

function getOutputDataDisplaySource(component) {
    return {

        //This method reloads the component and checks if there is a DATA update. UI update is checked later.
        doUpdate: () => {
            let reloadData = false;
            let reloadDataDisplay = component.isFieldUpdated("layoutFunction") || component.isMemberDataUpdated("member");
            return {reloadData,reloadDataDisplay};
        },

        getDisplayData: () => {       
            //get the layout function
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
            let wrappedData = dataDisplayHelper.getWrappedMemberData(component,"member");

            //use the parent folder as the scope base
            if(wrappedData.data != apogeeutil.INVALID_VALUE) {
                let runContextLink = component.getApp().getWorkspaceManager().getRunContextLink();
                let inputData = wrappedData.data;
                let scopeMemberId = component.getMember().getParentId();
                let messenger = new Messenger(runContextLink,scopeMemberId);
                try {
                    let layout = layoutFunction(messenger,inputData);
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

const FullActionFormComponentViewConfig = {
    componentType: "apogeeapp.FullActionFormCell",
    viewClass: ComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "form",
            label: "Form",
            isActive: true,
            getDataDisplay: (component,displayContainer) => getFormViewDisplay(component,displayContainer)
        },
        getAppCodeViewModeEntry("layoutCode",null,"layout","Layout Code",{argList:"commandMessenger,inputData",isActive: true}),
        getFormulaViewModeEntry("member",{name: "input", label:"Input Data Code"}),
        getPrivateViewModeEntry("member",{name: "inputPrivate", label:"Input Data Private"})
    ],
    iconResPath: "/icons3/formCellIcon.png"
}
export default FullActionFormComponentViewConfig;


