import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import {validateMemberName} from "/apogeejs-model-lib/src/apogeeModelLib.js"; 
import {Component} from "/apogeejs-app-lib/src/apogeeAppLib.js"; 

import {showConfigurableDialog} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

//=====================================
// UI Entry Point
//=====================================

/** This method gets a callback to update the properties of a component. */
export function updateComponentProperties(componentView) {

    var app = componentView.getApp();
    var modelManager = app.getModelManager(); 
    var component = componentView.getComponent();
    
    var componentConfig = component.getComponentConfig();
    var componentViewConfig = componentView.getViewConfig();

    var additionalLines = [];
    var initialFormValues = _getBasePropertyValues(component);
    if(componentViewConfig.propertyDialogEntries) {
        componentViewConfig.propertyDialogEntries.forEach(entry => {
            let entryCopy = apogeeutil.jsonCopy(entry.dialogElement);
            initialFormValues[entry.dialogElement.key] = _getDialogValue(modelManager,component,entry);
            additionalLines.push(entryCopy);
        }); 
    }

    // add the folders to which we can move this (only allow parents without being a child entry in the root))
    let includeRootFolder = ((componentViewConfig.isParentOfChildEntries)&&(componentViewConfig.viewModes === undefined));
    var parentList = modelManager.getParentList(includeRootFolder);

    //create the dialog layout - do on the fly because folder list changes
    var dialogLayout = getPropertiesDialogLayout(componentConfig.displayName,parentList,additionalLines,false,initialFormValues);

    //create on submit callback
    var onSubmitFunction = function(submittedFormValues) {
        
        //get the changed values
        var newFormValues = {};
        for(var key in initialFormValues) {
            if(!_.isEqual(initialFormValues[key],submittedFormValues[key])) {
                newFormValues[key] = submittedFormValues[key];
            }
        }
        
        let commandsDeleteComponent = false;
        let deleteMsg;
        var commands = [];
        
        //--------------
        // Update Properties
        //--------------

        if(componentViewConfig.propertyDialogEntries) {
            let {memberJson, componentJson} = getPropertyJsons(componentConfig,component,componentViewConfig.propertyDialogEntries,newFormValues);
            if((memberJson)||(componentJson)) {
                let updateCommand = {};
                updateCommand.type = "updateComponentProperties";
                updateCommand.memberId = component.getMemberId();
                updateCommand.updatedMemberProperties = memberJson;
                updateCommand.updatedComponentProperties = componentJson;
                commands.push(updateCommand)
            }
        }
        
        //--------------
        // Move
        //--------------
        
        if((newFormValues.name)||(newFormValues.parentId)) {
            
            //validate the name
            if(newFormValues.name) {
                var nameResult = validateMemberName(newFormValues.name);
                if(!nameResult.valid) {
                    apogeeUserAlert(nameResult.errorMessage);
                    return false;
                }
            }

            let oldName = component.getName();

            let renameEditorCommands;

            //do the first stage of editor commands
            if(componentView.isChildEntry()) {
                //load model view, will be used for old parent and new parent
                let appViewInterface = componentView.getAppViewInterface();

                if(appViewInterface.hasParentDisplays()) {
                    //look up the old parent component
                    let oldParentComponent = component.getParentComponent(modelManager);
                    //remove the component from the parent component document.
                    //if there is no parent component, we wil assume this was in the root folder
                    if(oldParentComponent) {
                        let oldParentComponentView = appViewInterface.getComponentViewByComponentId(oldParentComponent.getId());

                        if(newFormValues.parentId) {
                            //----------------------------
                            //move case
                            //delete old node
                            //----------------------------
                            let oldParentEditorCommand = oldParentComponentView.getRemoveApogeeNodeFromPageCommand(oldName);
                            commands.push(oldParentEditorCommand);
                        }
                        else if(newFormValues.name) {
                            //---------------------------
                            //rename case
                            //get the rename editr comamnds, then apply the one to clear the component node name
                            //----------------------------
                            renameEditorCommands = oldParentComponentView.getRenameApogeeNodeCommands(component.getMemberId(),oldName,newFormValues.name);
                            commands.push(renameEditorCommands.setupCommand);
                        }
                    }
                }
            }
            
            //update the component name
            let moveCommand = {};
            moveCommand.type = "moveComponent";
            moveCommand.memberId = component.getMemberId();
            moveCommand.newMemberName = submittedFormValues.name;
            moveCommand.newParentId = newFormValues.parentId;
            commands.push(moveCommand);

            //do the second stage of editor commands
            if(componentView.isChildEntry()) {

                //-----------------------------------
                // move case
                // add the compone nodes to the new page after the component has been moved there
                //----------------------------------------------
                if(newFormValues.parentId) {
                    let newParentComponentId = modelManager.getComponentIdByMemberId(newFormValues.parentId);
                    //there will be no component id if we are putting this in the root folder
                    if(newParentComponentId) {
                        let appViewInterface = componentView.getAppViewInterface();
                        if(appViewInterface.hasParentDisplays()) {
                            let newParentComponentView = appViewInterface.getComponentViewByComponentId(newParentComponentId);

                            if(newParentComponentView) {
                                let newName = newFormValues.name ? newFormValues.name : oldName;

                                //insert node add at end of new page
                                let newParentCommands = newParentComponentView.getInsertApogeeNodeOnPageCommands(newName,true);
                                //added the editor setup command
                                if(newParentCommands.editorSetupCommand) commands.push(newParentCommands.editorSetupCommand);
                                //check if we need to add any delete component commands  - we shouldn't have any since we are not overwriting data here
                                if(newParentCommands.deletedComponentCommands) {
                                    //flag a delete will be done
                                    commandsDeleteComponent = true
                                    deleteMsg = "This action deletes cells on the new page. Are you sure you want to do that? Deleted cells: " + deletedComponentNames;
                                    
                                    //return if user rejects
                                    if(!doDelete) return;
                                    
                                    commands.push(...newParentCommands.deletedComponentCommands);
                                }

                                //add the editor insert command
                                if(newParentCommands.editorAddCommand) commands.push(newParentCommands.editorAddCommand);
                            }
                        }
                    }
                    else {
                        if(!componentViewConfig.isParentOfChildEntries) {
                            //TBR if we want to enforce this condition...
                            throw new Error("This component can not be placed in the root folder.");
                        }
                    }

                }

                //----------------------------
                //rename case
                //set the new node name, after the compnoent rename is done
                //-------------------------------------------
                if(renameEditorCommands) {
                    //update apogee node name
                    commands.push(renameEditorCommands.setNameCommand);
                }
            }

        }
        
        //---------------
        // combine commands (as needed)
        //---------------

        var command;
        
        if(commands.length > 1) {
            //make a compound command
            command = {};
            command.type = "compoundCommand";
            command.childCommands = commands;
        }
        else if(commands.length === 1) {
            command = commands[0];
        }
        
        //command action
        let doAction = () => {
            if(command) {   
                app.executeCommand(command);
            }

            returnToEditor(componentView,submittedFormValues.name);
        }

        if(commandsDeleteComponent) {
            //if there is a delete, verify the user wants to do this
            let cancelAction = () => {
                returnToEditor(componentView,submittedFormValues.name);
            };
            apogeeUserConfirm(deleteMsg,"Delete","Cancel",doAction,cancelAction);
        }
        else {
            //otherwise just take the action
            doAction();
        }

        //return true to close the dialog
        return true;
    }

    //return focus to editor on cancel
    let onCancelFunction = () => returnToEditor(componentView);

    //show dialog
    showConfigurableDialog(dialogLayout,onSubmitFunction,onCancelFunction);
}

