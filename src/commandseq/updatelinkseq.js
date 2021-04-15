import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import {showConfigurableDialog} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

const DIALOG_LAYOUT_URL_LINE = {
    "type": "textField",
    "label": "URL: ",
    "size": 100,
    "key": "url",
    "value": "",
    "focus": true
};
const DIALOG_LAYOUT_NICKNAME_LINE = {
    "type": "textField",
    "label": "Nickname (optional): ",
    "size": 40,
    "key": "nickname",
    "value": ""
};

//=====================================
// UI Entry Point
//=====================================

/** This method adds a link to the workspace. */
export function addLink(app,displayInfo) {
        
    let initialData = {entryType: displayInfo.REFERENCE_TYPE};
    var dialogLayout = getDialogLayout(displayInfo,initialData);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        //validate url- for now just make sure it is not zero length
        if((!newValues.url)||(newValues.url.length === 0)) {
            apogeeUserAlert("The url must not be empty");
            return false;
        }

        //create command json
        var commandData = {};
        commandData.type = "addLink";
        commandData.data = newValues;

        //run command
        app.executeCommand(commandData);

        //return true to close the dialog
        return true;
    }

    //show dialog
    showConfigurableDialog(dialogLayout,onSubmitFunction);
}

/** This method updates a link in the workspace. */
export function updateLink(app,referenceEntry,displayInfo) {
        
    let initialData = referenceEntry.getData();
    var dialogLayout = getDialogLayout(displayInfo,initialData);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        //validate url- for now just make sure it is not zero length
        if((!newValues.url)||(newValues.url.length === 0)) {
            apogeeUserAlert("The url must not be empty");
            return false;
        }

        //ceck for no change
        if(apogeeutil.jsonEquals(initialData,newValues)) {
            return;
        }

        //run command
        var commandData = {};
        commandData.type = "updateLink";
        commandData.data = newValues;
        commandData.initialUrl = initialData.url;

        app.executeCommand(commandData);
            
        //return true to close the dialog
        return true;
    }

    //show dialog
    showConfigurableDialog(dialogLayout,onSubmitFunction);
}


/** This method deletes a link in the workspace. */
export function removeLink(app,referenceEntry,displayInfo) {

    var commandData = {};
        commandData.type = "deleteLink";
        commandData.entryType = displayInfo.REFERENCE_TYPE;
        commandData.url = referenceEntry.getUrl();

    //create on submit callback
    let doAction = () => app.executeCommand(commandData);
    let cancelAction = () => true;

    //verify the delete
    let deleteMsg = "Are you sure you want to delete this link?"
    apogeeUserConfirm(deleteMsg,"Delete","Cancel",doAction,cancelAction);
}

function getDialogLayout(displayInfo,initialData) { 
    var titleLine = {};
    titleLine.type = "heading";
    titleLine.text = displayInfo.DISPLAY_NAME;
    titleLine.level = 3;

    var typeLine = {};
    typeLine.type = "invisible";
    typeLine.key = "entryType";

    var dialogLayout = {};
    dialogLayout.layout = [];
    dialogLayout.layout.push(titleLine);
    dialogLayout.layout.push(typeLine);
    dialogLayout.layout.push(...displayInfo.FORM_BODY);

    //set initial values
    dialogLayout.layout.forEach(line => {
        if((line.key)&&(initialData[line.key] !== undefined)) {
            line.value = initialData[line.key];
        }
    })

    return dialogLayout;
}









