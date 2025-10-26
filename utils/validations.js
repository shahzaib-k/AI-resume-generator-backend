import {z} from "zod"

export const resumeSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  job_description: z.string().min(1, "Job description is required"),
  field: z.string().min(1, "Field is required"),
  experience: z.string().nullable().optional()
})

