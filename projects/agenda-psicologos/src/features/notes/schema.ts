import { z } from "zod"

export const SessionNoteFormSchema = z.object({
  appointmentId: z.string().uuid("ID da consulta inválido"),
  content: z
    .string()
    .min(1, "O conteúdo do prontuário é obrigatório")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "O conteúdo do prontuário é obrigatório"),
})

export const UpdateSessionNoteSchema = z.object({
  noteId: z.string().uuid("ID do prontuário inválido"),
  content: z
    .string()
    .min(1, "O conteúdo do prontuário é obrigatório")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "O conteúdo do prontuário é obrigatório"),
})

export const DeleteSessionNoteSchema = z.object({
  noteId: z.string().uuid("ID do prontuário inválido"),
})
