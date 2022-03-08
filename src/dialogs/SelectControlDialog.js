import {uiutil,dialogMgr} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

/** This method shows a dialog to select from additional components. */
export function showSelectComponentDialog(componentConfigs,onSelectFunction) {

    var dialog = dialogMgr.createDialog({"movable":true});
    
    //add a scroll container
    var contentContainer = uiutil.createElement("div",null,
        {
			"display":"block",
            "position":"relative",
            "top":"0px",
            "height":"100%",
            "overflow": "auto"
        });
	dialog.setContent(contentContainer,uiutil.SIZE_WINDOW_TO_CONTENT);
    
    var line;
    
	var content = uiutil.createElement("div",null,
			{
				"display":"table",
				"overflow":"hidden"
			});
	contentContainer.appendChild(content);
    
    var line;
  
    //title
    line = uiutil.createElement("div",{"className":"dialogLine"});
    line.appendChild(uiutil.createElement("div",{"className":"dialogTitle","innerHTML":"Select Component Type"}));
    content.appendChild(line);
    
    //folder selection
    line = uiutil.createElement("div",{"className":"dialogLine"});
    line.appendChild(document.createTextNode("Component:"));
    var select = uiutil.createElement("select");
    line.appendChild(select);
    componentConfigs.forEach( componentConfig => {
		select.add(uiutil.createElement("option",{"text":componentConfig.displayName,"value":componentConfig.displayName}));
    });
    content.appendChild(line);
    
    //buttons
    line = uiutil.createElement("div",{"className":"dialogLine"});
    var onCancel = function() {
        dialogMgr.closeDialog(dialog);
    }
    
    var onCreate = function() {
		var displayName = select.value;
        componentConfig = componentConfigs.find(componentConfig => componentConfig.displayName == displayName)
        if(componentConfig) {
            onSelectFunction(componentConfig);
            dialogMgr.closeDialog(dialog);
        }
        else {
            // add error handling - this shouldn't happen though
            apogeeUserAlert("Unknown error selecting component type: " + displayName)
        }
    }
    line.appendChild(uiutil.createElement("button",{"className":"dialogButton","innerHTML":"Create","onclick":onCreate}));
    line.appendChild(uiutil.createElement("button",{"className":"dialogButton","innerHTML":"Cancel","onclick":onCancel}));
    content.appendChild(line);
    
    dialog.setContent(content,uiutil.SIZE_WINDOW_TO_CONTENT);  
    
    //show dialog
    dialogMgr.showDialog(dialog);
}



