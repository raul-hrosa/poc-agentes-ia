export type Patient = {
  id: string
  userId: string
  name: string
  phone: string
  birthDate: Date | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// Projeção usada na listagem (campos mínimos necessários)
export type PatientListItem = Pick<Patient, 'id' | 'name' | 'phone' | 'isActive'>

// Projeção usada no perfil (sem userId e sem deletedAt)
export type PatientProfile = Omit<Patient, 'userId' | 'deletedAt'>

// Tipo retorno de criação/atualização
export type PatientActionResult =
  | { success: true; patientId: string }
  | { error: string }
  | { fieldErrors: Record<string, string[]> }

// Tipo retorno de arquivamento/restauração
export type PatientToggleResult =
  | { success: true }
  | { error: string }
