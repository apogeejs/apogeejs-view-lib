import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";

/** This module initializes the default component view classes. */
let componentViewConfigMap = {};

export let ERROR_COMPONENT_VIEW_CONFIG;

/** This method is used to register a new component view class for the user interface. */
export function registerComponentView(viewConfig) {
    /////////////////////////////////////////
    //legacy - viewClass was passed, with some alternate field names
    if(viewConfig instanceof ComponentView) {
        let viewClass = viewConfig;
        viewConfig = {
            componentType: viewClass.componentName,
            viewClass: viewClass
        }
        
        if(viewConfig.VIEW_MODES) viewConfig.viewModes = viewClass.VIEW_MODES;
        if(viewConfig.hasTabEntry) viewConfig.hasTabEntry =  viewClass.hasTabEntry;
        if(viewConfig.hasChildEntry) viewConfig.hasChildEntry = viewClass.hasChildEntry;
        if(viewConfig.ICON_RES_PATH) viewConfig.iconResPath = viewClass.ICON_RES_PATH;
        if(viewConfig.ICON_URL) viewConfig.iconUrl = viewClass.ICON_URL;
        if(viewConfig.propertyDialogEntries) viewConfig.propertyDialogEntries = viewClass.propertyDialogEntries;
        if(viewConfig.TREE_ENTRY_SORT_ORDER) viewConfig.treeEntrySortOrder = viewClass.TREE_ENTRY_SORT_ORDER;
    }
    /////////////////////////////////////////
    componentViewConfigMap[viewConfig.componentType] = viewConfig;
}

/** This method is used to unregister a component view. Note that there is no event
 * fired here. */
export function unregisterComponentView(viewConfig) {
    let componentType;
    if(viewConfig instanceof ComponentView) {
        componentType = viewConfig.componentName; //legacy case - viewClass, not viewConfig
    }
    else {
        componentType = viewConfig.componentType;
    }

    delete componentViewConfigMap[componentType];
}

/** This method retrieves a component view class using the component unique name. */
export function getComponentViewConfig(componentType) {
    return componentViewConfigMap[componentType];
}

/** This method retrieves a component view class using the component unique name. */
export function getComponentViewInstance(appViewInterface,component) {
    let viewConfig = componentViewConfigMap[component.getComponentType()];
    if(!viewConfig) {
        viewConfig = ERROR_COMPONENT_VIEW_CONFIG;
    }

    return new viewConfig.viewClass(appViewInterface,component,viewConfig);
}

export function setErrorComponentView(errorComponentViewConfig) {
    ERROR_COMPONENT_VIEW_CONFIG = errorComponentViewConfig;
}
