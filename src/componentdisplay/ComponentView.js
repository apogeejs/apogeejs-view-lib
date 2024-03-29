import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import {uiutil,TreeEntry} from "/apogeejs-ui-lib/src/apogeeUiLib.js";
import {bannerConstants} from "/apogeejs-ui-lib/src/apogeeUiLib.js";
import {updateComponentProperties} from "/apogeejs-view-lib/src/commandseq/updatecomponentseq.js";
import {deleteComponent} from "/apogeejs-view-lib/src/commandseq/deletecomponentseq.js";
import TreeComponentDisplay from "/apogeejs-view-lib/src/componentdisplay/TreeComponentDisplay.js";

//here for legacy support
import {getErrorViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

/** This is the base functionality for a component. */
export default class ComponentView {

    /** This takes the appViewInterface and the componnet view's assoicated component.
     * In the full UI the appViewInterface is nominally the modelView. However, this 
     * abstraction was added to allow use embedded in a web page as an alternate UI. 
     */
    constructor(appViewInterface,component,viewConfig) { 
    
        this.viewConfig = viewConfig;
        
        this.app = appViewInterface.getApp();
        this.appViewInterface = appViewInterface;
        this.component = component;
        //this is to record the latest parent view to which this was added
        this.lastAssignedParentComponentView = null;
        
        //ui elements
        this.childComponentDisplay = null; //this is the main display, inside the parent tab
        this.childDisplayState = null;
        
        this.tabDisplay = null; //only valid on parents, which open into a tab
        
        this.treeDisplay = null; //this is shown in the tree view
        this.treeState = null;

        this.component.setViewStateCallback(() => this.getViewState());

        //state info
        this.stateUpdated = false;
        this.state = null;
        this.bannerMessage = null;
        this.errorInfoList = null;
    }

    //==============================
    // Public Instance Methods
    //==============================

    /** This method returns the base member for this component. */
    getComponent() {
        return this.component;
    }

    getApp() {
        return this.app;
    }

    getName() {
        return this.component.getName();
    }

    getFullName(model) {
        return this.component.getFullName(model);
    }

    /** This method returns a display name for the member object. */
    getDisplayName(useFullPath,modelForFullPathOnly) {
        return this.component.getDisplayName(useFullPath,modelForFullPathOnly);
    }

    /** This method returns true if the display name field is updated. It is only applicable if 
     * the full path is NOT used. */
    isDisplayNameUpdated() {
        return this.component.isDisplayNameUpdated();
    }

    /** This method returns true if the component state was updated in the last component update. */
    isStateUpdated() {
        return this.isStateUpdated;
    }

    /** This gets the state for the component. */
    getBannerState() {
        if(this.state == null) this._createMemberStateInfo();
        return this.state;
    }

    /** This gets the state message for the component. */
    getBannerMessage() {
        if(this.state == null) this._createMemberStateInfo();
        return this.bannerMessage;
    }

    /** This gets the error info for the component. */
    getErrorInfoList() {
        if(this.state == null) this._createMemberStateInfo();
        return this.errorInfoList;
    }

    /** This method gets the parent component view of the current component view. 
     * This method does not depends only on the relation between the components, 
     * rather than any relationship established between the component views. This should give the
     * same result getLastAssignedParentComponentView except during a delete or move operation. 
     * This may return null if there is no parent component view. */
    getParentComponentView() {
        if(this.appViewInterface.hasParentDisplays()) {
            let parentComponent = this.component.getParentComponent(this.appViewInterface.getModelManager());
            if(parentComponent) {
                return this.appViewInterface.getComponentViewByComponentId(parentComponent.getId());
            }
        }
        //if we get here, no parent component view looked up
        return null;
    }

    /** This sets the assigned parent component view. This should be done for
     * bookkeeping so it can be removed suring a move or delete operation. */
    setLastAssignedParentComponentView(parentComponentView) {
        this.lastAssignedParentComponentView = parentComponentView;

    }

    /** This method gets the assigned parent component view, which may not
     * be the view corresponding to the current parent component. This should differ 
     * only during move or delete operations. */
    getLastAssignedParentComponentView() {
        return this.lastAssignedParentComponentView;

    }

    /** This method returns the icon url for the component. */
    getIconUrl() {
        if(this.viewConfig.ICON_URL) {
            return this.viewConfig.ICON_URL;
        }
        else {
            var resPath = this.viewConfig.iconResPath;
            if(!resPath) {
                if(this.viewConfig.isParentOfChildEntries) {
                    resPath = ComponentView.DEFAULT_PAGE_ICON;
                }
                else {
                    resPath = ComponentView.DEFAULT_CELL_ICON;
                }
            }
            //cell/page icons are in the app domain/repo
            return uiutil.getResourcePath(resPath,"app");
        }
    }

    isChildEntry() {
        return (this.viewConfig.viewModes !== undefined);
    }

    /** The appViewInterface connects the component with the rest of the UI. THis is a base class
     * for ModelView and has been pulled out to allow replacement of the UI by embedding component output
     * in a web page. */
    getAppViewInterface() {
        return this.appViewInterface;
    }

    /** This returns the appViewInterface, which replaces and is a base class for the model view 
     * @deprecated */
    getModelView() {
        return this.appViewInterface;
    }

    /** This method is called when the workspace is closing */
    closeWorkspace() {
        this.onDelete();
    }

    getViewModeEntries() {
        return this.viewConfig.viewModes;

        //legacy note: There is some small chance there are legacy modules out there
        //that don't have this static field. The official API only had the "getTableEditSettings"
        //instance method. But the official API was never really documented before version 2 and was
        //only in my head. If anyone even made their cown components they hopefully followed the pattern
        //I had used. 
    }

    /**  This method retrieves the member edit settings for this component instance
     * @deprecated */
    getTableEditSettings() {
        return {
            viewModes: this.getViewModeEntries()
        };
    }

    /** This method should be implemented to retrieve a data display for the given view. 
     * @protected. */
    getDataDisplay(displayContainer,viewType) {
        if(!this.viewConfig.viewModes) {
            console.error("View Modes static field missing for class " + typeof this);
            return null;
        }

        let viewModeInfo = this.viewConfig.viewModes.find(viewModeInfo => viewModeInfo.name == viewType);
        if(!viewModeInfo) {
            console.error("unrecognized view element: " + viewType);
            return null;
        }

        return viewModeInfo.getDataDisplay(this,displayContainer);
    }

    getViewConfig() {
        return this.viewConfig;
    }

    //-----------------------------------
    // Interface for Parent Component Views
    // These methods should be populated for the views of parent components
    //-----------------------------------

    // /** This function is called when a child is added to a parent component. */
    // addChild(childComponentView);

    // /** This function is called when a child is removed to a parent component. */
    //removeChild(childComponentView);

    //-----------------------------------
    // Save methods
    //-----------------------------------

    
    /** This method reads the current UI state and saves it to the component. */
    getViewState() {
        let json = {};
        let statePresent = false;

        //get the child display state
        let activeChildDisplayState;
        if(this.childComponentDisplay) {
            activeChildDisplayState = this.childComponentDisplay.getStateJson();
        }
        else {
            activeChildDisplayState = this.childDisplayState;
        }

        if(activeChildDisplayState !== undefined) {
            json.childDisplayState = activeChildDisplayState;
            statePresent = true;
        }
    
        //get the tree display state
        let activeTreeState;
        if(this.treeDisplay) {
            activeTreeState = this.treeDisplay.getState();
        }
        else {
            activeTreeState = this.treeState; 
        }

        if((activeTreeState !== undefined)&&(activeTreeState != TreeEntry.NO_CONTROL)) {
            json.treeState = activeTreeState;
            statePresent = true;
        }

        //allow the specific component implementation to write to the json
        if(this.writeToJson) {
            statePresent = this.writeToJson(json);
        }

        if(this.tabDisplay) {
            json.tabOpened = true;
            var tab = this.tabDisplay.getTab();
            if(tab.getIsShowing()) {
                json.tabShowing = true;
            }
            statePresent = true;
        }

        //return the state
        if(statePresent) {
            return json;
        }
        else {
            return undefined;
        }
    }

    /** This method reads the UI state from the component. */
    loadViewStateFromComponent() {
        let json = this.component.getCachedViewState();
        if(!json) return;

        //set the tree state
        if((json.treeState !== undefined)&&(json.treeState !== null)) {
            if(this.treeDisplay) {
                this.treeDisplay.setState(json.treeState);
                this.treeState = null;
            }
            else {
                this.treeState = json.treeState;
            }
        }
        
        //set window options
        if((json.childDisplayState !== undefined)||(json.childDisplayState !== null)) {
            if(this.childComponentDisplay) {
                this.childComponentDisplay.setStateJson(json.childDisplayState);
                this.childDisplayState = null;
            }
            else {
                this.childDisplayState = json.childDisplayState;
            }
        }
        
        //allow the component implemnetation ro read from the json
        if(this.readFromJson) {
            this.readFromJson(json);
        }

        //check the tab display state (where tabs are used)
        if(json.tabOpened) {
            let setShowing = json.tabShowing;
            this.createTabDisplay(setShowing);
        }
    }

    /** This method can be implemented if the component view has additional state to save.
     * It should return true if state was added, and false otherwise. */
    //writeToJson(json) { return false;}

    /** This method can be implemented if the component view has additional state saved. */
    //readFromJson(json) {}

    //-------------------
    // tree entry methods - this is the element in the tree view
    //-------------------
    getTreeEntry() {
        if(!this.treeDisplay) {
            this.treeDisplay = this.createTreeDisplay();
        }
        return this.treeDisplay.getTreeEntry();
    }

    /** @protected */
    createTreeDisplay() {
        var treeDisplay = new TreeComponentDisplay(this);

        if((this.treeState !== undefined)&&(this.treeState !== null)) {
            treeDisplay.setState(this.treeState);
        }
        
        //default sort order within parent
        let treeEntrySortOrder = this.viewConfig.isParentOfChildEntries ? 
            ComponentView.FOLDER_COMPONENT_TYPE_SORT_ORDER : ComponentView.DEFAULT_COMPONENT_TYPE_SORT_ORDER;
        treeDisplay.setComponentTypeSortOrder(treeEntrySortOrder);
        
        return treeDisplay;
    }

    //-------------------
    // component display methods - this is the element in the parent tab (main display)
    //-------------------

    setComponentDisplay(childComponentDisplay) {
        this.childComponentDisplay = childComponentDisplay; 
        if(this.childDisplayState) {
            this.childComponentDisplay.setStateJson(this.childDisplayState);
            this.childDisplayState = null;
        }
    }

    getComponentDisplay() {
        return this.childComponentDisplay;
    }

    /** This gets the data display instance that is currently loaded in the display. It returns null 
     * if the data display is not loaded. */
    getCurrentDataDisplayInstance(viewType) {
        if(this.childComponentDisplay) {
            return this.childComponentDisplay.getDataDisplay(viewType);
        }
        else {
            return null;
        }
    }

    closeComponentDisplay() {
        if(this.childComponentDisplay) {
            //first store the window state
            this.childDisplayState = this.childComponentDisplay.getStateJson();
            
            //delete the display
            this.childComponentDisplay.deleteDisplay();
            this.childComponentDisplay = null;
        }
    }

    //-------------------
    // tab display methods - this is the tab element, only used for parent members
    //-------------------

    //Implement in extending class:
    ///** This creates the tab display for the component. */
    //instantiateTabDisplay();

    createTabDisplay(makeActive) {
        if((this.viewConfig.isParentOfChildEntries)&&(!this.tabDisplay)) {
            var tabFrame = this.appViewInterface.getTabFrame();
            if(tabFrame) {

                this.tabDisplay = this.instantiateTabDisplay();

                //add the tab display to the tab frame
                let tab = this.tabDisplay.getTab();
                tabFrame.addTab(tab,makeActive);
            }
        }
    }

    getTabDisplay() {
        return this.tabDisplay;
    }

    /** This closes the tab display for the component. */
    closeTabDisplay() {
        if(this.tabDisplay) {
            var tabDisplay = this.tabDisplay;
            this.tabDisplay = null;
            tabDisplay.closeTab();
            tabDisplay.destroy();    
        }
    }

    //-------------------
    // Menu methods
    //-------------------

    getMenuItems(optionalMenuItemList) {
        //menu items
        var menuItemList = optionalMenuItemList ? optionalMenuItemList : [];
            
        //add the standard entries
        var itemInfo = {};
        itemInfo.title = "Edit Properties";
        itemInfo.callback = () => updateComponentProperties(this);
        menuItemList.push(itemInfo);

        var itemInfo = {};
        itemInfo.title = "Delete";
        itemInfo.callback = () => deleteComponent(this);
        menuItemList.push(itemInfo);
        
        return menuItemList;
    }

    getOpenMenuItem () {
        var openCallback = this.createOpenCallback();
        if(openCallback) {
            var itemInfo = {};
            itemInfo.title = "Open";
            itemInfo.callback = openCallback;
            return itemInfo;
        }
        else {
            return null;
        }
    }

    //==============================
    // Protected Instance Methods
    //==============================

    /** This method cleans up after a delete. Any extending object that has delete
     * actions should pass a callback function to the method "addClenaupAction" */
    onDelete() {
        if(this.tabDisplay) {
            this.closeTabDisplay();
        }
    }

    /** This method extends the member udpated function from the base.
     * @protected */    
    componentUpdated(component) {
        //set the new component
        this.component = component;
        this.component.setViewStateCallback(() => this.getViewState());

        //clear the locally stored member state info, It will be reconstructed on demand
        this.stateUpdated = this.component.isStateUpdated();
        if(this.stateUpdated) {
            this._clearMemberStateInfo();
        }

        //check for parent change
        if(component.isFieldUpdated("member")) {
            let member = component.getMember();
            if((member.isFieldUpdated("parentId"))&&(this.appViewInterface.hasParentDisplays())) {
                var oldParentComponentView = this.getLastAssignedParentComponentView();
                var newParentComponentView = this.getParentComponentView();

                if(oldParentComponentView != newParentComponentView) {
                    //remove from old parent component
                    if(oldParentComponentView) {
                        oldParentComponentView.removeChild(this);
                        //delete all the window display
                        if(this.childComponentDisplay) {
                            this.childComponentDisplay.deleteDisplay();
                            this.childComponentDisplay = null;
                        }
                    }
                    else {
                        //this was in the root folder
                        this.appViewInterface.removeChildFromRoot(this);
                    }

                    //add to the new parent component
                    if(newParentComponentView) {
                        newParentComponentView.addChild(this);
                        this.setLastAssignedParentComponentView(newParentComponentView);
                    }
                    else {
                        //this is placed in the root folder
                        this.appViewInterface.addChildToRoot(this);
                        this.setLastAssignedParentComponentView(null);
                    }
                }
            }  
        }
        
        //update for new data
        if(this.treeDisplay) {
            this.treeDisplay.componentUpdated(component);
        }
        if(this.childComponentDisplay != null) {
            this.childComponentDisplay.componentUpdated(component);
        }
        if(this.tabDisplay != null) {
            this.tabDisplay.componentUpdated(component);
        }
    }

    //=============================
    // Action UI Entry Points
    //=============================

    /** This method creates a callback for opening the component. 
     *  @private */
    createOpenCallback() {
        var openCallback;
        
        var makeTabActive = function(tabComponent) {
            var tabDisplay = tabComponent.getTabDisplay();
            if(tabDisplay) {
                var tab = tabDisplay.getTab();
                tab.makeActive();
            }
            else {
                //create the tab display - this automaticaly puts it in the tab frame
                tabComponent.createTabDisplay(true);
            }
        }
        
        if(this.viewConfig.isParentOfChildEntries) {
            openCallback = () => {
                makeTabActive(this);

                // //allow time for UI to be created and then select start fo doc
                // //this will also give the doc focus
                // setTimeout(() => {
                //     let tabDisplay = this.getTabDisplay();
                //     if(tabDisplay.selectStartOfDocument) {
                //         tabDisplay.selectStartOfDocument();
                //     }
                // },0);
            }
        }
        else {
            //remove the tree from the parent
            openCallback = () => {
                var parentComponentView = this.getParentComponentView();
                if((parentComponentView)&&(parentComponentView.getViewConfig().isParentOfChildEntries)) {

                    //execute command to select child
                    let command = parentComponentView.getSelectApogeeNodeCommand(this.getName());
                    this.getApp().executeCommand(command);

                    //open the parent and bring this child to the front
                    makeTabActive(parentComponentView);

                }
            }
        }
        
        return openCallback;
    }

    //---------------------------
    // Member (model) state
    //---------------------------


    /** THis clears the member state info */
    _clearMemberStateInfo() {
        this.state = null;
        this.bannerMessage = null;
        this.errorInfoList = null;
    }

    _createMemberStateInfo() {
        //state matches state of main member
        let member = this.component.getMember();
        this.state = member.getState();

        switch(this.state) {
            case apogeeutil.STATE_NORMAL:
                this.bannerMessage = "";
                this.errorInfoList = null;
                break;

            case apogeeutil.STATE_PENDING:
                this.bannerMessage = bannerConstants.PENDING_MESSAGE;
                this.errorInfoList = null;
                break;

            case apogeeutil.STATE_INVALID:
                this.bannerMessage = bannerConstants.INVALID_MESSAGE;
                this.errorInfoList = null;
                break;

            case apogeeutil.STATE_ERROR:
                this._constructErrorInfo();
                break;

            default:
                this.bannerMessage = "Unknown state: " + state;
                this.errorInfoList = null;
                break; 
        }
    }

    /** This constructs the error info for the component. It should be called when 
     * the component is in the error state. */
    _constructErrorInfo() {
        let memberFieldMap = this.component.getMemberFieldMap();
        let memberDataList = [];
        let memberCount = 0;
        //get the error info for the member(s) for their component
        for(let id in memberFieldMap) {
            let lookupName = memberFieldMap[id];
            let member = this.component.getField(lookupName);
            memberCount++;
            let memberError = member.getError();
            if(memberError) {
                let memberData = {};
                let saveError;
                memberData.name = member.getName();
                if(memberError.isDependsOnError) {
                    //for a dependency error, we remove mention of depends on error that are internal
                    //to the component, keeping only depends on errors from external member
                    let {hasError, msg, errorInfoList} = this._processDependencyError(memberError, memberFieldMap);
                    saveError = hasError;
                    memberData.msg = msg;
                    if(errorInfoList) memberData.errorInfoList = errorInfoList;
                }
                else {
                    memberData.msg = memberError.message ? memberError.message : memberError.toString();
                    if(memberError.errorInfoList) memberData.errorInfoList = memberError.errorInfoList;
                    saveError = true;
                }
                
                if(saveError) memberDataList.push(memberData);
            }   
        }

        if(memberDataList.length > 0) {
            if(memberCount == 1) {
                //single member component
                let memberData = memberDataList[0];
                this.bannerMessage = memberData.msg;
                this.errorInfoList = memberData.errorInfoList ? memberData.errorInfoList : [];
            }
            else {
                //compond component (multi member)
                this.bannerMessage = memberDataList.map( memberData => memberData.name + ": " + memberData.msg).join("; ");
                let multiMemberErrorInfo = {};
                multiMemberErrorInfo.type = "multiMember";
                multiMemberErrorInfo.memberEntries = [];
                //collect existing error info lists
                memberDataList.forEach( memberData => {
                    if((memberData.errorInfoList)&&(memberData.errorInfoList.length > 0)) {
                        multiMemberErrorInfo.memberEntries.push({
                            name: memberData.name,
                            errorInfoList: memberData.errorInfoList
                        })
                    }
                })
                if(multiMemberErrorInfo.memberEntries.length > 0) this.errorInfoList = [multiMemberErrorInfo]
                else this.errorInfoList = [];
            }
        }
        else {
            this.bannerMessage = "Unknown Error";
        }

    }

    /** For dependency errors, we will get rid of an error reference where the dependency is on another
     * member that is in this same component. We want our error display to only show external errors */
    _processDependencyError(memberError, memberFieldMap) {
        let msg, errorInfoList;
        let hasError = false;
        if(memberError.errorInfoList){
            let dependencyErrorInfo = memberError.errorInfoList.find(entry => entry.type == "dependency");
            if(dependencyErrorInfo) {
                //dependency error info - keep any member reference that is not an internal member
                let newDependsOnErrorList = dependencyErrorInfo.dependsOnErrorList.filter( dependsOnEntry => (memberFieldMap[dependsOnEntry.id] === undefined) );
                let newErrorInfo = {
                    type: "dependency",
                    dependsOnErrorList: newDependsOnErrorList
                }
                if(newDependsOnErrorList.length > 0) {
                    hasError = true;
                    //update message to give depends on members in error
                    let msgPrefix = (newDependsOnErrorList.length === 1) ? "Error in dependency: " : "Error in dependencies: ";
                    msg = msgPrefix + newDependsOnErrorList.map(dependsOnEntry => dependsOnEntry.name).join(", ")
                }
            }
        }
        //we do not keep the error info list. All data is shown in the message.
        errorInfoList = [];
        return {hasError, msg, errorInfoList};
    }
}

//These parameters are used to order the components in the tree entry.
ComponentView.DEFAULT_COMPONENT_TYPE_SORT_ORDER = 5;
ComponentView.FOLDER_COMPONENT_TYPE_SORT_ORDER = 0;

ComponentView.DEFAULT_CELL_ICON = "/icons3/genericCellIcon.png";
ComponentView.DEFAULT_PAGE_ICON = "/icons3/pageIcon.png";

ComponentView.MENU_ITEM_OPEN = 0x01;

////////////////////////////////////////////////////
//legacy variable name - kept for back compatibility
ComponentView.VIEW_ERROR = "Info";
ComponentView.VIEW_INFO = "Info";
ComponentView.VIEW_ERROR_MODE_ENTRY = getErrorViewModeEntry();
ComponentView.VIEW_INFO_MODE_ENTRY = ComponentView.VIEW_ERROR_MODE_ENTRY;
/////////////////////////////////////////////////////

                
