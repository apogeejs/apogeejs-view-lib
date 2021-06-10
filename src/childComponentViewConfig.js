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
import ActionFormComponentView from "/apogeejs-view-lib/src/componentviews/ActionFormComponentView.js";
registerComponentView(ActionFormComponentView);
import DataFormComponentView from "/apogeejs-view-lib/src/componentviews/DataFormComponentView.js";
registerComponentView(DataFormComponentView);

import MakerDataFormComponentView from "/apogeejs-view-lib/src/componentviews/MakerDataFormComponentView.js";
registerComponentView(MakerDataFormComponentView);
import MakerActionFormComponentView from "/apogeejs-view-lib/src/componentviews/MakerActionFormComponentView.js";
registerComponentView(MakerActionFormComponentView);

//JSON PLUS COMPONENT
import JsonPlusTableComponentView from "/apogeejs-view-lib/src/componentviews/JsonPlusTableComponentView.js";
registerComponentView(JsonPlusTableComponentView);