function returnToEditor(componentView) {
    let componentViewConfig = componentView.getViewConfig();
    if(componentViewConfig.hasChildDisplay) {
        let parentComponentView = componentView.getParentComponentView();
        if(parentComponentView) {
            parentComponentView.giveEditorFocusIfShowing();
        }
    }
}

//========================
// dialog setup - this is shared with add component since it is the same basic action
//========================

//this is for a create or update dialog
//omit folder names (null) and folder initial value to omit the parent selection
export function getPropertiesDialogLayout(displayName,folderNames,additionalLines,doCreate,initialFormValues) { 
    
    //create the dialog layout - do on the fly because folder list changes
    var dialogLayout = {};
    var lines = [];
    dialogLayout.layout = lines;

    var titleLine = {};
    titleLine.type = "heading";
    if(doCreate) {
        titleLine.text = "New " + displayName;
    }
    else {
        titleLine.text = "Update " + displayName; 
    }
    titleLine.level = 3;
    lines.push(titleLine);

    if(folderNames) {
        var parentLine = {};
        parentLine.type = "dropdown";
        parentLine.label = "Parent Page: ";
        parentLine.entries = folderNames;
        parentLine.key = "parentId"; 
        if(doCreate) {
            parentLine.state = "disabled";
        }
        lines.push(parentLine);
    }

    var nameLine = {};
    nameLine.type = "textField";
    nameLine.label = "Name: ";
    nameLine.size = 40,
    nameLine.key = "name";
    nameLine.focus = true;
    lines.push(nameLine);
    
    //add additioanl lines, if applicable
    if(additionalLines) {
        for(var i = 0; i < additionalLines.length; i++) {
            lines.push(additionalLines[i]);
        }
    }

    //submit
    // var submitLine = {};
    // submitLine.type = "submit";
    // if(doCreate) {
    //     submitLine.submit = "Create";
    // }
    // else {
    //     submitLine.submit = "Update";
    // }
    // submitLine.cancel = "Cancel";
    // lines.push(submitLine);
    
    //set the initial values
    if(initialFormValues) {
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if((line.key)&&(initialFormValues[line.key] !== undefined)) {
                line.value = initialFormValues[line.key];
            }
        }
    }
    
    return dialogLayout;
}


