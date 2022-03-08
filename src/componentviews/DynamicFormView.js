import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";

function getFormViewDisplay(component, displayContainer) {
    let dataDisplaySource = getFormCallbacks(component);
    return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
}

function getFormCallbacks(component) { 
    var dataDisplaySource = {
        doUpdate: () => {
            //we have no data here, just the form layout
            let reloadData = false;
            let reloadDataDisplay = component.isMemberDataUpdated("member");
            return {reloadData,reloadDataDisplay};
        },

        getDisplayData: () => dataDisplayHelper.getWrappedMemberData(component,"member"),

        getData: () => { return {"data": null}; },
    }

    return dataDisplaySource;
}


const DynamicFormViewConfig = {
    componentType: "apogeeapp.ActionFormCell",
    viewClass: ComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "Form",
            label: "Form",
            isActive: true,
            getDataDisplay: (component,displayContainer) => getFormViewDisplay(component,displayContainer)
        },
        getFormulaViewModeEntry("member",{name:"Input Code",label:"Layout Code",argList:""}),
        getPrivateViewModeEntry("member",{name:"Input Private",label:"Layout Private"}),
    ],
    iconResPath: "/icons3/formCellIcon.png"
}
export default DynamicFormViewConfig;
