import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import AceTextEditor from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
import HandsonGridEditor from "/apogeejs-view-lib/src/datadisplay/HandsonGridEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";
import {uiutil} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

export default class JsonTableComponentView extends ComponentView {
    
    //==============================
    // Protected and Private Instance Methods
    //==============================

    getDataViewDisplay(displayContainer) {
        let dataDisplaySource;
        let app = this.getApp();
        let component = this.getComponent();
        let dataView = component.getField("dataView");
        //update the display container state bar
        this._setDisplayContainerStatus(displayContainer,dataView);
        switch(dataView) {
            case COLORIZED_DATA_VEW:
            default:
                dataDisplaySource = this._wrapSourceForViewChange(dataDisplayHelper.getMemberDataTextDataSource(app,this,"member"));
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/json",AceTextEditor.OPTION_SET_DISPLAY_SOME);
                
            case TEXT_DATA_VEW:
                dataDisplaySource = this._wrapSourceForViewChange(dataDisplayHelper.getMemberDataJsonDataSource(app,this,"member"));
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/text",AceTextEditor.OPTION_SET_DISPLAY_MAX);
                
            case GRID_DATA_VEW:
                dataDisplaySource = this._wrapSourceForViewChange(dataDisplayHelper.getMemberDataJsonDataSource(app,this,"member"));
                return new HandsonGridEditor(displayContainer,dataDisplaySource);
        }
    }

    /** This method updated the data display source to account for reloading the data display due to 
     * a change in the data view. */
    _wrapSourceForViewChange(dataDisplaySource) {
        let originalDoUpdate = dataDisplaySource.doUpdate;
        dataDisplaySource.doUpdate = () => {
            let returnValue = originalDoUpdate();
            returnValue.reloadDataDisplay = this.getComponent().isFieldUpdated("dataView");
            return returnValue;
        }
        return dataDisplaySource;
    }

    _setDisplayContainerStatus(displayContainer,dataView) {
        let displayBarElement = displayContainer.getDisplayBarElement();
        if(displayBarElement) {
            uiutil.removeAllChildren(displayBarElement);
            let statusElement = document.createElement("span");
            statusElement.innerHTML = "Display Format: " + VIEW_DISPLAY_NAMES[dataView];
            statusElement.style.fontSize = "smaller";
            statusElement.style.color = "gray";
            statusElement.style.marginLeft = "20px";
            statusElement.style.userSelect ; "none";
            statusElement.className = "visiui_hideSelection";
            displayBarElement.appendChild(statusElement);
        }
    }
}

//===============================
// Internal Settings
//===============================

const COLORIZED_DATA_VEW = "Colorized";
const TEXT_DATA_VEW = "Text Data";
const GRID_DATA_VEW = "Grid";

let VIEW_DISPLAY_NAMES = {};
VIEW_DISPLAY_NAMES[COLORIZED_DATA_VEW] = "JSON";
VIEW_DISPLAY_NAMES[TEXT_DATA_VEW] = "Plain Text";
VIEW_DISPLAY_NAMES[GRID_DATA_VEW] = "Grid";

//===============================
// External Settings
//===============================

JsonTableComponentView.VIEW_MODES = [
    getErrorViewModeEntry(),
    {
        name: "Data",
        label: "Data",
        sourceLayer: "model",
        sourceType: "data",
        suffix: "",
        isActive: true,
        getDataDisplay: (componentView,displayContainer) => componentView.getDataViewDisplay(displayContainer)
    },
    getFormulaViewModeEntry("member"),
    getPrivateViewModeEntry("member")  
];

/** This is the component name with which this view is associated. */
JsonTableComponentView.componentName = "apogeeapp.JsonCell";

/** If true, this indicates the component has a tab entry */
JsonTableComponentView.hasTabEntry = false;
/** If true, this indicates the component has an entry appearing on the parent tab */
JsonTableComponentView.hasChildEntry = true;
/** This is the icon url for the component. */
JsonTableComponentView.ICON_RES_PATH = "/icons3/jsonCellIcon.png";
/** This field gives the default value for the JSON taht should be deserialized to
 * create the member for this object. The field "name" can be omitted. This will 
 * be added when the member is created. */

 /** This is configuration for the properties dialog box, the results of which
 * our code will read in. */
JsonTableComponentView.propertyDialogEntries = [
    {
        propertyKey: "dataView",
        dialogElement: {
            "type":"dropdown",
            "label":"Data Display Format: ",
            "entries":[
                [ VIEW_DISPLAY_NAMES[COLORIZED_DATA_VEW] , COLORIZED_DATA_VEW ],
                [ VIEW_DISPLAY_NAMES[TEXT_DATA_VEW] , TEXT_DATA_VEW ],
                [ VIEW_DISPLAY_NAMES[GRID_DATA_VEW] , GRID_DATA_VEW ]
            ],
            "key":"dataView"
        }
    }
];


