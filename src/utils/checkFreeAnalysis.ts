import { FreeAnalysisModel } from '../models/FreeAnalysis';

export async function checkAndUseFreeAnalysis(userId: string): Promise<{ canUse: boolean; isFree: boolean }> {
  const hasFreeAnalysis = await FreeAnalysisModel.hasFreeAnalysisThisWeek(userId);
  
  if (hasFreeAnalysis) {
    return { canUse: false, isFree: false };
  }
  
  return { canUse: true, isFree: true };
}



