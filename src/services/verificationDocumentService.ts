/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import { VerificationDocType, VerificationDocument } from "@/lib/types";

const mapDocument = (d: Record<string, any>): VerificationDocument => ({
  id: d.id,
  verificationId: d.verification_id,
  docType: d.doc_type,
  fileUrl: d.file_url,
  fileName: d.file_name ?? undefined,
  uploadedBy: d.uploaded_by,
  extractedFields: d.extracted_fields ?? {},
  notes: d.notes ?? undefined,
  createdAt: d.created_at,
});

export const verificationDocumentService = {

  // ☁️ Upload the file to storage and return its public URL
  async uploadFile(verificationId: string, file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const fileName = `${verificationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("verification-documents")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("uploadFile error:", error);
      return null;
    }

    const { data } = supabase.storage.from("verification-documents").getPublicUrl(fileName);
    return data.publicUrl;
  },

  async addDocument(payload: {
    verificationId: string;
    docType: VerificationDocType;
    fileUrl: string;
    fileName: string;
    uploadedBy: string;
  }): Promise<VerificationDocument | null> {
    const { data, error } = await supabase
      .from("property_verification_documents")
      .insert({
        verification_id: payload.verificationId,
        doc_type: payload.docType,
        file_url: payload.fileUrl,
        file_name: payload.fileName,
        uploaded_by: payload.uploadedBy,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("addDocument error:", error);
      return null;
    }

    return mapDocument(data);
  },

  async listDocuments(verificationId: string): Promise<VerificationDocument[]> {
    const { data, error } = await supabase
      .from("property_verification_documents")
      .select("*")
      .eq("verification_id", verificationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listDocuments error:", error);
      return [];
    }

    return (data ?? []).map(mapDocument);
  },

  async updateExtractedFields(
    id: string,
    extractedFields: Record<string, string>,
    notes?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from("property_verification_documents")
      .update({ extracted_fields: extractedFields, ...(notes !== undefined && { notes }) })
      .eq("id", id);

    if (error) {
      console.error("updateExtractedFields error:", error);
      return false;
    }

    return true;
  },

  async deleteDocument(id: string): Promise<boolean> {
    const { error } = await supabase.from("property_verification_documents").delete().eq("id", id);

    if (error) {
      console.error("deleteDocument error:", error);
      return false;
    }

    return true;
  },
};
