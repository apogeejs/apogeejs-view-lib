import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import {validateTableName} from "/apogeejs-model-lib/src/apogeeModelLib.js"; 

import {showConfigurableDialog} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

//=====================================
// UI Entry Point
//=====================================

/** This method gets a callback to update the properties of a component. */
export function updateComponentProperties(componentView) {

    var app = componentView.getApp();
    var modelManager = app.getModelManager(); 
    var component = componentView.getComponent();
    
    var componentClass = component.constructor;
    var componentViewClass = componentView.constructor;

    var displayName = componentClass.getClassDisplayName();

    var additionalLines = [];
    var initialFormValues = __getBasePropertyValues__(component);
    if(componentViewClass.propertyDialogEntries) {
        componentViewClass.propertyDialogEntries.forEach(entry => {
            let entryCopy = apogeeutil.jsonCopy(entry.dialogElement);
            initialFormValues[entry.dialogElement.key] = __getDialogValue__(modelManager,component,entry);
            additionalLines.push(entryCopy);
        }); 
    }

    // add the folders to which we can move this (it can move to root only if it is a parent)
    let includeRootFolder = componentViewClass.hasTabEntry;
    var parentList = modelManager.getParentList(includeRootFolder);

    //create the dialog layout - do on the fly because folder list changes
    var dialogLayout = getPropertiesDialogLayout(displayName,parentList,additionalLines,false,initialFormValues);

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

        if(componentViewClass.propertyDialogEntries) {
            let {memberUpdateJson, componentUpdateJson} = __getUpdateJsons__(componentViewClass.propertyDialogEntries,newFormValues);
            if((memberUpdateJson)||(componentUpdateJson)) {
                let updateCommand = {};
                updateCommand.type = "updateComponentProperties";
                updateCommand.memberId = component.getMemberId();
                updateCommand.updatedMemberProperties = memberUpdateJson;
                updateCommand.updatedComponentProperties = componentUpdateJson;
                commands.push(updateCommand)
            }
        }
        
        //--------------
        // Move
        //--------------
        
        if((newFormValues.name)||(newFormValues.parentId)) {
            
            //validate the name
            if(newFormValues.name) {
                var nameResult = validateTableName(newFormValues.name);
                if(!nameResult.valid) {
                    apogeeUserAlert(nameResult.errorMessage);
                    return false;
                }
            }

            let oldName = component.getName();

            let renameEditorCommands;

            //do the first stage of editor commands
            if(componentViewClass.hasChildEntry) {
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
            if(componentViewClass.hasChildEntry) {

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
                        if(!componentViewClass.hasTabEntry) {
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
    let componentViewClass = componentView.constructor;
    if(componentViewClass.hasChildDisplay) {
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





//////////////////////////////////////////////
const __getBasePropertyValues__ = component => {
    let basePropertyValues = {};
    let member = component.getField("member");
    basePropertyValues.name = member.getName();
    basePropertyValues.parentId = member.getParentId();
    return basePropertyValues;
}
const __getDialogValue__ = (modelManager,parentComponent,entry) => {
    //This reads a property value from the given component/member and
    //converts it to a form value.
    let propertyComponent = __getPropertyComponent__(modelManager,parentComponent,entry.component);

    let propertyValue;
    if(entry.member !== undefined) {
        let propertyMember = __getChildMember__(propertyComponent,entry.member);
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
//for now only 1 generation of children is allowed! so "component" = componentPath = componentName!!!
const __getPropertyComponent__ = (modelManager,parentComponent,componentPath) => {
    if((!componentPath)||(componentPath == ".")) return parentComponent;
    else return __getChildComponent__(modelManager,parentComponent,componentPath);
}
const __getChildComponent__ = (modelManager,parentComponent,childName) => {
    if(!parentComponent.getParentFolderForChildren) throw new Error("Invalid parent component for child component path " + componentPath);

    let folderMember = parentComponent.getParentFolderForChildren();
    let childMemberId = folderMember.lookupChildId(childName);
    let childComponentId = modelManager.getComponentIdByMemberId(childMemberId);
    return modelManager.getComponentByComponentId(childComponentId);
}
const __getChildMember__ = (component,childPath) => {
    if(childPath == ".") {
        return component.getMember();
    }
    else {
        let childFieldName = "member." + childPath;
        return component.getField(childFieldName);
    }
}
///////////////////////////////////////////////////





////////////////////////////////////
    //procee newFormValues to give property json
    const __getUpdateJsons__ = (dialogEntries,newFormValues) => {
        let memberUpdateJson, componentUpdateJson;

        //two problems
        // 1) for the member json, it does not account for the member path to the proper component
        // 2) for the component json, it constructs the parent json internally, but sets the child json as the output json
        if(dialogEntries) {
            dialogEntries.forEach(entry => {
                let formValue = newFormValues[entry.dialogElement.key];
                if(formValue !== undefined) {
                    let propertyValue = entry.formToProperty ? entry.formToProperty(formValue) : formValue;

                    if(entry.member !== undefined) {
                        if(!memberUpdateJson) memberUpdateJson = {};
                        let memberPath = __getFullMemberPath__(entry.component,entry.member);
                        let memberJson = __lookupSinglePropertyJson__(memberUpdateJson,memberPath);
                        ///////////////////////////////////////
                        //for members (but not components) we have the "updateData" wrapper
                        if(!memberJson.updateData) memberJson.updateData = {};
                        ////////////////////////////////////////////////
                        memberJson.updateData[entry.propertyKey] = propertyValue;
                    }
                    else {
                        if(!componentUpdateJson) componentUpdateJson = {};
                        let memberJson = __lookupSinglePropertyJson__(componentUpdateJson,entry.component);
                        memberJson[entry.propertyKey] = propertyValue;
                    }
                }
            })
        }

        return {memberUpdateJson, componentUpdateJson};
    }
    const __getFullMemberPath__ = (componentPath,memberPath) => {
        ///////////////////////////////////////////////////
        //with rule that component is folder and has one child level, 
        //member path to component is the same as component path.
        let fullMemberPath
        if((componentPath)&&(componentPath != ".")) {
            fullMemberPath = componentPath;
            if(memberPath != ".") fullMemberPath += "." + memberPath;
        }
        else {
            fullMemberPath = memberPath;
        }
        return fullMemberPath;
        /////////////////////////////////////////////////////////
    }
    const __lookupSinglePropertyJson__ = (propertyJson,path) => {
        if(!propertyJson) propertyJson = {};
        if((!path)||(path == ".")) {
            return propertyJson;
        }
        else {
            let pathArray = path.split(".");
            return __getPathJson__(propertyJson,pathArray,0);
        }

    }
    const __getPathJson__ = (parentJson,pathArray,startFrom) => {
        if((startFrom >= pathArray.length)||(startFrom < 0)) {
            throw new Error("Unexpected path for property entry!");
        }
        let childJson = __getChildJson__(parentJson,pathArray[startFrom]);
        if(startFrom == pathArray.length - 1) {
            return childJson;
        }
        return __getPathJson__(childJson,pathArray,startFrom+1);
    }
    const __getChildJson__ = (json,childName) => {
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
    /////////////////////////////////////////