//===========================
// Property Value Lookup
//===========================
function _getBasePropertyValues(component) {
    let basePropertyValues = {};
    let member = component.getField("member");
    basePropertyValues.name = member.getName();
    basePropertyValues.parentId = member.getParentId();
    return basePropertyValues;
}
/** This reads a property value from the given component/member and
 * converts it to a form value. */
function _getDialogValue(modelManager,mainComponent,entry) {
    
    let propertyComponent;
    if((entry.component)&&(entry.component != ".")) {
        propertyComponent = mainComponent.getChildComponent(modelManager,entry.component);
    }
    else {
        propertyComponent = mainComponent;
    }

    let propertyValue;
    if(entry.member !== undefined) {
        let propertyMember = propertyComponent.getChildMemberFromPath(entry.member);
        if(propertyMember) {
            propertyValue = propertyMember.getField(entry.propertyKey);
        }
        else {
            throw new Error("Property Member " + entry.member + " not found in component " + entry.component);
        }
    }
    else {
        propertyValue = propertyComponent.getField(entry.propertyKey);
    }

    if(entry.propertyToForm) {
        return entry.propertyToForm(propertyValue);
    }
    else {
        return propertyValue;
    }
}

//=================================
// Dialog Value processing
//=================================


/** This function creates the property jsons for a component and member, for both create and update,
 * feeding in the property dialog values.
 * Pass mainComponent for update component, set to null create component. */
export function getPropertyJsons(mainComponentConfig,mainComponent,dialogEntries,newFormValues) {
    let memberJson;
    let componentJson;
    //for a "create", get the default jsons
    if(!mainComponent) {
        memberJson = apogeeutil.jsonCopy(mainComponentConfig.defaultMemberJson);
        memberJson.name = newFormValues.name;
        componentJson = apogeeutil.jsonCopy(mainComponentConfig.defaultComponentJson);
    }

    //add in the property dialog results
    if(dialogEntries) {
        dialogEntries.forEach(entry => {
            let formValue = newFormValues[entry.dialogElement.key];
            if(formValue !== undefined) {
                let propertyValue = entry.formToProperty ? entry.formToProperty(formValue) : formValue;

                if(entry.member !== undefined) {
                    if(!memberJson) memberJson = {}; //used in update only

                    let memberPath = Component.getFullMemberPath(entry.component,entry.member);
                    let singleMemberJson = _lookupSinglePropertyJson(memberJson,memberPath);
                    if(!singleMemberJson.fields) singleMemberJson.fields = {};
                    singleMemberJson.fields[entry.propertyKey] = propertyValue;
                }
                else {
                    if(!componentJson) componentJson = {}; //used in update only

                    let singleComponentJson = _lookupSinglePropertyJson(componentJson,entry.component);
                    if(!singleComponentJson.fields) singleComponentJson.fields = {};
                    singleComponentJson.fields[entry.propertyKey] = propertyValue;
                }
            }
        })
    }

    return {memberJson, componentJson};
}



function _lookupSinglePropertyJson(propertyJson,path) {
    if(!propertyJson) propertyJson = {};
    if((!path)||(path == ".")) {
        return propertyJson;
    }
    else {
        let pathArray = path.split(".");
        return _getPathJson(propertyJson,pathArray,0);
    }

}

function _getPathJson(parentJson,pathArray,startFrom) {
    if((startFrom >= pathArray.length)||(startFrom < 0)) {
        throw new Error("Unexpected path for property entry!");
    }
    let childJson = _getChildJson(parentJson,pathArray[startFrom]);
    if(startFrom == pathArray.length - 1) {
        return childJson;
    }
    return _getPathJson(childJson,pathArray,startFrom+1);
}

function _getChildJson(json,childName) {
    let childJson;
    if(!json.children) {
        json.children = {};
    }
    else {
        childJson = json.children[childName];
    }
    if(!childJson) {
        childJson = {};
        json.children[childName] = childJson;
    }
    return childJson;
}
    