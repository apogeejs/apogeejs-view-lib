//These are in lieue of the import statements
import FormInputBaseComponentView from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {ConfigurablePanel} from "/apogeejs-ui-lib/src/apogeeUiLib.js"
import {getAppCodeViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

/** This is a graphing component using ChartJS. It consists of a single data member that is set to
 * hold the generated chart data. The input is configured with a form, which gives multiple options
 * for how to set the data. */
class DesignerActionFormComponentView extends FormInputBaseComponentView {

    /** This method returns the form layout.
     * @protected. */
    getFormLayout() {
        let flags = {
            "inputExpressions": this.getComponent().getField("allowInputExpressions")
        }
        return ConfigurablePanel.getFormDesignerLayout(flags);
    }

    getFormViewDataDisplay(displayContainer) {
        let dataDisplaySource = this._getOutputFormDataSource();
        return new ConfigurableFormEditor(displayContainer,dataDisplaySource);
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
                let reloadDataDisplay = component.isMemberFieldUpdated("member.data","data");
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => dataDisplayHelper.getWrappedMemberData(this,"member.data"),

            getData: () => { return {"data": null}; },

            getEditOk: () => false
        }
    }
}


//===============================
// Required External Settings
//===============================



/** This is the component name with which this view is associated. */
const DesignerActionFormComponentViewConfig = {
    componentType: "apogeeapp.DesignerActionFormCell",
    viewClass: DesignerActionFormComponentView,
    viewModes: [
        {
            name: "Form",
            label: "Form", 
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDataDisplay(displayContainer)
        },
        FormInputBaseComponentView.getConfigViewModeEntry("Form Designer")
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

