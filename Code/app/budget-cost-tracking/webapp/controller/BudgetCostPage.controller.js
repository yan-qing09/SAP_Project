sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"  // Import MessageBox for the confirmation dialog
], function (Controller, JSONModel, BusyIndicator, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("budgetcosttracking.controller.BudgetCostPage", {
        onInit: function () {
            this.onReadWBSData();
        },
        
        onReadWBSData: function () {
            var oModel = this.getOwnerComponent().getModel();
            var aProjects = []; // Declare aProjects here
            var oBusyDialog = new sap.m.BusyDialog({
                title: "Loading Data",
                text: "Please wait ......"
            });
            oBusyDialog.open();

            oModel.bindList("/Projects").requestContexts().then(function (aContexts) {
                aProjects = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });

                // Fetch WBS data
                oModel.bindList("/WBS").requestContexts().then(function (aWBSContexts) {
                    var aWBS = aWBSContexts.map(function (oContext) {
                        return oContext.getObject();
                    });

                    // Create an array for WBSData to pass to the VizFrame
                    var aWBSData = [];
                    var totalBudget = 0;

                    // Combine Projects and WBS data based on ProjectID (or relevant field)
                    aProjects.forEach(function (project) {
                        // Find all corresponding WBS data for each project
                        var matchingWBS = aWBS.filter(function (wbs) {
                            return wbs.project_ID === project.ID;
                        });
                    
                        if (matchingWBS.length > 0) {
                            matchingWBS.forEach(function (wbs) {
                                // Ensure allocatedBudget is a valid number
                                var allocatedBudget = parseFloat(wbs.allocatedBudget) || 0; // Default to 0 if it's not a valid number
                                var actualCost = parseFloat(wbs.actualCost) || 0; // Convert to float, default to 0 if NaN

                                // Push data to aWBSData array
                                aWBSData.push({
                                    ProjectID: project.ID,
                                    id: wbs.ID,
                                    WBS: wbs.wbsName,
                                    ActualCost: actualCost.toFixed(2),
                                    Budget: allocatedBudget.toFixed(2), 
                                });
                            });
                        }

                        totalBudget += parseFloat(project.totalBudget) || 0; // Accumulate totalBudget across projects
                    });

                    var oWBSDataModel = new JSONModel();
                    oWBSDataModel.setData({
                        WBSData: aWBSData
                    });
                    this.getView().setModel(oWBSDataModel, "WBSDataModel");
                    
                    var oTotalBudgetModel = new JSONModel();
                    oTotalBudgetModel.setData({
                        TotalBudget: totalBudget.toFixed(2) // Pass the totalBudget value
                    });

                    // Set the TotalBudget model to the view
                    this.getView().setModel(oTotalBudgetModel, "TotalBudgetModel");

                    oBusyDialog.close();

                }.bind(this)).catch(function (oError) {
                    console.error("Failed to read WBS data: ", oError);
                    oBusyDialog.close();
                });

            }.bind(this)).catch(function (oError) {
                console.error("Failed to read Projects data: ", oError);
                oBusyDialog.close();
            });
        },

        onLiveChange: function(oEvent) {
            var oInput = oEvent.getSource(); // Get the input field
            var sNewValue = oInput.getValue(); // Get the new value of ActualCost
            var oBindingContext = oInput.getBindingContext("WBSDataModel"); // Get the binding context
            var oData = oBindingContext.getObject(); // Get the object that contains Budget and ActualCost
            
            // Check if the input is empty (i.e., deleted everything)
            if (sNewValue.trim() === "") {
                // If the input is empty, reset the Variance and FlagState
                oData.Variance = ""; // Set Variance to an empty string or "nothing"
                oData.FlagState = "";  // Reset the FlagState
                oData.FlagText = ""; // Reset the FlagText
                
                // Reset the ActualCost to an empty value
                oData.ActualCost = ""; // Reset ActualCost field
                
                // Update the totals in the model
                this.updateTotals();
                
                // Refresh the model to reflect changes
                oBindingContext.getModel().refresh(true); // Force refresh to update the UI
                return; // Exit the function to prevent further processing
            }
        
            // Validate the input
            if (!this._isValidCost(sNewValue)) {
                // Show error message and clear input if invalid
                MessageToast.show("Error: Please enter a valid, non-negative number.");
                oInput.setValue(""); // Clear the invalid input
                return;
            }
        
            var budget = parseFloat(oData.Budget);
            var actualCost = parseFloat(sNewValue);
        
            // Calculate the variance
            var variance = actualCost - budget;
        
            // Update the variance and flag in the data model immediately
            oData.Variance = variance.toFixed(2); // Update the Variance field
            oData.FlagState = (variance < 0) ? "Success" : (variance > 0 ? "Error" : "Neutral"); // Update flag based on variance
            oData.FlagText = (variance < 0) ? "Underbudget" : (variance > 0 ? "Overrun" : "Underbudget"); // Update flag text

            // Update the actual cost in the data model
            oData.ActualCost = actualCost; // Update ActualCost field
            
            // Now update the totals in the model
            this.updateTotals();
            
            // Refresh the model to reflect changes
            oBindingContext.getModel().refresh(true);  // Force refresh to update the UI
        },        

        _isValidCost: function (value) {
            // Allow input with any number of digits, but ensure no more than 2 digits after the decimal point
            var regex = /^[+]?\d*\.?\d{0,2}$/; // Allow up to two digits after the decimal point
            return regex.test(value); // Return true if the input matches the regex
        },                
        
        // Function to update the totals dynamically in the model
        updateTotals: function() {
            var oModel = this.getView().getModel("WBSDataModel");
            var aWBSData = oModel.getData().WBSData; // Get WBS data from the model
        
            var totalActualCost = 0.00;
            var totalVariance = 0.00;
        
            // Loop through each WBS data and accumulate the totals
            aWBSData.forEach(function(oData) {
                totalActualCost += parseFloat(oData.ActualCost) || 0; // Ensure it's a number
                totalVariance += (parseFloat(oData.Variance) || 0); // If Variance is empty or invalid, count it as 0
            });
        
            // Update the totals directly in the model
            oModel.setProperty("/TotalActualCost", totalActualCost.toFixed(2));
            oModel.setProperty("/TotalVariance", totalVariance.toFixed(2));
        
            // Refresh the model to ensure the UI is updated
            oModel.refresh(true);  // Force a refresh to update the binding
        },
        
        onContinuePress: function () {
            var oModel = this.getView().getModel("WBSDataModel"); // Access WBSDataModel
            var aWBS = oModel.getData().WBSData; // Get WBS data from the model
            var totalActualCost = oModel.getProperty("/TotalActualCost"); // Get total actual cost
            var totalVariance = oModel.getProperty("/TotalVariance"); // Get total variance
            var totalBudget = this.getView().getModel("TotalBudgetModel").getProperty("/TotalBudget"); // Get total budget from TotalBudgetModel
            
            // Create a temporary model to pass data
            var oTempModel = new sap.ui.model.json.JSONModel({
                TotalActualCost: totalActualCost,
                TotalVariance: totalVariance,
                TotalBudget: totalBudget, // Pass totalBudget as well
                WBSData: aWBS
            });
        
            // Set the temporary model in the component
            this.getOwnerComponent().setModel(oTempModel, "TempDataModel");
        
            // Check for budget overruns
            var overrunExists = aWBS.some(function (item) {
                return parseFloat(item.Variance) > 0; // Variance overrun condition
            });
        
            if (overrunExists) {
                // Show confirmation pop-up for budget overrun
                sap.m.MessageBox.confirm(
                    "There are budget overruns. Would you like to readjust the resource allocation?", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        icon: sap.m.MessageBox.Icon.WARNING,
                        title: "Budget Overrun Alert",
                        onClose: this._onMessageBoxClose.bind(this)
                    }
                );
            } else {
                // No overruns detected, navigate to Financial Performance Report
                sap.m.MessageToast.show("No overruns detected.");
                this.getOwnerComponent().getRouter().navTo("RouteFinancialPerformanceReport");
            }
        },        
        
        _onMessageBoxClose: function (sAction) {
            if (sAction === sap.m.MessageBox.Action.YES) {
                // If user clicks YES, navigate to Resource Allocation Page
                this.getOwnerComponent().getRouter().navTo("RouteResourceAllocationPage");
            } else if (sAction === sap.m.MessageBox.Action.NO) {
                // If user clicks NO, navigate to Financial Performance Report
                this.getOwnerComponent().getRouter().navTo("RouteFinancialPerformanceReport");
            }
        }        
        
    });
});
