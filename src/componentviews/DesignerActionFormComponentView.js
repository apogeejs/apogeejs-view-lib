//These are in lieue of the import statements
import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import {getConfigViewModeEntry} from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {ConfigurablePanel} from "/apogeejs-ui-lib/src/apogeeUiLib.js"

/** This method returns the form layout.
 * @protected. */
function getFormLayout(component) {
    let flags = {
        "inputExpressions": component.getField("allowInputExpressions")
    }
    return ConfigurablePanel.getFormDesignerLayout(flags);
}

function getFormViewDataDisplay(displayContainer) {
    let dataDisplaySource = _getOutputFormDataSource(component);
    return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
}

//==========================
// Private Methods
//==========================

function _getOutputFormDataSource(component) {

    return {
        //This method reloads the component and checks if there is a DATA update. UI update is checked later.
        doUpdate: () => {
            //return value is whether or not the data display needs to be udpated
            let reloadData = false;
            let reloadDataDisplay = component.isMemberFieldUpdated("member.data","data");
            return {reloadData,reloadDataDisplay};
        },

        getDisplayData: () => dataDisplayHelper.getWrappedMemberData(component,"member.data"),

        getData: () => { return {"data": null}; },

        getEditOk: () => false
    }
}


//===============================
// Required External Settings
//===============================



/** This is the component name with which this view is associated. */
const DesignerActionFormComponentViewConfig = {
    componentType: "apogeeapp.DesignerActionFormCell",
    viewClass: ComponentView,
    viewModes: [
        {
            name: "Form",
            label: "Form", 
            isActive: true,
            getDataDisplay: (component,displayContainer) => getFormViewDataDisplay(component,displayContainer)
        },
        getConfigViewModeEntry(getFormLayout,"Form Designer")
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

