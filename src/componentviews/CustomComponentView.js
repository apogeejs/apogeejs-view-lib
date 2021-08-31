import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import HtmlJsDataDisplay from "/apogeejs-view-lib/src/datadisplay/HtmlJsDataDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {getErrorViewModeEntry,getAppCodeViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import {uiutil} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

/** This is a custom resource component. 
 * To implement it, the resource script must have the methods "run()" which will
 * be called when the component is updated. It also must have any methods that are
 * confugred with initialization data from the model. */
class CustomComponentView extends ComponentView {

    constructor(appViewInterface,component,viewConfig) {
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
                let reloadData = this.getComponent().isMemberDataUpdated("member");
                let reloadDataDisplay = this.getComponent().areAnyFieldsUpdated(["html","uiCode"]);
                return {reloadData,reloadDataDisplay};
            },

            getData: () => dataDisplayHelper.getWrappedMemberData(this,"member"),

            //below - custom methods for HtmlJsDataDisplay

            //returns the HTML for the data display
            getHtml: () => {
                return this.getComponent().getField("html");
            },

            //returns the resource for the data display
            getResource: () => {
                return this.getComponent().createResource();
            },

            //gets the mebmer used as a refernce for the UI manager passed to the resource functions 
            getContextMember: () => {
                return this.getComponent().getMember();
            }
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
    viewClass: CustomComponentView,
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
        getFormulaViewModeEntry("member","Input Code","Input Code"),
        getPrivateViewModeEntry("member","Input Private","Input Private")  
    ],
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
    ]
}
export default CustomComponentViewConfig;






