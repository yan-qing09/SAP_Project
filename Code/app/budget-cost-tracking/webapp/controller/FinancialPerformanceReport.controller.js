sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("budgetcosttracking.controller.FinancialPerformanceReport", {
        formatCurrency: function(value) {
            if (value !== undefined && value !== null) {
                var formattedValue = parseFloat(value).toFixed(2);
                if (parseFloat(value) < 0) {
                    // If the value is negative, prefix with '- RM'
                    return '- RM ' + Math.abs(formattedValue).toFixed(2);
                }
                // If the value is positive, prefix with 'RM'
                return 'RM ' + formattedValue;
            }
            return 'RM 0.00';  // Default if no value is provided
        },  

        formatPercentage: function(value) {
            if (value !== undefined && value !== null) {
                return value + ' %';
            }
            return ''; // Return an empty string if the value is undefined or null
        },        

        onInit: function () {
            var oTempModel = this.getOwnerComponent().getModel("TempDataModel");
            if (oTempModel) {
                var oData = oTempModel.getData();
                console.log("Received TempDataModel Data:", oData);
            }
            this.onReadFinancialData();
        },

        onReadFinancialData: function () {
            var oTempModel = this.getOwnerComponent().getModel("TempDataModel");
            var oFinancialDataModel = new JSONModel();  // Model for Total Data (Budget, Actual, etc.)
            var oWBSDataModel = new JSONModel();  // Model for WBS Data (WBS elements)
        
            var aWBSData = []; // Array to hold the WBS-related data
            var totalBudget = 0;
            var totalActualCost = 0;
            var totalVariance = 0;
        
            // Fetch all the relevant data from TempDataModel
            if (oTempModel) {
                var tempData = oTempModel.getData(); // Assuming data structure { wbsId: [{allocatedBudget, actualCost, projectID, etc.}], totalVariance: value, ... }
                
                // Iterate over the WBS data
                for (var wbsId in tempData) {
                    if (tempData.hasOwnProperty(wbsId)) {
                        var data = tempData[wbsId]; // The data associated with each wbsId
        
                        // Check if the data is an array (WBS data)
                        if (Array.isArray(data)) {
                            for (var i = 0; i < data.length; i++) {
                                var wbs = data[i]; // Get the current WBS record
        
                                // Ensure all numbers are parsed as floats
                                var allocatedBudget = parseFloat(wbs.Budget) || 0;
                                var actualCost = parseFloat(wbs.ActualCost) || 0;
        
                                // Calculate budget used percentage and remaining budget
                                var budgetUsedPercentage = (allocatedBudget / totalBudget) * 100;
                                var remainingBudget = allocatedBudget - actualCost;
        
                                // Push data to the WBS array
                                aWBSData.push({
                                    WBS: wbs.WBS,
                                    ActualCost: actualCost.toFixed(2),
                                    RemainingBudget: remainingBudget.toFixed(2),
                                    PercentageBudget: budgetUsedPercentage.toFixed(2)
                                });
                            }
                        }
                        // Check if it's a total value
                        else {
                            if (wbsId === 'TotalVariance') {
                                totalVariance = parseFloat(data) || 0;
                            } else if (wbsId === 'TotalBudget') {
                                totalBudget = parseFloat(data) || 0;
                            } else if (wbsId === 'TotalActualCost') {
                                totalActualCost = parseFloat(data) || 0;
                            }
                        }
                    }
                }
        
                // Calculate additional metrics for the financial overview
                var remainingProjectBudget = Math.max(totalBudget - totalActualCost, 0);
                var variancePercentage = (totalVariance / totalBudget) * 100;
                var percentageBudgetUsed = Math.min((totalActualCost / totalBudget) * 100, 100);
                var percentageRemainingBudget = 100 - percentageBudgetUsed;
        
                // Set the total data (financial overview)
                oFinancialDataModel.setData({
                    totalBudget: parseFloat(totalBudget.toFixed(2)),
                    remainingBudget: parseFloat(remainingProjectBudget.toFixed(2)),
                    totalActualCost: parseFloat(totalActualCost.toFixed(2)),
                    totalVariance: parseFloat(totalVariance.toFixed(2)),
                    variancePercentage: parseFloat(variancePercentage.toFixed(2)),
                    percentageBudgetUsed: parseFloat(percentageBudgetUsed.toFixed(2)),
                    percentageRemainingBudget: parseFloat(percentageRemainingBudget.toFixed(2))
                });
                
                // Set the WBS-related data
                oWBSDataModel.setData({
                    WBSData: aWBSData
                });
            }
        
            // Bind the models to the view
            this.getView().setModel(oFinancialDataModel, "FinancialDataModel");
            this.getView().setModel(oWBSDataModel, "WBSDataModel");
        
            console.log("Updated Financial Data Model:", oFinancialDataModel.getData());
            console.log("Updated WBS Data Model:", oWBSDataModel.getData());
        },
        
        onBackToBudgetCostPage: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteBudgetCostPage");
        }
    });
});
