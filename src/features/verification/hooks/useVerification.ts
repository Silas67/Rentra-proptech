import { useQuery } from "@tanstack/react-query";
import { verificationService } from "@/features/verification/services/verificationService";
import { VerificationStatus } from "@/features/verification/types";

export const useVerificationRequestByProperty = (propertyId: string | undefined) =>
  useQuery({
    queryKey: ["verification-request", "by-property", propertyId],
    queryFn: () => verificationService.getRequestByProperty(propertyId as string),
    enabled: !!propertyId,
  });

export const useVerificationRequest = (requestId: string | undefined) =>
  useQuery({
    queryKey: ["verification-request", requestId],
    queryFn: () => verificationService.getRequestById(requestId as string),
    enabled: !!requestId,
  });

export const useStaffQueue = (statuses?: VerificationStatus[]) =>
  useQuery({
    queryKey: ["verification-staff-queue", statuses],
    queryFn: () => verificationService.getStaffQueue(statuses),
  });

export const useUploadedDocuments = (requestId: string | undefined) =>
  useQuery({
    queryKey: ["verification-documents", requestId],
    queryFn: () => verificationService.getUploadedDocuments(requestId as string),
    enabled: !!requestId,
  });

export const useSurveyorReport = (requestId: string | undefined) =>
  useQuery({
    queryKey: ["surveyor-report", requestId],
    queryFn: () => verificationService.getSurveyorReport(requestId as string),
    enabled: !!requestId,
  });

export const useAgisSubmission = (requestId: string | undefined) =>
  useQuery({
    queryKey: ["agis-submission", requestId],
    queryFn: () => verificationService.getAgisSubmission(requestId as string),
    enabled: !!requestId,
  });

export const useAgisResult = (requestId: string | undefined) =>
  useQuery({
    queryKey: ["agis-result", requestId],
    queryFn: () => verificationService.getAgisResult(requestId as string),
    enabled: !!requestId,
  });

export const useVerificationReport = (requestId: string | undefined) =>
  useQuery({
    queryKey: ["verification-report", requestId],
    queryFn: () => verificationService.getVerificationReport(requestId as string),
    enabled: !!requestId,
  });
