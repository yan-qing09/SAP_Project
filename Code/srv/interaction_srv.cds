using app.projectBudgeting from '../db/interaction';
using {sap} from '@sap/cds-common-content';

service ProjectBudgetingService {

    @odata.draft.enabled: true
    entity Projects as projection on projectBudgeting.Projects;

    @odata.draft.enabled: true
    entity WBS as projection on projectBudgeting.WBS;

    @odata.draft.enabled: true
    entity Resources as projection on projectBudgeting.Resources;

    @readonly
    entity Languages as projection on sap.common.Languages;
}
