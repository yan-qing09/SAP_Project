sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("budgetcosttracking.controller.ResourceAllocationPage", {
        
        onInit: function () {
            // Initialization code here (if any)
        },

        onNextPress: function () {
            // Trigger navigation to the BudgetCostPage
            this.getOwnerComponent().getRouter().navTo("RouteBudgetCostPage");
        }

    });
});
