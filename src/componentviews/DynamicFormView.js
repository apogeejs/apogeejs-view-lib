import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";

/** This component represents a member object. */
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

            getDisplayData: () => dataDisplayHelper.getWrappedMemberData(this,"member"),

            getData: () => { return {"data": null}; },
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
        getFormulaViewModeEntry("member",{name:"Input Code",label:"Layout Code",argList:""}),
        getPrivateViewModeEntry("member",{name:"Input Private",label:"Layout Private"}),
    ],
    iconResPath: "/icons3/formCellIcon.png"
}
export default DynamicFormViewConfig;
