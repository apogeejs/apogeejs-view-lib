import JsonComponentViewConfig from "/apogeejs-view-lib/src/componentviews/JsonComponentView.js";
import FunctionComponentViewConfig from "/apogeejs-view-lib/src/componentviews/FunctionComponentView.js";
import DynamicFormViewConfig from "/apogeejs-view-lib/src/componentviews/DynamicFormView.js";
import FormDataComponentViewConfig from "/apogeejs-view-lib/src/componentviews/FormDataComponentView.js";
import CustomComponentViewConfig from "/apogeejs-view-lib/src/componentviews/CustomComponentView.js";
import CustomDataComponentViewConfig from "/apogeejs-view-lib/src/componentviews/CustomDataComponentView.js";
import WebRequestComponentViewConfig from "/apogeejs-view-lib/src/componentviews/WebRequestComponentView.js";
import ErrorComponentViewConfig from "/apogeejs-view-lib/src/componentviews/ErrorComponentView.js";

//TESTING
import ReactElementCellViewConfig from "/apogeejs-admin/dev/jsxModule/src/ReactElementCellView.js";
import ReactDisplayCellViewConfig from "/apogeejs-admin/dev/jsxModule/src/ReactDisplayCellView.js";

import {registerComponentView,setErrorComponentView} from "/apogeejs-view-lib/src/componentViewInfo.js";

//registration of the child component views

registerComponentView(JsonComponentViewConfig);
registerComponentView(FunctionComponentViewConfig);
registerComponentView(ErrorComponentViewConfig);
registerComponentView(DynamicFormViewConfig);
registerComponentView(FormDataComponentViewConfig);
registerComponentView(CustomComponentViewConfig);
registerComponentView(CustomDataComponentViewConfig);
registerComponentView(WebRequestComponentViewConfig);

//TESTING
registerComponentView(ReactElementCellViewConfig);
registerComponentView(ReactDisplayCellViewConfig);

setErrorComponentView(ErrorComponentViewConfig);

//JSON PLUS COMPONENT
import FullActionFormComponentViewConfig from "/apogeejs-view-lib/src/componentviews/FullActionFormComponentView.js";
registerComponentView(FullActionFormComponentViewConfig);
import FullDataFormComponentViewConfig from "/apogeejs-view-lib/src/componentviews/FullDataFormComponentView.js";
registerComponentView(FullDataFormComponentViewConfig);

import DesignerDataFormComponentViewConfig from "/apogeejs-view-lib/src/componentviews/DesignerDataFormComponentView.js";
registerComponentView(DesignerDataFormComponentViewConfig);
import DesignerActionFormComponentViewConfig from "/apogeejs-view-lib/src/componentviews/DesignerActionFormComponentView.js";
registerComponentView(DesignerActionFormComponentViewConfig);

//JSON PLUS COMPONENT
import JsonPlusComponentViewConfig from "/apogeejs-view-lib/src/componentviews/JsonPlusComponentView.js";
registerComponentView(JsonPlusComponentViewConfig);