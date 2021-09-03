/** This module initializes the default component view classes. */
let componentViewConfigMap = {};

export let ERROR_COMPONENT_VIEW_CONFIG;

/** This method is used to register a new component view class for the user interface. */
export function registerComponentView(viewConfig) {
    componentViewConfigMap[viewConfig.componentType] = viewConfig;
}

/** This method is used to unregister a component view. Note that there is no event
 * fired here. */
export function unregisterComponentView(viewConfig) {
    delete componentViewConfigMap[viewConfig.componentType];
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
