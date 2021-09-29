import ComponentView from "/apogeejs-view-lib/src/componentdisplay/ComponentView.js";

/** This component represents a table object. */
export default class MultiLoginComponentView extends ComponentView {

    //needed as a part component view, for now - does nothing
    addChild(childComponentView) {
        //TESTING!!!////////
        let componentDisplay = this.getComponentDisplay();
        componentDisplay.addChildComponentView(childComponentView);
        childComponentView.setComponentDisplay(componentDisplay);
        ///////////////////
    }

    removeChild(childComponentView) {
        //TESTING!!!////////
        //do something here?
        //////////////////////
    }
 }

