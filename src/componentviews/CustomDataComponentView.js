import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getMemberDataTextViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import HtmlJsDataDisplay from "/apogeejs-view-lib/src/datadisplay/HtmlJsDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import UiCommandMessenger from "/apogeejs-view-lib/src/commandseq/UiCommandMessenger.js";
import {uiutil} from "/apogeejs-ui-lib/src/apogeeUiLib.js";


/** This attempt has a single form edit page which returns an object. */
// To add - I should make it so it does not call set data until after it is initialized. I will cache it rather 
//than making the user do that.

/** This is a custom resource component. 
 * To implement it, the resource script must have the methods "run()" which will
 * be called when the component is updated. It also must have any methods that are
 * confugred with initialization data from the model. */
class CustomDataComponentView extends ComponentView {

    constructor(appViewInterface,component,viewConfig) {
        //extend edit component
        super(appViewInterface,component,viewConfig);

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //add css to page! I think this should go in a separate on create event, but until I 
        //make this, I iwll put this here.
        let css = component.getField("css");
        if((css)&&(css != "")) {
            uiutil.setObjectCssData(component.getId(),css);
        }
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    };

    /** This component overrides the componentupdated to process the css data, which is managed directly in the view. */
    componentUpdated(component) {
        super.componentUpdated(component);

        //if this is the css field, set it immediately
        if(component.isFieldUpdated("css")) {
            uiutil.setObjectCssData(component.getId(),component.getField("css"));
        }
    }

    //==============================
    // Protected and Private Instance Methods
    //==============================

    /** This component extends the on delete method to get rid of any css data for this component. */
    onDelete() {
        //remove the css data for this component
        uiutil.setObjectCssData(this.component.getId(),"");
        
        super.onDelete();
    }

    getOutputDataDisplay(displayContainer) {
        displayContainer.setDestroyViewOnInactive(this.getComponent().getField("destroyOnInactive"));
        var dataDisplaySource = this.getOutputDataDisplaySource();
        return new HtmlJsDataDisplay(displayContainer,dataDisplaySource);
    }

    getOutputDataDisplaySource() {
        return {

            //This method reloads the component and checks if there is a DATA update. UI update is checked later.
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let reloadData = this.getComponent().isMemberDataUpdated("member.data");
                let reloadDataDisplay = this.getComponent().areAnyFieldsUpdated(["html","uiCode","member.input"]);
                return {reloadData,reloadDataDisplay};
            },

            getDisplayData: () => dataDisplayHelper.getWrappedMemberData(this,"member.input"),

            getData: () => dataDisplayHelper.getWrappedMemberData(this,"member.data"),

            //edit ok - always true
            getEditOk: () => {
                return true;
            },

            saveData: (formValue) => {
                //send value to the table whose variable name is "data"
                //the context reference is the member called "input" 
                let inputMember = this.getComponent().getField("member.input");
                let commandMessenger = new UiCommandMessenger(this,inputMember.getId());
                commandMessenger.dataCommand("data",formValue);
                return true;
            },

            //below - custom methods for HtmlJsDataDisplay

            //returns the HTML for the data display
            getHtml: () => {
                return this.getComponent().getField("html");
            },

            //returns the resource for the data display
            getResource: () => {
                return this.getComponent().getField("resource");
            },

            //gets the mebmer used as a refernce for the UI manager passed to the resource functions 
            getContextMember: () => {
                let inputMember = this.getComponent().getField("member.input");
                return inputMember;
            }
        }
    }

}



//======================================
// This is the control config, to register the control
//======================================

const CustomDataComponentViewConfig = {
    componentType: "apogeeapp.CustomDataCell",
    viewClass: CustomDataComponentView,
    hasTabEntry: false,
    hasChildEntry: true,
    iconResPath: "/icons3/genericCellIcon.png",
    propertyDialogEntries: [
        {
            propertyKey: "destroyOnInactive",
            dialogElement: {
                "type":"checkbox",
                "label":"Destroy on Hide: ",
                "key":"destroyOnInactive"
            }
        }
    ],
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "Display", 
            label: "Display", 
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getOutputDataDisplay(displayContainer)
        },
        getAppCodeViewModeEntry("html",null,"HTML","HTML",{sourceType: "data", textDisplayMode: "ace/mode/html"}),
        getAppCodeViewModeEntry("css",null,"CSS", "CSS",{sourceType: "data", textDisplayMode: "ace/mode/css"}),
        getAppCodeViewModeEntry("uiCode",null,"uiGenerator()","UI Generator"),
        getFormulaViewModeEntry("member.input","Input Code","Input Code"),
        getPrivateViewModeEntry("member.input","Input Private","Input Private"),
        getMemberDataTextViewModeEntry("member.data",{name: "Data Value",label: "Data Value"})
    ]
}
export default CustomDataComponentViewConfig;