import { useState, useEffect } from "react";
import {
  User,
  Form,
  FormState,
  SheetAssignment,
  Remark,
  Layer,
} from "../types";
import { initialForm } from "./formUtils";
import { userService } from "../services/userService";
import { formService } from "../services/formService";
import { entityService } from "../services/entityService";
import { sheetAssignmentService } from "../services/SheetAssignmentService";

export const useFormManagement = (user: User, selectedDate: string) => {
  const [form, setForm] = useState<Form>(initialForm(user));
  const [formExists, setFormExists] = useState(false);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [assignedSheets, setAssignedSheets] = useState<SheetAssignment[]>([]);
  const [layers, setlayers] = useState<Layer[]>([]);
  const [remarks, setremarks] = useState<Remark[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          supervisorsData,
          layersData,
          remarksData,
          assignedSheetsData,
        ] = await Promise.all([
          userService.getUsersByRole("supervisor"),
          entityService.getAllLayers(),
          entityService.getAllRemarks(),
          sheetAssignmentService.getSheetAssignmentsByUserId(user.taqniaID),
        ]);

        setSupervisors(supervisorsData);
        setAssignedSheets(assignedSheetsData);
        setlayers(layersData);
        setremarks(remarksData);

        if (selectedDate) {
          const formData = await formService.getUserFormByDate(
            user.taqniaID,
            selectedDate
          );
          if 
          (formData) {
            setForm(formData);
            setFormExists(true);
            console.log(formData)

          } 
          else {
            const newForm = initialForm(user);
            newForm.productivityDate = selectedDate;
            setForm(newForm);
            setFormExists(false);
          }
        } 
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
        }
      }
    };

    fetchData();
  }, [selectedDate, user]);

  const getFormState = (form: Form): FormState => {
    if (!form.approvals || form.approvals.length === 0) return FormState.New;
    const firstApproval = form.approvals[0];
    return (firstApproval.state as FormState) || ("pending" as FormState);
  };

  const formState = getFormState(form);




  const isFormEditable =
    formState === "New" || formState === "rejected" || formState === "pending";

  const isFormReady =
    !!selectedDate && !!form.supervisorTaqniaID && !!form.product;

  return {
    form,
    setForm,
    formExists,
    setFormExists,
    supervisors,
    assignedSheets,
    layers,
    remarks,
    formState,
    isFormEditable,
    isFormReady,
  };
};
