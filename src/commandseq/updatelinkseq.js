import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import {showConfigurableDialog} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

//=====================================
// UI Entry Point
//=====================================

/** This method adds a link to the workspace. */
export function addLink(app,displayInfo) {
        
    let dialogLayout = getDialogLayout(displayInfo);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        if((displayInfo.isDataValid)&&(!displayInfo.isDataValid(newValues))) return false;

        if(displayInfo.processData) {
            newValues = displayInfo.processData(newValues);
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
    let dialogLayout = getDialogLayout(displayInfo,initialData);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        if((displayInfo.isDataValid)&&(!displayInfo.isDataValid(newValues))) return false;

        if(displayInfo.processData) {
            newValues = displayInfo.processData(newValues);
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
export function removeLink(app,referenceEntry,displayInfo) {

    var commandData = {};
        commandData.type = "deleteLink";
        commandData.id = referenceEntry.getId();

    //create on submit callback
    let doAction = () => app.executeCommand(commandData);
    let cancelAction = () => true;

    //verify the delete
    let deleteMsg = "Are you sure you want to delete this link?"
    apogeeUserConfirm(deleteMsg,"Delete","Cancel",doAction,cancelAction);
}


function getDialogLayout(displayInfo,initialData) { 

    //create base dialog entries
    let headingLine = {
        type: "heading",
        text: displayInfo.DISPLAY_NAME
    }
    let typeLine = {
		"type": "invisible",
		"value": displayInfo.REFERENCE_TYPE,
		"key": "entryType"
	}
    let dialogLayout = [
        headingLine,
        typeLine
    ]
    //append a writable copy of the property layout lines
    dialogLayout.push(...apogeeutil.jsonCopy(displayInfo.PROPERTY_FORM_LAYOUT));

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









