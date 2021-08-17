import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";
import {getErrorViewModeEntry,getFormulaViewModeEntry,getPrivateViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

const FunctionComponentViewConfig = {
    componentType: "apogeeapp.FunctionCell",
    viewClass: ComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        getFormulaViewModeEntry("member",{name: "Code", label: "Function Body", isActive: true}),
        getPrivateViewModeEntry("member")  
    ],
    hasTabEntry: false,
    hasChildEntry: true,
    iconResPath: "/icons3/functionCellIcon.png",
    propertyDialogEntries: [
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
    ]
}
export default FunctionComponentViewConfig;



