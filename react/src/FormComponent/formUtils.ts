import { DailyTarget, Form, User } from "../types";

// Initialize a DailyTarget object
export const initialTarget = (): DailyTarget => ({
  targetId: 0, 
  hoursWorked: 0,
  productivity: 0,
  layer: null,
  remark: null,
  product: null,
  formId: 0,
});

// Initialize a Form object
export const initialForm = (user: User): Form => ({
  formId: 0, 
  comment: null,
  product: user.productAssignment || null,
  submissionDate: "",
  productivityDate: "",
  employeeName: user.name || null,
  supervisorTaqniaID: user.supervisorTaqniaID || null,
  dailyTargets: [],

  approvals: [], 
  productionRole: user.productionRole,
  taqniaID: user.taqniaID,
  user: user || null,
});

// Validate the form before submission
export const validateForm = (form: Form) => {
  if (!form.dailyTargets || form.dailyTargets.length === 0) {
    alert("Add at least one target");
    return false;
  }
console.log("validating form: ",form)


    for (const target of form.dailyTargets) {
        target.hoursWorked = 0;
    if (target.productivity <= 0) {
      alert("Each target's productivity must be greater than 0.");
      return false;
    }
    target.productivity = Number(target.productivity.toFixed(2));
    if ( !target.remark && !target.isQC) {
      alert("Each target must have remark.");
      return false;
    }
    if (  !target.layer) {
      alert("Each target must have a  layer.");
      return false;
    }
    if(!target.sheetLayerStatus ){
      alert("no sheet selected")
      return false; 
    }
  }

  if (!form.product) {
    alert("Please select a product.");
    return false;
  }

  return true;
};
