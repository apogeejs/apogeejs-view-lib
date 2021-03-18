//These are in lieue of the import statements
import FormInputBaseComponentView from "/apogeejs-view-lib/src/componentviews/FormInputBaseComponentView.js";
import AceTextEditor from "/apogeejs-view-lib/src/datadisplay/AceTextEditor.js";
import StandardErrorDisplay from "/apogeejs-view-lib/src/datadisplay/StandardErrorDisplay.js";
import dataDisplayHelper from "/apogeejs-view-lib/src/datadisplay/dataDisplayHelper.js";
import DATA_DISPLAY_CONSTANTS from "/apogeejs-view-lib/src/datadisplay/dataDisplayConstants.js";

/** This is a graphing component using ChartJS. It consists of a single data table that is set to
 * hold the generated chart data. The input is configured with a form, which gives multiple options
 * for how to set the data. */
export default class WebRequestComponentView extends FormInputBaseComponentView {

    constructor(appViewInterface,component) {
        super(appViewInterface,component);
    };

    //=================================
    // Implementation Methods
    //=================================

    /**  This method retrieves the table edit settings for this component instance
     * @protected */
    getTableEditSettings() {
        return WebRequestComponentView.TABLE_EDIT_SETTINGS;
    }

    /** This method should be implemented to retrieve a data display of the give type. 
     * @protected. */
    getDataDisplay(displayContainer,viewType) {
        let dataDisplaySource;
        switch(viewType) {

            case WebRequestComponentView.VIEW_META:
                dataDisplaySource = this._getMetaDataSource();
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/json",AceTextEditor.OPTION_SET_DISPLAY_SOME);

            case WebRequestComponentView.VIEW_BODY:
                dataDisplaySource = this._getBodyDataSource();
                return new AceTextEditor(displayContainer,dataDisplaySource,"ace/mode/text",AceTextEditor.OPTION_SET_DISPLAY_SOME);

            case WebRequestComponentView.VIEW_INPUT:
                return this.getFormDataDisplay(displayContainer);

            case FormInputBaseComponentView.VIEW_INFO: 
                dataDisplaySource = dataDisplayHelper.getStandardErrorDataSource(this.getApp(),this);
                return new StandardErrorDisplay(displayContainer,dataDisplaySource);

            default:
                console.error("unrecognized view element: " + viewType);
                return null;
        }
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
                        entries: [["Text","value"],["Reference","simple"]],
                        value: "value",
                        key: "urlType"
                    }
                ]
            },
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
                        entries: [["Text","value"],["Reference","simple"]],
                        value: "value",
                        key: "bodyType"
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
                                        entries: [["Text","value"],["Reference","simple"]],
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
                entries: [["Match Mime Type","mime"],["Text","text"],["JSON","json"]],
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
                //Here we return just the meta data
                //convert it to text if it is in json format
                let dataMember = this.getComponent().getField("member.data");
                let wrappedData = this._getWrappedData(dataMember);
                if(wrappedData.data !== apogeeutil.INVALID_VALUE) {
                    let body = wrappedData.data.body;
                    if(typeof body == "object") {
                        wrappedData.data = JSON.stringify(body);
                    }
                    else {
                        wrappedData.data = body;
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
                let dataMember = this.getComponent().getField("member.data");
                let wrappedData = this._getWrappedData(dataMember);
                if(wrappedData.data !== apogeeutil.INVALID_VALUE) {
                    wrappedData.data = JSON.stringify(wrappedData.data.meta);
                }
                return wrappedData;
            }
        }
    }

    /** This gets the wrapped data for the member. We will split up the data for the 
     * metadata and the body in the data source, if the data is valid. */
    _getWrappedData(member) {
        let wrappedData = dataDisplayHelper.getEmptyWrappedData();
        if(member.getState() != apogeeutil.STATE_NORMAL) {
            switch(member.getState()) {
                case apogeeutil.STATE_ERROR: 
                    //check if there is valueData on the error object
                    let error = member.getError();
                    if((error)&&(error.valueData)) {
                        //there is a substitute value
                        //only process json, which is what we expect this to hold
                        if(error.valueData.nominalType == MIME_TYPE_JSON) {
                            wrappedData.data = error.valueData.value
                        }
                    }
                    //if no value was set, which is most times
                    if(wrappedData.data === undefined) {
                        //normal error with not substitue value
                        wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_ERROR;
                        wrappedData.message = "Error in value: " + member.getErrorMsg();
                        wrappedData.hideDisplay = true;
                        wrappedData.data = apogeeutil.INVALID_VALUE;
                    }
                    break;

                case apogeeutil.STATE_PENDING:
                    wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_INFO;
                    wrappedData.message = "Value pending!";
                    wrappedData.hideDisplay = true;
                    wrappedData.data = apogeeutil.INVALID_VALUE;
                    break;

                case apogeeutil.STATE_INVALID:
                    wrappedData.messageType = DATA_DISPLAY_CONSTANTS.MESSAGE_TYPE_INFO;
                    wrappedData.message = "Value invalid!";
                    wrappedData.hideDisplay = true;
                    wrappedData.data = apogeeutil.INVALID_VALUE;
                    break;

                default:
                    throw new Error("Unknown display data value state!")
            }
        }
        else {
            //just return the json data
            wrappedData.data = member.getData();
        }

        return wrappedData;
    }

}

//======================================
// Static properties
//======================================

const MIME_TYPE_JSON = "application/json"

//===================================
// View Definitions Constants (referenced internally)
//==================================

WebRequestComponentView.VIEW_META = "Meta";
WebRequestComponentView.VIEW_BODY = "Body";

WebRequestComponentView.VIEW_MODES = [
    FormInputBaseComponentView.VIEW_INFO_MODE_ENTRY,
    {name: WebRequestComponentView.VIEW_META, label: "Response Info", isActive: false},
    {name: WebRequestComponentView.VIEW_BODY, label: "Response Body", isActive: false},
    FormInputBaseComponentView.INPUT_VIEW_MODE_INFO
];

WebRequestComponentView.TABLE_EDIT_SETTINGS = {
    "viewModes": WebRequestComponentView.VIEW_MODES
}


//===============================
// Required External Settings
//===============================

/** This is the component name with which this view is associated. */
WebRequestComponentView.componentName = "apogeeapp.WebRequestCell";

/** If true, this indicates the component has a tab entry */
WebRequestComponentView.hasTabEntry = false;
/** If true, this indicates the component has an entry appearing on the parent tab */
WebRequestComponentView.hasChildEntry = true;

/** This is the icon url for the component. */
WebRequestComponentView.ICON_RES_PATH = "/icons3/mapCellIcon.png";

//-----------------------
// Other random internal constants
//-----------------------

const JSON_TEXT_FORMAT_STRING = "\t";

const HEADER_GRID_PIXEL_HEIGHT = 75;

