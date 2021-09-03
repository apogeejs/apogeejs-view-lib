import {TreeEntry} from "/apogeejs-ui-lib/src/apogeeUiLib.js";
import {componentInfo} from "/apogeejs-app-lib/src/apogeeAppLib.js";
import {addComponent} from "/apogeejs-view-lib/src/commandseq/addcomponentseq.js";
import {getComponentViewConfig} from "/apogeejs-view-lib/src/componentViewInfo.js";

/** This component represents a json table object. */
export default class TreeComponentDisplay {

    constructor(componentView) {
        this.componentView = componentView;
        
        this.treeEntry = this._createTreeEntry();
        this._setBannerState();

        //opnly needed for parents...
        this.treeEntry.setSortFunction(TreeComponentDisplay.treeSortFunction);
        //this should be overwritten in component
        this.treeEntry.setExtraSortParam(0);
    };

    getTreeEntry() {
        return this.treeEntry;
    }

    getState() {
        return this.treeEntry.getState();
    }

    setState(state) {
        this.treeEntry.setState(state);
    }

    setComponentTypeSortOrder(typeSortOrder) {
        this.treeEntry.setExtraSortParam(typeSortOrder);
    }

    // changeParent(newParentComponent,oldParentComponent) {
    //     var oldParentTreeEntry = oldParentComponent.getTreeEntry();
    //     oldParentTreeEntry.removeChild(this.treeEntry);
        
    //     var newParentTreeEntry = newParentComponent.getTreeEntry();
    //     newParentTreeEntry.addChild(this.treeEntry);
    // }

    deleteDisplay() {
        apogeeUserAlert("Delete tree component display not implemneted");
    }

    componentUpdated(component) {

        if(component.isMemberFieldUpdated("member","name")) {
            this._setLabel();
        }

        if(component.isStateUpdated()) {
            this._setBannerState();
        }
    }
    //===============================
    // Private Functions
    //===============================

    /** @private */
    _createTreeEntry() {
        //TREE_ENTRY
        //FIX THIS CODE!!!
        //open doesn't work and the context menu is duplicated code (that shouldn't be)
        
        //menu item callback
        var menuItemCallback = () => {
            //open menu item
            var menuItemList = [];
            var openMenuItem = this.componentView.getOpenMenuItem();
            if(openMenuItem) {
                menuItemList.push(openMenuItem);
            }

            var component = this.componentView.getComponent();

            //add child folder menu item
            if(this.componentView.getViewConfig().isParentOfChildEntries) {
                let app = this.componentView.getApp();
                var appViewInterface = this.componentView.getAppViewInterface();
                let initialValues = {parentId: component.getMemberId()};
                let pageComponents = componentInfo.getPageComponentTypes();
                pageComponents.forEach(pageComponentType => {
                    let componentViewConfig = getComponentViewConfig(pageComponentType);
                    if(componentViewConfig.isParentOfChildEntries) {
                        let childMenuItem = {};
                        let pageComponentConfig = componentInfo.getComponentConfig(pageComponentType);
                        childMenuItem.title = "Add Child " + pageComponentConfig.displayName;
                        childMenuItem.callback = () => addComponent(appViewInterface,app,pageComponentType,initialValues);
                        menuItemList.push(childMenuItem);
                    }
                })
            }

            return this.componentView.getMenuItems(menuItemList);
        }
        
        //double click callback
        var openCallback = this.componentView.createOpenCallback();
        
        var component = this.componentView.getComponent();
        var modelManager = this.componentView.getApp().getModelManager();
        var labelText = this.componentView.getName();
        var iconUrl = this.componentView.getIconUrl();
        var isRoot = component.getParentComponent(modelManager) ? true : false;
        return new TreeEntry(labelText, iconUrl, openCallback, menuItemCallback,isRoot);
    }

    _setLabel() {
        let displayName = this.componentView.getName();
        this.treeEntry.setLabel(displayName);
    }

    _setBannerState() {
        this.treeEntry.setBannerState(this.componentView.getBannerState(),this.componentView.getBannerMessage());
    }

    /** This is used to sort the child tree entries. 
     * We allow for a different ordering for different types by using the extrar sort parameter.
     * (for now, we put folers first. Other component type parameters can be set too) */
    static treeSortFunction(entry1,entry2) {
        var typeOrderDiff = (entry1.getExtraSortParam() - entry2.getExtraSortParam());
        if(typeOrderDiff) {
            return typeOrderDiff;
        }
        else {
            return entry1.getLabel().localeCompare(entry2.getLabel());
        }
    }
}
