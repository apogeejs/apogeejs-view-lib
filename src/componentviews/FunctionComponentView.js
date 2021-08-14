import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

/** This component represents a table object. */
export default class FunctionComponentView extends ComponentView {}

//======================================
// This is the component generator, to register the component
//======================================

FunctionComponentView.VIEW_MODES = [
    getErrorViewModeEntry(),
    getFormulaViewModeEntry("member",{name: "Code", label: "Function Body", isActive: true}),
    getPrivateViewModeEntry("member")  
];

FunctionComponentView.componentName = "apogeeapp.FunctionCell";
FunctionComponentView.hasTabEntry = false;
FunctionComponentView.hasChildEntry = true;
FunctionComponentView.ICON_RES_PATH = "/icons3/functionCellIcon.png";

FunctionComponentView.propertyDialogEntries = [
    {
        member: ".",
        propertyKey: "argList",
        dialogElement: {
            "type":"textField",
            "label":"Arg List: ",
            "size": 80,
            "key":"argListString"
        },
        propertyToForm: argListValue => argListValue.toString(),
        formToProperty: argListString => apogeeutil.parseStringArray(argListString)
    },
];

