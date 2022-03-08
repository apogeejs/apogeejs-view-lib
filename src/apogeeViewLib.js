
import {uiutil} from "/apogeejs-ui-lib/src/apogeeUiLib.js";

import ace from "/apogeejs-releases/releases/ext/ace/v1.4.12/ace.es.js";

export {default as ComponentView} from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";

export {default as AceTextEditor} from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
export {default as ConfigurableFormEditor} from "/apogeejs-view-lib/src/datadisplay/ConfigurableFormEditor.js";
export {default as DataDisplay} from "/apogeejs-view-lib/src/datadisplay/DataDisplay.js";
export {default as dataDisplayHelper} from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
export * from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

export {default as DATA_DISPLAY_CONSTANTS} from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
export {default as ErrorDisplay} from "/apogeejs-view-lib/src/datadisplay/ErrorDisplay.js";
export {default as HandsonGridEditor} from "/apogeejs-view-lib/src/datadisplay/HandsonGridEditor.js";
export {default as HtmlJsDataDisplay} from "/apogeejs-view-lib/src/datadisplay/HtmlJsDataDisplay.js";
export {default as StandardErrorDisplay} from "/apogeejs-view-lib/src/datadisplay/StandardErrorDisplay.js";
export {getSaveBar} from "/apogeejs-view-lib/src/componentdisplay/toolbar.js";

export {closeWorkspace} from "/apogeejs-view-lib/src/commandseq/closeworkspaceseq.js";
export {createWorkspace} from "/apogeejs-view-lib/src/commandseq/createworkspaceseq.js";
export {openWorkspace} from "/apogeejs-view-lib/src/commandseq/openworkspaceseq.js";
export {saveWorkspace} from "/apogeejs-view-lib/src/commandseq/saveworkspaceseq.js";
export {updateWorkspaceProperties} from "/apogeejs-view-lib/src/commandseq/updateworkspaceseq.js";
export {addComponent, addAdditionalComponent} from "/apogeejs-view-lib/src/commandseq/addcomponentseq.js";
export {addLinkSeq, updateLinkSeq, removeLinkSeq} from "/apogeejs-view-lib/src/commandseq/updatelinkseq.js";

export {default as ace} from "/apogeejs-releases/releases/ext/ace/v1.4.12/ace.es.js";

/** This function initializes the resources paths. Thuis covers the following paths
 * - "resources" folder - where the resource images are held
 * - "ace_includes" folder - where ace include files like themes are held
 * The argument includeBasePath can be either a string which is the common base path for the two above fodlers
 * or a object (map) including the folder name as the key and the assoicated base path as the value.
 */
export function initIncludePath(includePathInfo) {

    if(!includePathInfo.resources) throw new Error("Resources path must be specified");
    if(!includePathInfo.aceIncludes) throw new Error("Ace includes path must be specified");

    //initialize resource path (relative to base path in web page)
    uiutil.initResourcePath(includePathInfo.resources);

    //any needs mode or theme files for the ace editor should go in the folder set below (relative to base path in web page)
    ace.config.set('basePath',includePathInfo.aceIncludes);
}


