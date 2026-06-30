/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import {
  mapVerificationRequest,
  mapUploadedDocument,
} from "@/features/verification/services/verificationService";
import { DocumentType, UploadedDocument, VerificationRequest } from "@/features/verification/types";

const invokeFunction = async <T>(name: string, body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.data as T;
};

export const verificationMutations = {
  // Step 1a — explicit "Start Verification" action by the property owner.
  async startVerification(propertyId: string): Promise<VerificationRequest> {
    const result = await invokeFunction<Record<string, any>>("start-verification", { propertyId });
    return mapVerificationRequest(result);
  },

  // Step 1b — upload a document to the private Storage bucket, then
  // register the DB row via the register-document edge function.
  async uploadDocument(
    requestId: string,
    file: File,
    docType: DocumentType
  ): Promise<UploadedDocument> {
    const ext = file.name.split(".").pop();
    const storagePath = `${requestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-documents")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const result = await invokeFunction<Record<string, any>>("register-document", {
      requestId,
      storagePath,
      docType,
    });

    return mapUploadedDocument(result);
  },
};
