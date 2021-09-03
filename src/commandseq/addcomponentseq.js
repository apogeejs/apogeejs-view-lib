import apogeeutil from "/apogeejs-util-lib/src/apogeeUtilLib.js";
import {validateTableName} from "/apogeejs-model-lib/src/apogeeModelLib.js"; 

import {getPropertiesDialogLayout,getPropertyJsons} from "/apogeejs-view-lib/src/commandseq/updatecomponentseq.js";
import {componentInfo} from "/apogeejs-app-lib/src/apogeeAppLib.js";
import {showConfigurableDialog} from "/apogeejs-ui-lib/src/apogeeUiLib.js";
import {showSelectComponentDialog} from "/apogeejs-view-lib/src/dialogs/SelectControlDialog.js";
import {getComponentViewConfig} from "/apogeejs-view-lib/src/componentViewInfo.js";

//=====================================
// UI Entry Point
//=====================================

/** This functions initiates the add component action. It will create a dialog for the user to enter the relevent 
 * properties, with the values optionalInitialProperties preset.  */   
export function addComponent(appViewInterface,app,componentType,optionalInitialProperties) {

        let componentConfig = componentInfo.getComponentConfig(componentType);
        let componentViewConfig = getComponentViewConfig(componentType);

        //get the active workspace
        var workspaceManager = app.getWorkspaceManager();
        if(!workspaceManager) {
            apogeeUserAlert("There is no open workspace.");
            return;
        }     

        var modelManager = workspaceManager.getModelManager();
        if(!modelManager) {
            apogeeUserAlert("The workspace has not been loaded yet.");
            return;
        }    

        //this is not a true test - the workspace and model can be presenet ith out the model loaded.

        
        //get the tyep display name
        var displayName = componentConfig.displayName;
        
        //get the folder list
        let includeRootFolder = ((componentViewConfig.isParentOfChildEntries)&&(componentViewConfig.viewModes === undefined));
        var parentList = modelManager.getParentList(includeRootFolder);
        
        //create the dialog layout - do on the fly because folder list changes
        var additionalLines = [];
        //var initialFormValues = _getBasePropertyValues(component);
        if(componentViewConfig.propertyDialogEntries) {
            componentViewConfig.propertyDialogEntries.forEach(entry => {
                let entryCopy = apogeeutil.jsonCopy(entry.dialogElement);
                additionalLines.push(entryCopy);
            }); 
        }
        var dialogLayout = getPropertiesDialogLayout(displayName,parentList,additionalLines,true,optionalInitialProperties);

        //we will populate the parent if we need to insert thenew component as a child in the parent document. 
        
        
        //create on submit callback
        var onSubmitFunction = function(userInputFormValues) {
            
            //validate the name
            var nameResult = validateTableName(userInputFormValues.name);
            if(!nameResult.valid) {
                apogeeUserAlert(nameResult.errorMessage);
                return false;
            }

            //other validation of inputs?

//we should do this cleaner - by storing parent id in the submit input
            let parentMemberId = userInputFormValues.parentId;

            let commandsDeleteComponent = false;
            let deleteMsg;
            let commands = [];
            
            //create the command
            let {memberJson, componentJson} = getPropertyJsons(componentConfig,null,componentViewConfig.propertyDialogEntries,userInputFormValues);

            let createCommandData = {};
            createCommandData.type = "addComponent";
            createCommandData.parentId = parentMemberId;
            createCommandData.memberJson = memberJson
            createCommandData.componentJson = componentJson;

            //editor related commands
            let additionalCommandInfo;
            let parentComponentView;
            if(componentViewConfig.viewModes !== undefined) {
                let parentComponentId = modelManager.getComponentIdByMemberId(parentMemberId);
                if((parentComponentId)&&(appViewInterface.hasParentDisplays())) {
                    parentComponentView = appViewInterface.getComponentViewByComponentId(parentComponentId);
                    if(!parentComponentView) throw new Error("Parent component not found!");

                    additionalCommandInfo = getAdditionalCommands(parentComponentView,userInputFormValues.name);

                    //added the editor setup command
                    if(additionalCommandInfo.editorSetupCommand) commands.push(additionalCommandInfo.editorSetupCommand);

                    //add any delete commands
                    //NOTE - currently we do not overwiret, so this will not be triggered
                    if(additionalCommandInfo.deletedComponentCommands){
                        //flag a delete will be done
                        commandsDeleteComponent = true
                        deleteMsg = "This action will delete the selected cells. Are you sure you want to do that? Cells to delete: " + additionalCommandInfo.deletedComponentShortNames;

                        commands.push(...additionalCommandInfo.deletedComponentCommands);
                    } 
                }
            }

            //store create command
            commands.push(createCommandData);

            //add the editor insert command
            if((additionalCommandInfo)&&(additionalCommandInfo.editorAddCommand)) {
                commands.push(additionalCommandInfo.editorAddCommand);
            }
            
            let commandData;
            if(commands.length > 1) {
                commandData = {};
                commandData.type = "compoundCommand";
                commandData.childCommands = commands;
            }
            else if(commands.length === 1) {
                commandData = commands[0];
            }
            else {
                //this shouldn't happen
                return;
            }
            
            //execute command
            let doAction = () => {
                app.executeCommand(commandData);

                //give focus back to editor
                if(parentComponentView) {
                    parentComponentView.giveEditorFocusIfShowing();
                }
            }

            if(commandsDeleteComponent) {
                //if there is a delete, verify the user wants to do this
                let cancelAction = () => {
                    //give focus back to editor
                    if(parentComponentView) {
                        parentComponentView.giveEditorFocusIfShowing();
                    }
                };
                apogeeUserConfirm(deleteMsg,"OK","Cancel",doAction,cancelAction);
            }
            else {
                //otherwise just take the action
                doAction();
            }

            //return true to close the dialog
            return true;

        }

        //give foxus back to editor
        let onCancelFunction = () => null; /*parentComponentView.giveEditorFocusIfShowing() - oops no parent component*/;
        
        //show dialog
        showConfigurableDialog(dialogLayout,onSubmitFunction,onCancelFunction);
}


/** This gets a callback to add an "additional" component, menaing one that is not
 * in the main component menu. */
export function addAdditionalComponent(appViewInterface,app,optionalInitialProperties) {
        
    var onSelect = function(componentType) {
        addComponent(appViewInterface,app,componentType,optionalInitialProperties);
    }
    //get the display names
    let additionalComponents = componentInfo.getAdditionalComponentTypes();
    let componentInfoList = additionalComponents.map( componentType => {
        let displayName = componentInfo.getComponentDisplayName(componentType); 
        return {displayName, componentType};
    });
    //open select component dialog
    showSelectComponentDialog(componentInfoList,onSelect);
}

/** This is to get an commands needed to add the a child node onto a parent page. */
function getAdditionalCommands(parentComponentView,childName) {
    //check selection
    let useParentSelection = getUseParentSelection(parentComponentView);
    
    let insertAtEnd = !useParentSelection;

    return parentComponentView.getInsertApogeeNodeOnPageCommands(childName,insertAtEnd);
}

function getUseParentSelection(parentComponentView) {
    //use the parent selection only if the tab is the active tab
    //otherwise the component should be placed at the end

    let tabDisplay = parentComponentView.getTabDisplay();
    if(!tabDisplay) return false;

    let tab = tabDisplay.getTab();
    if(!tab) return false;
    
    return tabDisplay.getIsShowing();
}

