import { BookOpen, CreditCard, FileText, GraduationCap, Paperclip, Shield, type LucideIcon } from 'lucide-react'
import type { DocType } from '@/lib/documents'

/** Icon and one line description for each document type, shared by every student view. */
export const DOC_META: Record<DocType, { icon: LucideIcon; description: string }> = {
  resume: { icon: FileText, description: 'Get an ATS score with feedback' },
  police: { icon: Shield, description: 'Police clearance certificate' },
  aadhaar: { icon: CreditCard, description: 'Identity, only the last four digits of the number are saved' },
  degree: { icon: GraduationCap, description: 'Degree certificate and academic record' },
  marksheet_10th: { icon: BookOpen, description: 'Class X board marksheet' },
  marksheet_12th: { icon: FileText, description: 'Class XII board marksheet' },
  passport: { icon: Paperclip, description: 'Any other credential or certificate' },
}
