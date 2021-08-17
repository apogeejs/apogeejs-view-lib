import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import ErrorDisplay from "/apogeejs-view-lib/src/datadisplay/ErrorDisplay.js";

const ErrorComponentViewConfig = {
    componentType: "apogeeapp.ErrorCell",
    viewClass: ComponentView,
    viewModes: [
        {
            name: "ComponentError",
            label: "Component Error",
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => new ErrorDisplay(displayContainer,false)
        }
    ],
    hasTabEntry: false,
    hasChildEntry: true,
    iconResPath: "/icons3/errorCellIcon.png"
}
export default ErrorComponentViewConfig;

