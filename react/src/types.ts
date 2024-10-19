export enum FormState {
    New = 'New',
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
    Unknown = 'unknown'
}
export enum Role {
    Superadmin = 'superadmin',
    Admin = 'admin',
    Supervisor = 'supervisor',
    Editor = 'editor',
    CEO = 'CEO'
}

export interface WeeklyTarget {
    id?: number;
    productId: number;
    layerId: number;
    weekStart: string;
    mondayAmount?: number | null;
    tuesdayAmount?: number | null;
    wednesdayAmount?: number | null;
    productionRole?: ProductionRole;
    thursdayAmount?: number | null;
    fridayAmount?: number | null;
    saturdayAmount?: number | null;
    sundayAmount?: number | null;
    amount?: number | null;
}



  export interface Sheet {
    sheetId: number;
    sheetName: string | null;
    year?: number;
    country?: string | null;
    deliveryNumber: number | null;
    inProgress: boolean;
    qcInProgress: boolean;
    hydro_Index_Density?: string | null;
    agri_Index_Density?: string | null;
    building_Index_Density?: string | null;
    road_Index_Density?: string | null;
    sheetAssignments?: SheetAssignment[];
}

export interface SheetAssignment {
    sheetAssignmentId: number;
    sheetId: number;
    sheet?: Sheet;
    taqniaID: number;
    isApproved: boolean;
    user?: User;
    inProgress: boolean;
    layerId: number;
    layer?: Layer;
    isQC: boolean | null;
    assignmentDate: Date | null;
}
export interface SheetLayerStatus {
    id: number;
    sheetId: number;
    sheet?: Sheet;  
    layerId: number;

    layer?: Layer;  
    completion: number;
    isQCInProgress: boolean;
    isFinalQCInProgress: boolean;
    isFinalizedQCInProgress: boolean;
    inProgress: boolean;
}


export interface DailyTarget {
    targetId: number;
    hoursWorked: number;
    completion?: number;
    productivity: number;
    layer?: Layer | null;
    remark?: Remark | null;
    product?: Product | null;
    isQC?: boolean | null;
    sheetLayerStatusId?: number | null;
    sheetLayerStatus?: SheetLayerStatus | null;
    sheetAssignmentId?: number | null;
    sheetAssignment?: SheetAssignment | null;
    sheetNumber?: string | null;
    expectedProductivity?: number | null;
    formId: number;
    form?: Form | null;
}
export interface Form {
    formId: number;
    comment?: string | null;
    product?: Product | null;
    submissionDate: string; // ISO string date
    productivityDate: string; // ISO string date
    employeeName?: string | null;
    supervisorTaqniaID?: number | null;
    dailyTargets: DailyTarget[];
    productionRole?: ProductionRole;
    approvals: Approval[];
    taqniaID: number;
    user?: User | null;
}

export interface Approval {
    approvalId: number;
    supervisorTaqniaID?: number | null;
    supervisorComment?: string | null;
    state?: FormState | null;
    stepOrder: number;
    formId: number;
    form?: Form | null;
}

export interface Layer {
    id: number;
    name: string;
}

export interface Remark {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    name: string;
}

export interface Link {
    id?: number;
    layerId: number;
    link: string;
    weekStart: string;
    layer?: Layer | null;
  }
  export interface Targets {
    targetId: number;
    layer: Layer | null;
    product: Product | null;
    amount: number | null;
    date: string;  // ISO date string
}
export interface Calculation {
    calculationId: number;
    layer: Layer;
    remark: Remark;
    valuePerHour: number;
    valuePer8Hours: number;
    dailyHours: number;
    product: Product;
    
}
export interface ProjectTarget {
    id: number;            
    productId: number;      
    product?: Product;        
    layerId: number;          
    layer?: Layer;          
    deliveryDate: string;     
    deliveryName?: string;    
    amount?: number;          
  }


export interface User {
    taqniaID: number;
    nationalID?: string | null;
    name?: string | null;
    product?: string | null;
    layer?: string
    layerAssignment?: Layer; 
    productAssignment?: Product;
    email?: string | null;
    phoneNumber?: string | null;
    username?: string | null;
    password?: string | null;
    role?: string | null;
    employeeType?: string | null;
    productionRole: ProductionRole;
    supervisorTaqniaID?: number | null;
}


export enum ProductionRole {
    Production = 'Production',
    DailyQC = 'DailyQC',
    FinalizedQC  = 'FinalizedQC',
    FinalQC = 'FinalQC', 
}
export const getProductionRoleString = (role: ProductionRole | undefined): string => {
    switch (role) {
      case ProductionRole.Production:
        return 'Production';
      case ProductionRole.DailyQC:
        return 'Daily QC';
      case ProductionRole.FinalizedQC:
        return 'Finalized QC';
      case ProductionRole.FinalQC:
        return 'Final QC';
      default:
        return 'Unknown';
    }
  };