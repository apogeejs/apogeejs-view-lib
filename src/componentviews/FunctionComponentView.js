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

FunctionComponentView.propertyDialogLines = [
    {
        "type":"textField",
        "label":"Arg List: ",
        "size": 80,
        "key":"argListString"
    }
];
/** This function takes the proeprty values from the component/members and converts it to have the format for the dialog form.
 * This function may be omitted if no transformation is needed. If it is included, the proeprty values can be
 * written into. */
FunctionComponentView.propertyToFormValues = propertyValues => {
    propertyValues.argListString = propertyValues.argList.toString();
    return propertyValues;
}
/** This function takes the result value of the form and converts it to have the format for property values.
 * This function may be omitted if no transformation is needed. If it is included, the form values can be
 * written into. */
FunctionComponentView.formToPropertyValues = formValue => {
    formValue.argList = apogeeutil.parseStringArray(formValue.argListString);
    return formValue
}
/** This function indicates any properties that are sourced by proeprty dialog lines with a different
 * key. This map can be completely omitted if all the property keys match the dialog keys. Also, and
 * proeprty key which matches a dialog key can be omitted. */
FunctionComponentView.dialogLineMap = {
    argList: "argListString"
}

