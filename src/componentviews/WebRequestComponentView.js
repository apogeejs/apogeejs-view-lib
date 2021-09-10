//These are in lieue of the import statements
import FormInputBaseComponentView from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import AceTextEditor from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";
import {getErrorViewModeEntry} from "/apogeejs-view-lib/src/datasource/standardDataDisplay.js";

/** This is a graphing component using ChartJS. It consists of a single data member that is set to
 * hold the generated chart data. The input is configured with a form, which gives multiple options
 * for how to set the data. */
class WebRequestComponentView extends FormInputBaseComponentView {

    //=================================
    // Implementation Methods
    //=================================

    getMetaViewDisplay(displayContainer) {
        let dataDisplaySource = this._getMetaDataSource();
        return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/json",AceTextEditor.OPTION_SET_DISPLAY_SOME);
    }

    getBodyViewDisplay(displayContainer) {
        let dataDisplaySource = this._getBodyDataSource();
        return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/text",AceTextEditor.OPTION_SET_DISPLAY_SOME);
    }

    /** This method returns the form layout.
     * @protected. */
    getFormLayout() {
        return [
            {
                type: "horizontalLayout",
                formData: [
                    {
                        type: "textField",
                        label: "URL: ",
                        size: 75,
                        key: "url",
                        meta: {
                            expression: "choice",
                            expressionChoiceKey: "urlType"
                        }
                    },
                    {
                        type: "radioButtonGroup",
                        entries: [["Value","value"],["Reference","simple"]],
                        value: "value",
                        key: "urlType"
                    }
                ]
            },
            {
                type: "showHideLayout",
                heading: "Options",
                closed: true,
                formData: [
                    {
                        type: "dropdown",
                        label: "Method: ",
                        entries: ["GET","POST","PUT","DELETE"],
                        key: "method"
                    },
                    {
                        type: "horizontalLayout",
                        formData: [
                            {
                                type: "textarea",
                                label: "Body: ",
                                rows: 4,
                                cols: 75,
                                key: "body",
                                meta: {
                                    expression: "choice",
                                    expressionChoiceKey: "bodyType",
                                }
                            },
                            {
                                type: "radioButtonGroup",
                                entries: [["Value","value"],["Reference","simple"]],
                                value: "value",
                                key: "bodyType"
                            }
                        ]
                    },
                    {
                        type: "horizontalLayout",
                        formData: [
                            {
                                type: "dropdown",
                                label: "Content Type: ",
                                entries: [
                                    ["<none>","none"],
                                    ["JSON (application/json)","application/json"],
                                    ["Plain Text (text/plain)","text/plain"],
                                    ["CSV (text/csv)","text/csv"],
                                    ["XML (application/xml)","application/xml"],
                                    ["Form Encoded (multipart/form-data)", "multipart/form-data"],
                                    ["Form Encoded (application/x-www-form-urlencoded)","application/x-www-form-urlencoded"],
                                    ["<other>","other"]
                                ],
                                value: "none",
                                key: "contentType",
                                hint: "For a content type not listed here, choose 'other' and enter the content type manually under headers"
                            }
                        ]
                    },
                    {
                        type: "list",
                        label: "Headers: ",
                        entryType: {
                            layout: {
                                type: "panel",
                                formData: [
                                    {
                                        "type": "horizontalLayout",
                                        "formData": [
                                            {
                                                type: "textField",
                                                size: 30,
                                                key: "headerKey"
                                            },
                                            {
                                                type: "textField",
                                                size: 30,
                                                key: "headerValue",
                                                meta: {
                                                    expression: "choice",
                                                    expressionChoiceKey: "headerValueType",
                                                }
                                            },
                                            {
                                                type: "radioButtonGroup",
                                                entries: [["Value","value"],["Reference","simple"]],
                                                value: "value",
                                                key: "headerValueType"
                                            }
                                        ]
                                    }
                                ],
                                key: "key",
                                meta: {
                                    expression: "object"
                                }
                            }
                        },
                        key: "headers",
                        meta: {
                            expression: "array"
                        }
                    },
                    {
                        type: "radioButtonGroup",
                        label: "Output Format: ",
                        entries: [["Match Response Mime Type","mime"],["Text (Override Mime Type)","text"],["JSON (Override Mime Type)","json"]],
                        value: "mime",
                        key: "outputFormat"
                    },
                    {
                        type: "radioButtonGroup",
                        label: "On Error Response: ",
                        entries: [["Cell Error","error"],["No Cell Error","noError"]],
                        value: "error",
                        key: "onError"
                    }
                ]
            }
        ]
    }

    //==========================
    // Private Methods
    //==========================

    _getBodyDataSource() {
        return {
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let reloadData = this.getComponent().isMemberDataUpdated("member.data");
                let reloadDataDisplay = false;
                return {reloadData,reloadDataDisplay};
            },
    
            getData: () => {
                //Here we return just the body (not header), converted to text if needed
                let wrappedData = dataDisplayHelper.getWrappedMemberData(this,"member.data");
                if(wrappedData.data !== apogeeutil.INVALID_VALUE) {
                    let bodyAndMeta = wrappedData.data;
                    if(!bodyAndMeta) {
                        wrappedData.data = "";
                    }
                    else if(bodyAndMeta.body === undefined) {
                        //just display an empty body
                        wrappedData.data = "";
                    }
                    else {
                        if(typeof bodyAndMeta.body == "string") {
                            wrappedData.data = bodyAndMeta.body;      
                        }
                        else {
                            wrappedData.data = JSON.stringify(bodyAndMeta.body);
                        }
                    }
                }
                return wrappedData;
            }
        }
    }

    _getMetaDataSource() {
        return {
            doUpdate: () => {
                //return value is whether or not the data display needs to be udpated
                let reloadData = this.getComponent().isMemberDataUpdated("member.data");
                let reloadDataDisplay = false;
                return {reloadData,reloadDataDisplay};
            },
    
            getData: () => {
                //Here we return just the meta data, as text
                let wrappedData = dataDisplayHelper.getWrappedMemberData(this,"member.data");
                if(wrappedData.data !== apogeeutil.INVALID_VALUE) {
                    let bodyAndMeta = wrappedData.data;
                    if((!bodyAndMeta)||(!bodyAndMeta.meta)) {
                        wrappedData.data = "";
                    }
                    else {
                        wrappedData.data = JSON.stringify(bodyAndMeta.meta);
                    }
                }
                return wrappedData;
            }
        }
    }

}

//===============================
// config
//===============================

const WebRequestComponentViewConfig = {
    componentType: "apogeeapp.WebRequestCell",
    viewClass: WebRequestComponentView,
    viewModes: [
        getErrorViewModeEntry(),
        {
            name: "Meta",
            label: "Response Info",
            sourceLayer: "model", 
            sourceType: "data",
            suffix: ".data.meta",
            isActive: false,
            getDataDisplay: (componentView,displayContainer) => componentView.getMetaViewDisplay(displayContainer)
    
        },
        {
            name: "Body",
            label: "Response Body",
            sourceLayer: "model", 
            sourceType: "data",
            suffix: ".data.body",
            isActive: true,
            getDataDisplay: (componentView,displayContainer) => componentView.getBodyViewDisplay(displayContainer)
        },
        FormInputBaseComponentView.getConfigViewModeEntry(),
    ],
    iconResPath: "/icons3/mapCellIcon.png"
}
export default WebRequestComponentViewConfig;


