import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getMemberDataTextViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import HtmlJsDataDisplay from "/apogeejs-view-lib/src/datadisplay/HtmlJsDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {Messenger} from "/apogeejs-model-lib/src/apogeeModelLib.js";
//import {uiutil} from "/apogeejs-ui-lib/src/apogeeUiLib.js";


//========================
// CSS CODE - needs to be fixed
//========================
// constructor(appViewInterface,component,viewConfig) {
//     //extend edit component
//     super(appViewInterface,component,viewConfig);

//     //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//     //add css to page! I think this should go in a separate on create event, but until I 
//     //make this, I iwll put this here.
//     let css = component.getField("css");
//     if((css)&&(css != "")) {
//         uiutil.setObjectCssData(component.getId(),css);
//     }
//     //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// };

// /** This component overrides the componentupdated to process the css data, which is managed directly in the view. */
// componentUpdated(component) {
//     super.componentUpdated(component);

//     //if this is the css field, set it immediately
//     if(component.isFieldUpdated("css")) {
//         uiutil.setObjectCssData(component.getId(),component.getField("css"));
//     }
// }

// /** This component extends the on delete method to get rid of any css data for this component. */
// onDelete() {
//     //remove the css data for this component
//     uiutil.setObjectCssData(this.component.getId(),"");
    
//     super.onDelete();
// }

function getOutputDataDisplay(component, displayContainer) {
    displayContainer.setDestroyViewOnInactive(component.getField("destroyOnInactive"));
    var dataDisplaySource = getOutputDataDisplaySource(component);
    return new HtmlJsDataDisplay(displayContainer,dataDisplaySource);
}

function getOutputDataDisplaySource(component) {
    return {

        //This method reloads the component and checks if there is a DATA update. UI update is checked later.
        doUpdate: () => {
            //return value is whether or not the data display needs to be udpated
            let reloadData = component.isMemberDataUpdated("member.data");
            let reloadDataDisplay = component.areAnyFieldsUpdated(["html","uiCode","member.input"]);
            return {reloadData,reloadDataDisplay};
        },

        getDisplayData: () => dataDisplayHelper.getWrappedMemberData(component,"member.input"),

        getData: () => dataDisplayHelper.getWrappedMemberData(component,"member.data"),

        //edit ok - always true
        getEditOk: () => {
            return true;
        },

        saveData: (formValue) => {
            //send value to the member whose variable name is "data"
            //the scope reference is the member called "input" 
            let runContextLink = component.getApp().getWorkspaceManager().getRunContextLink();
            let inputMember = component.getField("member.input");
            let messenger = new Messenger(runContextLink,inputMember.getId());
            messenger.dataUpdate("data",formValue);
            return true;
        },

        //below - custom methods for HtmlJsDataDisplay

        //returns the HTML for the data display
        getHtml: () => {
            return component.getField("html");
        },

        //returns the resource for the data display
        getResource: () => {
            return component.getField("resource");
        },

        //gets the mebmer used as a refernce for the UI manager passed to the resource functions 
        getScopeMember: () => {
            let inputMember = component.getField("member.input");
            return inputMember;
        }
    }
}



//======================================
// This is the control config, to register the control
//======================================

const CustomDataComponentViewConfig = {
    componentType: "apogeeapp.CustomDataCell",
    viewClass: ComponentView,
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
            getDataDisplay: (component,displayContainer) => getOutputDataDisplay(component,displayContainer)
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