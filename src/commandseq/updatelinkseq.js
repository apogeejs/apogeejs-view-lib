import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import {showConfigurableDialog} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

//=====================================
// UI Entry Point
//=====================================

/** This method adds a link to the workspace. */
export function addLinkSeq(app,referenceType,commandConfig) {
        
    let dialogLayout = getDialogLayout(commandConfig);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        if((commandConfig.isDataValid)&&(!commandConfig.isDataValid(newValues))) return false;

        if(commandConfig.processData) {
            newValues = commandConfig.processData(newValues);
        }

        //create command json
        var commandData = {};
        commandData.type = "addLink"
        commandData.entryType = referenceType
        commandData.data = newValues

        //run command
        app.executeCommand(commandData);

        //return true to close the dialog
        return true;
    }

    //show dialog
    showConfigurableDialog(dialogLayout,onSubmitFunction);
}

/** This method updates a link in the workspace. */
export function updateLinkSeq(app,referenceEntry,referenceType,commandConfig) {
        
    let initialData = referenceEntry.getData();
    let dialogLayout = getDialogLayout(commandConfig,initialData);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        if((commandConfig.isDataValid)&&(!commandConfig.isDataValid(newValues))) return false;

        if(commandConfig.processData) {
            newValues = commandConfig.processData(newValues);
        }

        //run command
        var commandData = {};
        commandData.type = "updateLink";
        commandData.id = referenceEntry.getId();
        commandData.data = newValues;

        app.executeCommand(commandData);
            
        //return true to close the dialog
        return true;
    }

    //show dialog
    showConfigurableDialog(dialogLayout,onSubmitFunction);
}


/** This method deletes a link in the workspace. */
export function removeLinkSeq(app,referenceEntry,deleteMsg) {

    var commandData = {};
        commandData.type = "deleteLink";
        commandData.id = referenceEntry.getId();

    //create on submit callback
    let doAction = () => app.executeCommand(commandData);
    let cancelAction = () => true;

    //verify the delete
    apogeeUserConfirm(deleteMsg,"Delete","Cancel",doAction,cancelAction);
}


function getDialogLayout(commandConfig,initialData) { 

    //create base dialog entries
    let headingLine = {
        type: "heading",
        text: commandConfig.dialogTitle
    }
    let dialogLayout = [
        headingLine
    ]
    //append a writable copy of the property layout lines inside a child panel
    dialogLayout.push(...commandConfig.dialogLayout);

    //add initial values for the properties
    if(initialData) {
        dialogLayout.forEach(line => {
            if((line.key)&&(initialData[line.key] !== undefined)) {
                line.value = initialData[line.key];
            }
        })
    }

    return dialogLayout;
}









