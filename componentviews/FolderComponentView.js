import ComponentView from "/apogeeview/componentdisplay/ComponentView.js";
import ParentComponentView from "/apogeeview/componentdisplay/ParentComponentView.js";
import LiteratePageComponentDisplay from "/apogeeview/componentdisplay/literatepage/LiteratePageComponentDisplay.js";


/** This component represents a table object. */
export default class FolderComponentView extends ParentComponentView {

    constructor(modelView,folderComponent) {
        super(modelView,folderComponent);
    }

    instantiateTabDisplay() {
        return new LiteratePageComponentDisplay(this); 
    }

}

//======================================
// This is the component generator, to register the component
//======================================

FolderComponentView.componentName = "apogeeapp.app.FolderComponent";
FolderComponentView.hasTabEntry = true;
FolderComponentView.hasChildEntry = false;
FolderComponentView.ICON_RES_PATH = "/componentIcons/folder.png";
FolderComponentView.TREE_ENTRY_SORT_ORDER = ComponentView.FOLDER_COMPONENT_TYPE_SORT_ORDER;