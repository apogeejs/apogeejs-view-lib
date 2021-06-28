import JsonTableComponentView from "/apogeejs-view-lib/src/componentviews/JsonTableComponentView.js";
import FunctionComponentView from "/apogeejs-view-lib/src/componentviews/FunctionComponentView.js";
import DynamicFormView from "/apogeejs-view-lib/src/componentviews/DynamicFormView.js";
import FormDataComponentView from "/apogeejs-view-lib/src/componentviews/FormDataComponentView.js";
import CustomComponentView from "/apogeejs-view-lib/src/componentviews/CustomComponentView.js";
import CustomDataComponentView from "/apogeejs-view-lib/src/componentviews/CustomDataComponentView.js";
import WebRequestComponentView from "/apogeejs-view-lib/src/componentviews/WebRequestComponentView.js";
import ErrorComponentView from "/apogeejs-view-lib/src/componentviews/ErrorComponentView.js";

import {registerComponentView,setErrorComponentView} from "/apogeejs-view-lib/src/componentViewInfo.js";

//registration of the child component views

registerComponentView(JsonTableComponentView);
registerComponentView(FunctionComponentView);
registerComponentView(ErrorComponentView);
registerComponentView(DynamicFormView);
registerComponentView(FormDataComponentView);
registerComponentView(CustomComponentView);
registerComponentView(CustomDataComponentView);
registerComponentView(WebRequestComponentView);

setErrorComponentView(ErrorComponentView);

//JSON PLUS COMPONENT
import FullActionFormComponentView from "/apogeejs-view-lib/src/componentviews/FullActionFormComponentView.js";
registerComponentView(FullActionFormComponentView);
import FullDataFormComponentView from "/apogeejs-view-lib/src/componentviews/FullDataFormComponentView.js";
registerComponentView(FullDataFormComponentView);

import DesignerDataFormComponentView from "/apogeejs-view-lib/src/componentviews/DesignerDataFormComponentView.js";
registerComponentView(DesignerDataFormComponentView);
import DesignerActionFormComponentView from "/apogeejs-view-lib/src/componentviews/DesignerActionFormComponentView.js";
registerComponentView(DesignerActionFormComponentView);

//JSON PLUS COMPONENT
import JsonPlusTableComponentView from "/apogeejs-view-lib/src/componentviews/JsonPlusTableComponentView.js";
registerComponentView(JsonPlusTableComponentView);