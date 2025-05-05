namespace app.projectBudgeting;

using {
    cuid,
    managed
} from '@sap/cds/common';

type ResourceType : String(50); // Type of resource like materials cost, oil cost, etc.
type CostAmount   : Decimal(10, 2); // Cost representation
type BudgetAmount : Decimal(10, 2); // Budget representation
type Text         : String(1024);   // Description or additional details

entity Projects : cuid, managed {
    projectName           : String(100);
    totalBudget    : BudgetAmount default 0;
    totalActualCost: CostAmount default 0;
    wbsStructures  : Association to many WBS
                      on wbsStructures.project = $self; // Changed to association
};

entity WBS : cuid, managed {
    wbsName        : String(100);
    allocatedBudget: BudgetAmount @cds.calculated: true; // Dynamically calculated
    actualCost     : CostAmount default 0; // Initialize to 0
    project        : Association to Projects;
    resources      : Association to many Resources on resources.wbs = $self;
};

entity Resources : cuid, managed {
    resourceType     : ResourceType;
    resourceCost     : CostAmount;
    wbs              : Association to WBS; // Linking to WBS
};

