import apogeeutil from "/apogeeutil/apogeeUtilLib.js";

import {showConfigurableDialog} from "/apogeeview/dialogs/ConfigurableDialog.js";

const DIALOG_LAYOUT_URL_LINE = {
    "type": "inputElement",
    "heading": "URL: ",
    "resultKey": "url",
    "initial": "",
    "focus": true
};
const DIALOG_LAYOUT_NICKNAME_LINE = {
    "type": "inputElement",
    "heading": "Nickname (optional): ",
    "resultKey": "nickname",
    "initial": ""
};
const DIALOG_LAYOUT_SUBMIT_LINE = {
    "type": "submit",
    "submit": "Update",
    "cancel": "Cancel"
}

//=====================================
// UI Entry Point
//=====================================

/** This method adds a link to the workspace. */
export function addLink(app,entryTypeInfo) {
        
    //create the dialog layout 
    var titleLine = {};
    titleLine.type = "title";
    titleLine.title = entryTypeInfo.ADD_ENTRY_TEXT

    var dialogLayout = {};
    dialogLayout.lines = [];
    dialogLayout.lines.push(titleLine);
    dialogLayout.lines.push(DIALOG_LAYOUT_URL_LINE);
    dialogLayout.lines.push(DIALOG_LAYOUT_NICKNAME_LINE);
    dialogLayout.lines.push(DIALOG_LAYOUT_SUBMIT_LINE);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        //validate url- for now just make sure it is not zero length
        if((!newValues.url)||(newValues.url.length === 0)) {
            alert("The url must not be empty");
            return false;
        }

        //create command json
        var commandData = {};
        commandData.type = "addLink";
        commandData.entryType = entryTypeInfo.REFERENCE_TYPE;
        commandData.url = newValues.url;
        commandData.nickname = newValues.nickname;

        //run command
        app.executeCommand(commandData);

        //return true to close the dialog
        return true;
    }

    //show dialog
    showConfigurableDialog(dialogLayout,onSubmitFunction);
}

/** This method updates a link in the workspace. */
export function updateLink(app,referenceEntry) {
        
    var initialValues = {};
    initialValues.url = referenceEntry.getUrl();
    initialValues.nickname = referenceEntry.getNickname();
    if(initialValues.nickname == initialValues.url) initialValues.nickname = "";

    var entryTypeInfo = referenceEntry.getTypeInfo();//FIX THIS!! the tyep info for the UI is moved.

    //create the dialog layout
    var titleLine = {};
    titleLine.type = "title";
    titleLine.title = entryTypeInfo.UPDATE_ENTRY_TEXT;

    var urlLine = apogeeutil.jsonCopy(DIALOG_LAYOUT_URL_LINE);
    urlLine.initial = initialValues.url;
    var nicknameLine = apogeeutil.jsonCopy(DIALOG_LAYOUT_NICKNAME_LINE);
    nicknameLine.initial = initialValues.nickname;

    var dialogLayout = {};
    dialogLayout.lines = [];
    dialogLayout.lines.push(titleLine);
    dialogLayout.lines.push(urlLine);
    dialogLayout.lines.push(nicknameLine);
    dialogLayout.lines.push(DIALOG_LAYOUT_SUBMIT_LINE);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        //validate url- for now just make sure it is not zero length
        if((!newValues.url)||(newValues.url.length === 0)) {
            alert("The url must not be empty");
            return false;
        }

        //run command
        var commandData = {};
        var dataChanged = false;
        commandData.type = "updateLink";
        commandData.entryType = entryTypeInfo.REFERENCE_TYPE;
        commandData.oldUrl = initialValues.url;
        if(initialValues.url != newValues.url) {
            commandData.newUrl = newValues.url;
            dataChanged = true;
        }
        if(initialValues.url != newValues.url) {
            commandData.newNickname = newValues.nickname;
            dataChanged = true;
        }

        if(dataChanged) {
            app.executeCommand(commandData);
        }
            
        //return true to close the dialog
        return true;
    }

    //show dialog
    showConfigurableDialog(dialogLayout,onSubmitFunction);
}


/** This method deletes a link in the workspace. */
export function removeLink(app,referenceEntry) {

    var doDelete= confirm("Are you sure you want to delete this link?");

    //create on submit callback
    if(doDelete) {
        
        var commandData = {};
        commandData.type = "deleteLink";
        commandData.entryType = referenceEntry.getTypeInfo().REFERENCE_TYPE;
        commandData.url = referenceEntry.getUrl();

        //run command
        app.executeCommand(commandData);
    }
}








