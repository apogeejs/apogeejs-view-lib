import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import HtmlJsDataDisplay from "/apogeejs-view-lib/src/datadisplay/HtmlJsDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
//import {uiutil} from "/apogeejs-ui-lib/src/apogeeUiLib.js";


//========================
// CSS CODE - needs to be fixed!
//========================
// constructor(appViewInterface,component,viewConfig) {
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
            let reloadData = component.isMemberDataUpdated("member");
            let reloadDataDisplay = component.areAnyFieldsUpdated(["html","resource"]);
            return {reloadData,reloadDataDisplay};
        },

        getData: () => dataDisplayHelper.getWrappedMemberData(component,"member"),

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
            return component.getMember();
        }
    }
}


/** This is the format string to create the code body for updateing the member
 * Input indices:
 * 0: resouce methods code
 * 1: uiPrivate
 * @private
 */
CustomComponentView.GENERATOR_FUNCTION_FORMAT_TEXT = [
    "//member functions",
    "var resourceFunction = function(component) {",
    "{0}",
    "}",
    "//end member functions",
    "return resourceFunction;",
    ""
       ].join("\n");

//======================================
// This is the control config, to register the control
//======================================

const CustomComponentViewConfig = {
    componentType: "apogeeapp.CustomCell",
    viewClass: ComponentView,
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
        getFormulaViewModeEntry("member","Input Code","Input Code"),
        getPrivateViewModeEntry("member","Input Private","Input Private")  
    ],
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
    ]
}
export default CustomComponentViewConfig;






