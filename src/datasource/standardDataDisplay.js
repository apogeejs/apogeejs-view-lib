import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import AceTextEditor from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
import StandardErrorDisplay from "/apogeejs-view-lib/src/datadisplay/StandardErrorDisplay.js";

//============================
//Component Error View Mode
//============================
export function getErrorViewModeEntry() {
    return {
        name: "Info", //unfortunate legacy name
        label: "Error Info",
        isActive: true,
        isTransient: true,
        isInfoView: true,
        getDataDisplay: (componentView,displayContainer) => {
            let dataDisplaySource = dataDisplayHelper.getStandardErrorDataSource(componentView.getApp(),componentView);
            return new StandardErrorDisplay(displayContainer,dataDisplaySource);
        }
    }
}

//=============================
// Member Data View Modes
//=============================

export function getMemberDataTextDisplay(componentView,displayContainer,memberFieldName,options) {
    let textDisplayMode = ((options)&&(options.textDisplayMode)) ? options.textDisplayMode : "ace/mode/json";
    let editorOptions = ((options)&&(options.editorOptions)) ? options.editorOptions : AceTextEditor.OPTION_SET_DISPLAY_SOME;
    let doReadOnly = ((options)&&(options.editorOptions)) ? options.editorOptions.doReadOnly : false;
    let dataDisplaySource = dataDisplayHelper.getMemberDataTextDataSource(componentView.getApp(),componentView,memberFieldName,doReadOnly);
    return new AceTextEditor(displayContainer,dataDisplaySource,textDisplayMode,editorOptions);        
}

export function getMemberDataTextViewModeEntry(memberFieldName,options) {
    //derive default suffix from memberFieldName
    //display logic will apply the suffix if it is not falsy (at time this comment added)
    let suffix; 
    if((options)&&(options.suffix !== undefined)) {
        suffix = options.suffix
    }
    else {
        if(memberFieldName.startsWith("member.")) {
            suffix = memberFieldName.slice("member".length);
        }
        else {
            suffix = null;
        }
    }

    return {
        name: ((options)&&(options.name)) ? options.name : "Value",
        label: ((options)&&(options.label)) ? options.label : "Value",
        sourceLayer: "model",
        sourceType: "data",
        suffix: suffix, //default value comes from member field name 
        isActive: ((options)&&(options.suffix)) ? options.suffix : false,
        getDataDisplay: (componentView,displayContainer) => getMemberDataTextDisplay(componentView,displayContainer,memberFieldName,options)
    }
}

//==============================
// Member Code View Modes
//==============================
export function getFormulaDataDisplay(componentView,displayContainer,memberFieldName,options) {
    let editorOptions = ((options)&&(options.editorOptions)) ? options.editorOptions : AceTextEditor.OPTION_SET_DISPLAY_MAX;
    let dataDisplaySource = dataDisplayHelper.getMemberFunctionBodyDataSource(componentView.getApp(),componentView,memberFieldName);
    return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/javascript",editorOptions);
}

export function getFormulaViewModeEntry(memberFieldName,options) {
    return {
        name: ((options)&&(options.name)) ? options.name : "Formula",
        label: ((options)&&(options.label)) ? options.label : "Formula",
        sourceLayer: "model",
        sourceType: "function",
        argList: ((options)&&(options.argList !== undefined)) ? options.argList : "",
        isActive: ((options)&&(options.isActive)) ? options.isActive : false,
        getDataDisplay: (componentView,displayContainer) => getFormulaDataDisplay(componentView,displayContainer,memberFieldName,options)
    }
}

export function getPrivateDataDisplay(componentView,displayContainer,memberFieldName,options) {
    let editorOptions = ((options)&&(options.editorOptions)) ? options.editorOptions : AceTextEditor.OPTION_SET_DISPLAY_MAX;
    let dataDisplaySource = dataDisplayHelper.getMemberSupplementalDataSource(componentView.getApp(),componentView,memberFieldName);
    return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/javascript",editorOptions);
}

export function getPrivateViewModeEntry(memberFieldName,options) {
    return {
        name: ((options)&&(options.name)) ? options.name : "Private",
        label: ((options)&&(options.label)) ? options.label : "Private",
        sourceLayer: "model",
        sourceType: "private code",
        isActive: ((options)&&(options.isActive)) ? options.isActive : false,
        getDataDisplay: (componentView,displayContainer) => getPrivateDataDisplay(componentView,displayContainer,memberFieldName,options)
    }
} 

//============================================
// App Code/Text Field
//=============================================

export function getAppCodeDataDisplay(componentView,displayContainer,componentFieldName,options) {
    let textDisplayMode = ((options)&&(options.textDisplayMode)) ? options.textDisplayMode : "ace/mode/javascript";
    let editorOptions = ((options)&&(options.editorOptions)) ? options.editorOptions : AceTextEditor.OPTION_SET_DISPLAY_MAX;
    let dataSource = getComponentFieldDisplaySource(componentView,componentFieldName);
    return new AceTextEditor(displayContainer,dataSource,textDisplayMode,editorOptions);
}

export function getAppCodeViewModeEntry(componentFieldName,viewName,viewLabel,options) {

    return {
        name: viewName,
        label: viewLabel,
        sourceLayer: "app",
        sourceType: ((options)&&(options.sourceType)) ? options.sourceType : "function",
        argList: ((options)&&(options.argList !== undefined)) ? options.argList : "",
        isActive: ((options)&&(options.isActive)) ? options.isActive : false,
        getDataDisplay: (componentView,displayContainer) => getAppCodeDataDisplay(componentView,displayContainer,componentFieldName,options)
    }
}

/** This method returns the data dispklay data source for the code field data displays. */
function getComponentFieldDisplaySource(componentView,componentFieldName) {

    return {
        doUpdate: () => {
            //return value is whether or not the data display needs to be udpated
            let reloadData = componentView.getComponent().isFieldUpdated(componentFieldName);
            let reloadDataDisplay = false;
            return {reloadData,reloadDataDisplay};
        },

        getData: () => {
            let componentField = componentView.getComponent().getField(componentFieldName);
            if((componentField === undefined)||(componentField === null)) componentField = "";
            return componentField;
        },

        getEditOk: () => {
            return true;
        },
        
        saveData: (text) => {
            let app = componentView.getApp();

            var initialValue = componentView.getComponent().getField(componentFieldName);
            var command = {};
            command.type = "updateComponentField";
            command.memberId = componentView.getComponent().getMemberId();
            command.fieldName = componentFieldName;
            command.initialValue = initialValue;
            command.targetValue = text;

            app.executeCommand(command);
            return true; 
        }
    }
}