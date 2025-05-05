sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("budgetcosttracking.controller.FinancialPerformanceReport", {
        formatCurrency: function(value) {
            if (value) {
                return 'RM ' + parseFloat(value).toFixed(2);
            }
            return 'RM 0.00';  // Default if no value is provided
        },
        
        onInit: function () {
            var oTempModel = this.getOwnerComponent().getModel("TempDataModel");
            if (oTempModel) {
                var oData = oTempModel.getData();
                console.log("Received Data:", oData);
            }            
            this.onReadFinancialData();
        },

        onReadFinancialData: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oJSONModel = new JSONModel();
        
            var aProjects = []; // Define aProjects here
            
            oModel.bindList("/Projects").requestContexts().then(function (aContexts) {
                aProjects = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });

                // Then, fetch WBS data
                oModel.bindList("/WBS").requestContexts().then(function (aWBSContexts) {
                    var aWBS = aWBSContexts.map(function (oContext) {
                        return oContext.getObject();
                    });

                    // Create an array for WBSData to pass to the VizFrame
                    var aWBSData = [];

                    // Combine Projects and WBS data based on ProjectID (or relevant field)
                    aProjects.forEach(function (project) {
                        // Find all corresponding WBS data for each project
                        var matchingWBS = aWBS.filter(function (wbs) {
                            return wbs.project_ID === project.ID;
                        });
                    
                        if (matchingWBS.length > 0) {
                            matchingWBS.forEach(function (wbs) {
                                // Ensure actualCost is a valid number
                                var allocatedBudget = wbs.allocatedBudget || 0; // Default to 0 if undefined or null
                                var actualCost = parseFloat(wbs.actualCost) || 0; // Convert to float, default to 0 if NaN
                                
                                var budgetUsedPercentage = (allocatedBudget / project.totalBudget) * 100;
                                var remainingBudget = allocatedBudget - actualCost;
                                
                                // Push data to aWBSData array
                                aWBSData.push({
                                    ProjectID: project.ID,
                                    WBS: wbs.wbsName,
                                    ActualCost: actualCost.toFixed(2),
                                    RemainingBudget: remainingBudget.toFixed(2),
                                    PercentageBudget: budgetUsedPercentage.toFixed(2)
                                });
                            });
                        }                                                

                        project.totalBudget = parseFloat(project.totalBudget);
                        project.totalActualCost = parseFloat(project.totalActualCost);
                    
                        // Calculate Remaining Budget (ensure it doesn't go below 0)
                        project.remainingBudget = Math.max(project.totalBudget - project.totalActualCost, 0).toFixed(2);
                    
                        // Calculate Variance
                        project.variance = (project.totalBudget - project.totalActualCost).toFixed(2);
                    
                        // Calculate Variance Percentage
                        project.variancePercentage = ((project.totalBudget - project.totalActualCost) / project.totalBudget) * 100;
                    
                        // Calculate Percentage Budget Used
                        project.percentageBudgetUsed = (project.totalActualCost / project.totalBudget) * 100;
                    
                        // Calculate Percentage Remaining Budget
                        project.percentageRemainingBudget = (project.remainingBudget / project.totalBudget) * 100;
            
                        // Apply toFixed(2) for display purposes and parse them as floats
                        project.remainingBudget = parseFloat(project.remainingBudget);
                        project.variance = parseFloat(project.variance);
                        project.variancePercentage = parseFloat(project.variancePercentage);
                        project.percentageBudgetUsed = parseFloat(project.percentageBudgetUsed);
                        project.percentageRemainingBudget = parseFloat(project.percentageRemainingBudget);
                    });
                
                    // Set the combined data to the JSONModel
                    oJSONModel.setData(aProjects);
                    this.getView().setModel(oJSONModel, "FinancialDataModel");

                    var oWBSDataModel = new JSONModel();
                    oWBSDataModel.setData({
                        WBSData: aWBSData
                    });
                    this.getView().setModel(oWBSDataModel, "WBSDataModel");

                    console.log("Updated Data:", this.getView().getModel("FinancialDataModel").getData());
                    console.log("Centralized WBS Data:", aWBSData);

                }.bind(this)).catch(function (oError) {
                    console.error("Failed to read WBS data: ", oError);
                });

            }.bind(this)).catch(function (oError) {
                console.error("Failed to read Projects data: ", oError);
            });
        },

        onBackToBudgetCostPage: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteBudgetCostPage");
        }
    });
});