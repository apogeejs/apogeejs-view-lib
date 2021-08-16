import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ErrorDisplay from "/apogeejs-view-lib/src/datadisplay/ErrorDisplay.js";

/** This component represents a json table object. */
export default class ErrorComponentView extends ComponentView {}

ErrorComponentView.VIEW_MODES = [
    {
        name: "ComponentError",
        label: "Component Error",
        isActive: true,
        getDataDisplay: (componentView,displayContainer) => new ErrorDisplay(displayContainer,false)
    }
];

//======================================
// This is the component generator, to register the component
//======================================

ErrorComponentView.componentName = "apogeeapp.ErrorCell";
ErrorComponentView.hasTabEntry = false;
ErrorComponentView.hasChildEntry = true;
ErrorComponentView.ICON_RES_PATH = "/icons3/errorCellIcon.png";

