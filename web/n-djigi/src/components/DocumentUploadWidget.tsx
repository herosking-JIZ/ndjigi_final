import { useState } from 'react'
import { Upload, Check, X, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import api from '@/services/api'
import type { GestionnaireDocumentType, DocumentUploadResponse } from '@/types'

interface DocumentUploadWidgetProps {
  type: GestionnaireDocumentType
  onSuccess: (doc: DocumentUploadResponse) => void
  onError?: (error: string) => void
}

const documentLabels: Record<GestionnaireDocumentType, string> = {
  cnib: 'CNIB',
  casier_judiciaire: 'Casier judiciaire',
  photo_identite: 'Photo d\'identité',
}

export function DocumentUploadWidget({ type, onSuccess, onError }: DocumentUploadWidgetProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      const err = 'Fichier trop gros (max 5 MB)'
      setError(err)
      onError?.(err)
      return
    }

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      const err = 'Type de fichier non autorisé (JPG, PNG, PDF uniquement)'
      setError(err)
      onError?.(err)
      return
    }

    setError(null)
    setUploadedFile(file)
  }

  const handleUpload = async () => {
    if (!uploadedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      // IMPORTANT: Text fields MUST be appended BEFORE the file.
      // Multer parses multipart fields in stream order; if the file arrives
      // before 'type', req.body.type will be undefined when Multer generates
      // the filename, resulting in "unknown" instead of the actual type.
      formData.append('type', type)
      formData.append('fichier', uploadedFile)

      const { data } = await api.post<any>('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const response = data.data as DocumentUploadResponse
      setSuccess(true)
      setUploadedFile(null)
      onSuccess(response)
      toast({
        title: 'Document uploadé',
        description: `${documentLabels[type]} enregistré`,
        variant: 'success',
      })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de l\'upload'
      setError(message)
      onError?.(message)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-foreground">{documentLabels[type]}</span>
        <div className="mt-2 flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            disabled={loading || success}
            className="hidden"
            id={`upload-${type}`}
          />
          <label htmlFor={`upload-${type}`} className="flex flex-col items-center gap-2 cursor-pointer w-full">
            {success ? (
              <>
                <Check className="h-6 w-6 text-green-500" />
                <span className="text-sm text-green-600">Document uploadé</span>
              </>
            ) : loading ? (
              <>
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Upload en cours...</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadedFile ? uploadedFile.name : 'Cliquez pour sélectionner'}
                </span>
              </>
            )}
          </label>
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {uploadedFile && !success && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Upload...' : 'Confirmer'}
        </button>
      )}
    </div>
  )
}
