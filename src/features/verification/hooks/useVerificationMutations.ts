import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verificationMutations } from "@/features/verification/services/verificationMutations";
import { DocumentType } from "@/features/verification/types";

export const useStartVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => verificationMutations.startVerification(propertyId),
    onSuccess: (request) => {
      queryClient.invalidateQueries({
        queryKey: ["verification-request", "by-property", request.propertyId],
      });
    },
  });
};

export const useUploadDocument = (requestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, docType }: { file: File; docType: DocumentType }) =>
      verificationMutations.uploadDocument(requestId, file, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-documents", requestId] });
      queryClient.invalidateQueries({ queryKey: ["verification-request", requestId] });
    },
  });
};
