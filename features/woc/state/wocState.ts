export type WocData = {
  workOrder: string;
  partNumber: string;
  revision: string;
  customer: string;
  quantity: string;
  department: string;
  operation: string;
  process: string;
  currentListedRate: string;
  observedBaseline: string;
  issueType: string;
  correctionType: string;
  category: string;
  priority: string;
  problemSummary: string;
  requestedAction: string;
  optionalNote: string;
};

export const blankWocData: WocData = {
  workOrder: '',
  partNumber: '',
  revision: '',
  customer: '',
  quantity: '',
  department: '',
  operation: '',
  process: '',
  currentListedRate: '',
  observedBaseline: '',
  issueType: 'Incorrect Time / Rate',
  correctionType: 'Incorrect Time / Rate',
  category: '',
  priority: 'Medium',
  problemSummary: '',
  requestedAction: '',
  optionalNote: '',
};

export type WocStep = 'capture' | 'buildCorrection' | 'drafts' | 'history' | 'home' | 'more';

export const defaultConfirmations = [false, false, false, false, false];

export function resetWocState(setters: {
  setData: (data: WocData) => void;
  setCurrentStep: (step: WocStep) => void;
  setConfirmations: (checks: boolean[]) => void;
  setGeneratedOutputs: (outputs: { report: null; emailDraft: null }) => void;
}) {
  setters.setData(blankWocData);
  setters.setCurrentStep('capture');
  setters.setConfirmations([...defaultConfirmations]);
  setters.setGeneratedOutputs({ report: null, emailDraft: null });
}
