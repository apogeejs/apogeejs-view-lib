import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ConfigurableFormEditor from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

/** This component represents a table object. */
export default class DynamicFormView extends ComponentView {
        
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
                    let admin = {
                        getCommandMessenger: () => new UiCommandMessenger(this,functionMember.getId())
                    }
                    try {
                        let layout = layoutFunction(admin);
                        if(layout) return layout;
                        else return ConfigurableFormEditor.getEmptyLayout();
                    }
                    catch(error) {
                        console.error("Error reading form layout " + this.getName() + ": " + error.toString());
                        if(error.stack) console.error(error.stack);
                        return ConfigurableFormEditor.getErrorLayout("Error in layout: " + error.toString())
                    }
                }
                //if we get here there was a problem with the layout
                return apogeeutil.INVALID_VALUE;
            },

            getData: () => {              
                return null;
            }
        }

        return dataDisplaySource;
    }

}

//======================================
// This is the component generator, to register the component
//======================================

DynamicFormView.VIEW_MODES = [
    getErrorViewModeEntry(),
    {
        name: "Form",
        label: "Form",
        isActive: true,
        getDataDisplay: (componentView,displayContainer) => componentView.getFormViewDisplay(displayContainer)
    },
    getFormulaViewModeEntry("member",{name:"Input Code",label:"Layout Code",argList:"admin"}),
    getPrivateViewModeEntry("member",{name:"Input Private",label:"Layout Private"}),
];

DynamicFormView.componentName = "apogeeapp.ActionFormCell";
DynamicFormView.hasTabEntry = false;
DynamicFormView.hasChildEntry = true;
DynamicFormView.ICON_RES_PATH = "/icons3/formCellIcon.png";

